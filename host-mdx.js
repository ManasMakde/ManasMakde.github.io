import fs from "fs";
import util from "util";
import path from "path";
import * as esbuild from "esbuild";
import * as pagefind from "pagefind";
import languages from "./static/languages.js";
import rehypeHighlight from "rehype-highlight";
import remarkHeadingId from "remark-heading-id";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import { SitemapStream, streamToPromise } from "sitemap";
import { SITE_DOMAIN } from "./static/global.js";


// To Set Properties
const SNIPPETS_DIR = "/blogs/";
const SNIPPETS_INDEX_FILE = "index.mdx";
const SNIPPETS_PER_FILE = 500;
const SNIPPETS_DATA_DIR = "/static/data/";
const SNIPPETS_DATA_PREFIX = "data-";
const SNIPPETS_STATS_FILE = "_stats.json";
const INDEX_FOLDER = "/index";
const SNIPPETS_SEARCH_DIR = "/static/search/";
const UNTITLED_NAME = "Untitled";
const ROBOTS_TXT_PATH = "robots.txt";
const CNAME_FILE = "CNAME";


// Properties
let snippetsCache = {};  // Format { "abs/path/to/snippet" : { title, thumbnail, author, authorWebsite, tags, }, ... }
let updatedSnippets = {};  // Format same as `snippetsCache`
let tagsSet = new Set();  // Necessary for /tags page DO NOT REMOVE 


// Utility Methods
function stripTrailingSep(thePath) {
    if (thePath[thePath.length - 1] === path.sep) {
        return thePath.slice(0, -1);
    }
    return thePath;
}
function isSubPath(potentialParent, thePath) {
    // For inside-directory checking, we want to allow trailing slashes, so normalize.
    thePath = stripTrailingSep(thePath);
    potentialParent = stripTrailingSep(potentialParent);


    // Node treats only Windows as case-insensitive in its path module; we follow those conventions.
    if (process.platform === "win32") {
        thePath = thePath.toLowerCase();
        potentialParent = potentialParent.toLowerCase();
    }


    return thePath.lastIndexOf(potentialParent, 0) === 0 &&
        (
            thePath[potentialParent.length] === path.sep ||
            thePath[potentialParent.length] === undefined
        );
}
function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, allFiles);
        } else {
            allFiles.push(name);
        }
    }
    return allFiles;
}
function getCleanDomain(domain) {
    // Make sure there is a protocol so URL constructor works
    let urlString = domain.includes("://") ? domain : "https://" + domain;


    // Remove www.
    try {
        const url = new URL(urlString);
        return url.hostname.replace(/^www\./, "");
    } catch (e) {
        return "";
    }
}


// Primary Methods
function createNojekyll(outputPath) {
    fs.writeFileSync(path.join(outputPath, '.nojekyll'), "");
}
function moveUpContents(folderPath) {

    // Return if Index dir not found
    const targetDir = path.resolve(folderPath);
    if(!fs.existsSync(targetDir)){
        return;
    }

    
    // Get parent directory
    const parentDir = path.dirname(targetDir);
    const items = fs.readdirSync(targetDir);


    // Move all items up to parent directory
    items.forEach((item) => {
        const oldPath = path.join(targetDir, item);
        const newPath = path.join(parentDir, item);
        fs.renameSync(oldPath, newPath);
    });


    // Remove the empty directory
    fs.rmdirSync(targetDir);
}
async function compressFile(filePath) {

    // Return if not valid file path
    if (!filePath || fs.lstatSync(filePath).isDirectory()) {
        return;
    }


    // Compress .css & .js files
    const fileExt = path.extname(filePath).toLowerCase()
    if (fileExt === ".css") {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        const minified = await esbuild.transform(sourceCode, {
            loader: "css",
            charset: 'utf8',
            minify: true
        });
        fs.writeFileSync(filePath, minified.code);
    }
    else if (fileExt === ".js") {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        const minified = await esbuild.transform(sourceCode, {
            loader: "js",
            charset: 'utf8',
            minifyWhitespace: true,
            minifySyntax: true,
            minifyIdentifiers: false,
        });
        fs.writeFileSync(filePath, minified.code);
    }
}
function createSnippetsData(outputPath) {

    // Sort snippets
    const snippetsList = Object.values(snippetsCache).sort((a, b) => {
        // Sort by Date
        const dateA = a.createdOnDate instanceof Date ? a.createdOnDate.getTime() : 0;
        const dateB = b.createdOnDate instanceof Date ? b.createdOnDate.getTime() : 0;
        if (dateA !== dateB) {
            return dateA - dateB;
        }


        // Fallback sort by title
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleB.localeCompare(titleA);
    });



    // Create data folder
    let absDataDir = path.join(outputPath, SNIPPETS_DATA_DIR);
    if (!fs.existsSync(absDataDir)) {
        fs.mkdirSync(absDataDir);
    }


    // Create site data.json files
    for (let i = 0; i < snippetsList.length; i += SNIPPETS_PER_FILE) {
        const chunk = snippetsList.slice(i, i + SNIPPETS_PER_FILE);
        const jsonContent = JSON.stringify({ snippets: chunk });
        const fileNumber = i / SNIPPETS_PER_FILE;
        const fileName = `${SNIPPETS_DATA_PREFIX}${fileNumber}.json`;
        fs.writeFileSync(path.join(absDataDir, fileName), jsonContent);
    }


    // Create stats file
    let stats = {
        totalSnippets: snippetsList.length,
        snippetsPerFile: SNIPPETS_PER_FILE
    }
    fs.writeFileSync(path.join(outputPath, SNIPPETS_DATA_DIR, SNIPPETS_STATS_FILE), JSON.stringify(stats));
}
async function buildSearchIndex(outputPath) {

    // Add all records
    const { index } = await pagefind.createIndex();
    for (const key in snippetsCache) {
        let snippet = snippetsCache[key];
        let title = snippet?.title ?? UNTITLED_NAME
        let thumbnail = snippet?.thumbnail ?? ""
        let tags = snippet?.tags ?? []
        let keywords = snippet?.keywords ?? []

        await index.addCustomRecord({
            url: snippet.url,
            content: `${title} ${tags.join(" ")} ${keywords.join(" ")}`,
            language: "en",
            meta: { title, thumbnail, tags: tags.join(",") },
            filters: { tags: tags }
        });
    }


    // Save all records
    await index.writeFiles({
        outputPath: path.join(outputPath, SNIPPETS_SEARCH_DIR)
    });
}
async function generateSitemap(outputPath, baseUrl) {

    // Initialization
    const sitemap = new SitemapStream({ hostname: baseUrl });
    const writeStream = fs.createWriteStream(path.join(outputPath, 'sitemap.xml'));
    sitemap.pipe(writeStream);


    // Get all .html files from output path & add to sitemap
    const files = getFiles(outputPath).filter(file => path.extname(file) === '.html');
    for (const file of files) {
        let urlPath = path.relative(outputPath, file)
            .replace(/\\/g, '/') // Ensure forward slashes for URL
            .replace(/index\.html$/, ''); // Remove index.html for clean URLs

        sitemap.write({
            url: urlPath,
            changefreq: 'weekly',
            priority: urlPath === '' ? 1.0 : 0.7
        });
    }


    // End and return site map
    sitemap.end();
    await streamToPromise(sitemap);


    // Add sitemap to robots.txt
    const filePath = path.join(outputPath, ROBOTS_TXT_PATH);
    const sitemapText = `User-agent: *\nSitemap: ${SITE_DOMAIN}/sitemap.xml\n\n`;
    let existingContent = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, sitemapText + existingContent);
}
async function createCNAME(outputPath) {
    let filePath = path.join(outputPath, CNAME_FILE)
    let domain = getCleanDomain(SITE_DOMAIN);
    fs.writeFileSync(filePath, domain);
}


// Override Methods
export async function onFileChangeEnd(inputPath, outputPath, inFilePath, outFilePath, wasDeleted, result) {

    // Compress file if js or css
    await compressFile(outFilePath);


    // Return if not snippet file or no meta data 
    let absSnippetsDir = path.join(inputPath, SNIPPETS_DIR)
    let inputFileName = path.basename(inFilePath);
    if (!result?.exports?.metaData || inputFileName != SNIPPETS_INDEX_FILE || !isSubPath(absSnippetsDir, inFilePath)) {
        return;
    }


    // Make sure all tags are lowercase
    let tags = result?.exports?.metaData?.tags ?? [];
    if (tags.length != 0) {
        result.exports.metaData.tags = tags.map(tag => tag.toLowerCase());
    }


    // Add to snippets list
    updatedSnippets[inFilePath] = {
        ...result?.exports?.metaData,
        url: `/${path.dirname(path.relative(inputPath, inFilePath))}/`
    };


    // Add to tagsSet
    tags.forEach(item => tagsSet.add(item.toLowerCase()))
}

export async function onSiteCreateEnd(inputPath, outputPath, isSoftReload, wasInterrupted) {

    // Return if site was interrupted while creating
    if (wasInterrupted) {
        return;
    }


    // Create .nojekyll
    createNojekyll(outputPath)


    // Move up all files from index.js
    moveUpContents(path.join(outputPath, INDEX_FOLDER));


    // Merge updated snippets into cache
    let wereSnippetsModified = false;
    for (let snippetPath in updatedSnippets) {
        let newSnippetMetaData = updatedSnippets[snippetPath];
        let oldSnippetMetaData = snippetsCache?.[snippetPath];
        if (!util.isDeepStrictEqual(newSnippetMetaData, oldSnippetMetaData)) {
            wereSnippetsModified = true;
            snippetsCache[snippetPath] = newSnippetMetaData;
        }
    }


    // Reset updates
    updatedSnippets = {};


    // Create data.json & _stats.json file for all snippets
    if (wereSnippetsModified) {
        createSnippetsData(outputPath);
    }


    // Create a search index
    await buildSearchIndex(outputPath);


    // Create site map
    await generateSitemap(outputPath, SITE_DOMAIN);


    // Create CNAME file to avoid domain name resetting on every push DO NOT REMOVE
    await createCNAME(outputPath);
}

export function modBundleMDXSettings(inputPath, outputPath, settings) {

    // Build options
    var oldBuildOptions = settings.esbuildOptions;
    settings.esbuildOptions = (options) => {
        options = oldBuildOptions(options)
        options.logLevel = 'error';
        options.alias = {
            ...options.alias,
            '@': inputPath, // Maps '@' to your project root
        };

        return options;
    }


    // mdx options
    var oldMdxOptions = settings.mdxOptions;
    settings.mdxOptions = (options) => {
        options = oldMdxOptions(options);
        options.remarkPlugins = [
            ...(options.remarkPlugins ?? []),
            [remarkHeadingId, { defaults: true }],
        ];
        options.rehypePlugins = [
            ...(options.rehypePlugins ?? []),
            [rehypeHighlight, {
                languages
            }],
            [rehypeMdxCodeProps, { tagName: 'code' }]
        ]

        return options
    }

    return settings
}

export function modMDXCode(inputPath, outputPath, inFilePath, outFilePath, code) {

    // Return if not snippet file
    let absSnippetsDir = path.join(inputPath, SNIPPETS_DIR)
    let inputFileName = path.basename(inFilePath);
    if (inputFileName != SNIPPETS_INDEX_FILE || !isSubPath(absSnippetsDir, inFilePath)) {
        return code;
    }


    // Inject snippet into <Snippet /> wrapper
    code = `import Content, { metaData } from "${inFilePath}"; import { Snippet } from "@/components.jsx"; export { metaData } from "${inFilePath}";\n\n<Snippet metaData={metaData}><Content /></Snippet>`


    return code;
}

export async function toIgnore(inputPath, outputPath, targetPath) {
    const isGOutputStream = /\.goutputstream-\w+$/.test(targetPath);
    if (isGOutputStream) {
        return true;
    }

    return false;
}