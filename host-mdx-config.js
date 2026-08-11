import fs from "fs";
import util from "util";
import path from "path";
import * as esbuild from "esbuild";
import * as pagefind from "pagefind";
import remarkHeadingId from "remark-heading-id";
import { SitemapStream, streamToPromise } from "sitemap";


// To-Set Properties
const SITE_DOMAIN = "https://manasmakde.github.io";
const HOME_PAGE = "index.html";
const INDEX_FOLDER = "/index";
const ROBOTS_TXT_PATH = "robots.txt";
const CNAME_FILE = "CNAME";


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
    if (wasDeleted) {
        return;
    }


    // Compress file if js or css
    await compressFile(outFilePath);
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


    // Create site map
    await generateSitemap(outputPath, SITE_DOMAIN);
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
        return options
    }

    return settings
}
export async function toIgnore(inputPath, outputPath, targetPath) {
    const isGOutputStream = /\.goutputstream-\w+$/.test(targetPath);
    if (isGOutputStream) {
        return true;
    }

    return false;
}
