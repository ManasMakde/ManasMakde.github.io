import fs from "fs";
import util from "util";
import path from "path";
import * as esbuild from "esbuild";
import * as pagefind from "pagefind";
import { parseHTML } from 'linkedom';
import languages from "./static/js/languages.js";
import rehypeHighlight from "rehype-highlight";
import remarkHeadingId from "remark-heading-id";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import { SitemapStream, streamToPromise } from "sitemap";
import { SITE_DOMAIN } from "./static/js/global.js";


// To-Set Properties
const HOME_PAGE = "index.html";
const BLOG_POSTS_SELECTOR = "#blog-posts-content";
const BLOG_MORE_SELECTOR = "#blog-more";
const BLOG_POSTS_COUNT = 3;
const SNIPPET_CARD_CLASS = "card";
const SNIPPETS_DIR = "/blog/";
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
let snippetsMetaData = {};  // Format { "abs/path/to/snippet" : { title, description, thumbnail, author, authorWebsite, }, ... }
let isMetaDataDirty = false;


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
    if (!fs.existsSync(targetDir)) {
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
    if (!filePath || !fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) {
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
    const snippetsList = Object.values(snippetsMetaData).sort((a, b) => {
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
function injectSnippetsToHome(outputPath) {

    // Get snippets
    const snippets = Object.values(snippetsMetaData).sort((a, b) => {  // Sort Newest First
        const dateA = a.createdOnDate instanceof Date ? a.createdOnDate.getTime() : 0;
        const dateB = b.createdOnDate instanceof Date ? b.createdOnDate.getTime() : 0;
        return dateB - dateA;
    });


    // Return if no home page found
    const indexPath = path.join(outputPath, HOME_PAGE);
    if (!fs.existsSync(indexPath)) {
        console.warn(`${indexPath} not found for build-time snippet injection`);
        return;
    }


    // Return if container for snippets not found
    const html = fs.readFileSync(indexPath, 'utf8');
    const { document } = parseHTML(html);
    const container = document.querySelector(BLOG_POSTS_SELECTOR);
    if (!container) {
        return;
    }


    // Return if no snippets
    const latestSnippets = snippets.slice(0, BLOG_POSTS_COUNT);
    if (latestSnippets.length === 0) {
        document.querySelector(BLOG_MORE_SELECTOR)?.setAttribute('style', 'display: none;');
        fs.writeFileSync(indexPath, document.toString());
        return;
    }
    else {
        document.querySelector(BLOG_MORE_SELECTOR)?.removeAttribute('style');
    }


    // Clear the placeholder cards
    container.innerHTML = "";


    // Add first N snippets
    latestSnippets.forEach(snippet => {

        // Get snippets data
        const thumbnail = snippet?.thumbnail;
        const imgUrl = path.join(snippet?.url, thumbnail);
        const dateStr = snippet.createdOnDate ? new Date(snippet.createdOnDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) : "";


        // Insert Card
        const card = document.createElement("div");
        card.className = SNIPPET_CARD_CLASS;
        card.innerHTML = `
            <a href="${snippet.url || ""}" class="card-image-link">
                <img src="${imgUrl || '/static/placeholder.png'}" alt="thumbnail" fetchpriority="high">
            </a>
            <div class="card-body">
                <a class="card-title" href="${snippet.url || ""}">${snippet.title || "Untitled"}</a>
                <span class="card-date">${dateStr}</span>
                <p class="card-description">${snippet.description || ""}</p>
            </div>`;

        container.appendChild(card);
    });


    // Write into HTML file
    fs.writeFileSync(indexPath, document.toString());
}
async function buildSearchIndex(outputPath) {
    // Add all records
    const { index } = await pagefind.createIndex();
    for (const key in snippetsMetaData) {
        let snippet = snippetsMetaData[key];
        let isUnlisted = snippet?.isUnlisted ?? false;
        if(isUnlisted){
            continue
        }

        let title = snippet?.title ?? UNTITLED_NAME;
        let description = snippet?.description ?? "";
        let thumbnail = snippet?.thumbnail ?? "";
        let date = snippet?.createdOnDate ?? "";
        let keywords = snippet?.keywords ?? [];
        await index.addCustomRecord({
            url: snippet.url,
            content: `${title} ${keywords.join(" ")} ${description}`,
            language: "en",
            meta: { title, thumbnail, description, date },
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


    // Add sitemap to robots.txt if not already added
    const filePath = path.join(outputPath, ROBOTS_TXT_PATH);
    const sitemapLine = `Sitemap: ${SITE_DOMAIN}/sitemap.xml`;
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(sitemapLine)) {
        const newContent = `User-agent: *\n${sitemapLine}\n\n${content}`;
        fs.writeFileSync(filePath, newContent);
    }
}
function createCNAME(outputPath) {
    let filePath = path.join(outputPath, CNAME_FILE)
    let domain = getCleanDomain(SITE_DOMAIN);
    fs.writeFileSync(filePath, domain);
}


// Override Methods
export async function onFileChangeEnd(inputPath, outputPath, inFilePath, outFilePath, wasDeleted, result) {

    // If the file was deleted, Remove from snippets data
    if (wasDeleted && snippetsMetaData.hasOwnProperty(inFilePath)) {
        delete snippetsMetaData[inFilePath];
        isMetaDataDirty = true;
        return;
    }


    // Compress file if js or css
    await compressFile(outFilePath);


    // Return if not snippet file or no meta data 
    let absSnippetsDir = path.join(inputPath, SNIPPETS_DIR)
    let inputFileName = path.basename(inFilePath);
    let metaData = result?.exports?.metaData;
    if (metaData?.isUnlisted ||!metaData || inputFileName != SNIPPETS_INDEX_FILE || !isSubPath(absSnippetsDir, inFilePath)) {
        return;
    }


    // Return if meta data has not changed
    let oldMetaData = snippetsMetaData[inFilePath];
    let newMetaData = { ...result?.exports?.metaData, url: `/${path.dirname(path.relative(inputPath, inFilePath))}/` };
    if (util.isDeepStrictEqual(oldMetaData, newMetaData)) {
        return;
    }


    // Update snippets meta data list
    snippetsMetaData[inFilePath] = newMetaData;
    isMetaDataDirty = true;
}
export async function onSiteCreateEnd(inputPath, outputPath, isSoftReload, wasInterrupted) {

    // Return if site was interrupted while creating
    if (wasInterrupted) {
        return;
    }


    // Create .nojekyll
    createNojekyll(outputPath)


    // Create CNAME file to avoid domain name resetting on every push DO NOT REMOVE
    createCNAME(outputPath);


    // Move up all files from index.js, Intentionally kept before buildSearchIndex() DO NOT CHANGE
    moveUpContents(path.join(outputPath, INDEX_FOLDER));


    // Inject blog posts in homepage 
    injectSnippetsToHome(outputPath);


    // Return if no meta data has been changed
    if (!isMetaDataDirty) {
        return;
    }


    // Create data.json & _stats.json file for all snippets
    createSnippetsData(outputPath);


    // Create a search index
    await buildSearchIndex(outputPath);


    // Create site map
    await generateSitemap(outputPath, SITE_DOMAIN);


    // Unmark dirty
    isMetaDataDirty = false;
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
    let inputDirName = path.dirname(inFilePath)
    let isDirectChild = path.resolve(absSnippetsDir) == path.resolve(inputDirName)
    if (isDirectChild || inputFileName != SNIPPETS_INDEX_FILE || !isSubPath(absSnippetsDir, inFilePath)) {
        return code;
    }


    // Inject snippet into <Snippet /> wrapper
    code = `import Content, { metaData } from "${inFilePath}"; import { Snippet } from "@/components.jsx"; import * as SnippetComponents from "@/components.jsx"; export { metaData } from "${inFilePath}";\n\n<Snippet metaData={metaData}><Content components={SnippetComponents} /></Snippet>`
    return code;
}
export async function toIgnore(inputPath, outputPath, targetPath) {
    const isGOutputStream = /\.goutputstream-\w+$/.test(targetPath);
    if (isGOutputStream) {
        return true;
    }

    return false;
}
