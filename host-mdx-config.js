import fs from "fs";
import util from "util";
import path from "path";
import * as esbuild from "esbuild";
import * as pagefind from "pagefind";
import { parseHTML } from 'linkedom';
import rehypeHighlight from "rehype-highlight";
import remarkHeadingId from "remark-heading-id";
import languages from "./static/js/languages.js";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import { SitemapStream, streamToPromise, XMLToSitemapIndexStream } from "sitemap";
import { BLOG_DIR, BLOG_DATA_DIR, BLOG_DATA_PREFIX, BLOG_STATS_FILE, BLOG_SEARCH_DIR, ARTICLES_PER_FILE, DEFAULT_ARTICLES_METADATA } from "./static/js/global.js"
import { SNIPPET_DIR, SNIPPET_DATA_DIR, SNIPPET_DATA_PREFIX, SNIPPET_STATS_FILE, SNIPPET_SEARCH_DIR, SNIPPETS_PER_FILE, DEFAULT_SNIPPETS_METADATA, } from "./static/js/global.js"
import { SITE_DOMAIN, getCleanDomain, formatDate, normalizeUrl, resolveUrl } from "./static/js/global.js"


// To-Set Properties
const HOME_PAGE = "index.html";
const INDEX_FOLDER = "/index";
const ROBOTS_TXT_PATH = "robots.txt";
const CNAME_FILE = "CNAME";


// Blog Properties
const LATEST_ARTICLES_COUNT = 3;
const PLACEHOLDER_ARTICLE_IMAGE = "/static/placeholder.png"
const LATEST_ARTICLES_SELECTOR = "#blog-posts-content"
const LATEST_ARTICLES_HEADER_SELECTOR = "#latest-blog-posts"
const ARTICLE_PREVIEW_SELECTOR = ".article-preview"
const SEE_ALL_ARTICLES_SELECTOR = "#see-all-articles"
const ARTICLE_PREVIEW_IMG_LINK_SELECTOR = ".article-preview-image-link"
const ARTICLE_PREVIEW_TITLE_SELECTOR = ".article-preview-title"
const ARTICLE_PREVIEW_DATE_SELECTOR = ".article-preview-date"
const ARTICLE_PREVIEW_DESCRIPTION_SELECTOR = ".article-preview-description"
const ARTICLE_PREVIEW_TITLE_LINK_SELECTOR = ".article-preview-title-link"
let articlesMetadata = {};  // Format { "abs/path/to/article" : { title, thumbnail, ... }, ... }
let areArticlesDirty = true;


// Snippet Properties
const LATEST_SNIPPETS_COUNT = 3;
const PLACEHOLDER_SNIPPET_IMAGE = "/static/placeholder.png"
const LATEST_SNIPPETS_SELECTOR = "#snippets-content"
const LATEST_SNIPPETS_HEADER_SELECTOR = "#latest-snippets"
const SNIPPET_PREVIEW_SELECTOR = ".snippet-preview"
const SEE_ALL_SNIPPETS_SELECTOR = "#see-all-snippets"
const SNIPPET_PREVIEW_IMG_LINK_SELECTOR = ".snippet-preview-thumbnail"
const SNIPPET_PREVIEW_TITLE_LINK_SELECTOR = ".snippet-preview-title"
let snippetsMetadata = {};  // Format { "abs/path/to/snippet" : { title, thumbnail, tags, ... }, ... }
let areSnippetsDirty = true;


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


// Blog Methods
function isArticle(inputPath, inFilePath) {
    const absBlogDir = path.join(inputPath, BLOG_DIR);
    const relativePath = path.relative(absBlogDir, inFilePath)
    return !(relativePath.startsWith('..') || path.isAbsolute(relativePath) || !relativePath.includes(path.sep))
}
function updateArticles(inputPath, inFilePath, wasDeleted, result) {

    // Return If the file was deleted
    if (wasDeleted && articlesMetadata.hasOwnProperty(inFilePath)) {
        delete articlesMetadata[inFilePath];
        areArticlesDirty = true;
        return;
    }


    // Return if not article file
    if (!isArticle(inputPath, inFilePath)) {
        return
    }


    // Return if no metadata
    if (!result?.exports?.metadata) {
        return
    }


    // Return if meta data has not changed
    let oldMetadata = articlesMetadata[inFilePath]
    let url = normalizeUrl(`/${path.dirname(path.relative(inputPath, inFilePath))}/`)
    let newMetadata = { ...result?.exports?.metadata, url }
    if (util.isDeepStrictEqual(oldMetadata, newMetadata)) {
        return;
    }


    // Remove if not to be published
    if (newMetadata?.toPublish === false) {
        delete articlesMetadata[inFilePath];
    }
    else {  // Add/Update meta data
        articlesMetadata[inFilePath] = newMetadata;
    }


    // Mark articles as "dirty" i.e. to be all updated later
    areArticlesDirty = true;
}
function createArticlesData(outputPath) {

    // Sort articles by date/title
    const articlesList = Object.values(articlesMetadata).sort((a, b) => {

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
    let absDataDir = path.join(outputPath, BLOG_DATA_DIR);
    if (!fs.existsSync(absDataDir)) {
        fs.mkdirSync(absDataDir);
    }


    // Create site data.json files
    for (let i = 0; i < articlesList.length; i += ARTICLES_PER_FILE) {
        const chunk = articlesList.slice(i, i + ARTICLES_PER_FILE);
        const jsonContent = JSON.stringify({ articles: chunk });
        const fileNumber = i / ARTICLES_PER_FILE;
        const fileName = `${BLOG_DATA_PREFIX}${fileNumber}.json`;
        fs.writeFileSync(path.join(absDataDir, fileName), jsonContent);
    }


    // Create stats file
    let stats = {
        totalArticles: articlesList.length,
        articlesPerFile: ARTICLES_PER_FILE
    }
    fs.writeFileSync(path.join(outputPath, BLOG_DATA_DIR, BLOG_STATS_FILE), JSON.stringify(stats));
}
async function buildArticleSearchIndex(outputPath) {

    // Add all records
    const { index } = await pagefind.createIndex();
    for (const key in articlesMetadata) {

        // Skip if not searchable
        let article = { ...DEFAULT_ARTICLES_METADATA, ...articlesMetadata[key] };
        if (article?.isSearchable === false) {
            continue
        }


        // Make all meta values string for Pagefind
        const stringMeta = {};
        for (const metaKey in article) {
            let value = article[metaKey];
            if (Array.isArray(value)) {
                value = value.join(",")
            } else if (value instanceof Date) {
                value = value.toISOString()
            } else if (typeof value !== "string") {
                value = String(value)
            }
            stringMeta[metaKey] = value;
        }


        // Add record
        const normalizedUrl = normalizeUrl(article.url);
        await index.addCustomRecord({
            url: normalizedUrl,
            content: `${article.title} ${article.searchKeywords.join(" ")}`,
            meta: stringMeta,
            language: "en",
        });
    }


    // Save all records
    await index.writeFiles({
        outputPath: path.join(outputPath, BLOG_SEARCH_DIR)
    });
}
function modArticleWrapper(inputPath, outputPath, inFilePath, outFilePath, code) {
    const normalizedInFilePath = inFilePath.replaceAll(path.sep, '/');
    return `import Content, { metadata } from "${normalizedInFilePath}"; import { BlogArticle } from "@/components.jsx"; import * as BlogArticleComponents from "@/components.jsx"; export { metadata } from "${normalizedInFilePath}";\n\n<BlogArticle metadata={metadata}><Content components={BlogArticleComponents} /></BlogArticle>`
}
function injectLatestArticles(outputPath) {

    // Get articles
    const articles = Object.values(articlesMetadata).sort((a, b) => {  // Sort Newest First
        const dateA = a.createdOnDate instanceof Date ? a.createdOnDate.getTime() : 0;
        const dateB = b.createdOnDate instanceof Date ? b.createdOnDate.getTime() : 0;
        if (dateA !== dateB) {
            return dateB - dateA;
        }


        // Fallback sort alphabetically by title
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
    });


    // Return if no home page found
    const indexPath = path.join(outputPath, HOME_PAGE);
    if (!fs.existsSync(indexPath)) {
        console.warn(`${indexPath} not found for build-time article injection`);
        return;
    }


    // Return if "latest blog posts" not found
    const html = fs.readFileSync(indexPath, 'utf8');
    const { document } = parseHTML(html);
    const container = document.querySelector(LATEST_ARTICLES_SELECTOR);
    if (!container) {
        return;
    }


    // Return if no articles
    const latestArticles = articles.slice(0, LATEST_ARTICLES_COUNT);
    if (latestArticles.length === 0) {
        document.querySelector(LATEST_ARTICLES_HEADER_SELECTOR)?.remove(); // Remove header
        document.querySelector(LATEST_ARTICLES_SELECTOR)?.remove(); // Remove container
        document.querySelector(SEE_ALL_ARTICLES_SELECTOR)?.remove(); // Remove see all
        fs.writeFileSync(indexPath, document.toString());
        return;
    }


    // Return if no placeholder templates found
    const placeholderTemplates = Array.from(container.querySelectorAll(ARTICLE_PREVIEW_SELECTOR));
    const previewTemplate = placeholderTemplates[0];
    if (!previewTemplate) {
        console.warn(`No template article preview found in ${indexPath}`);
        return;
    }


    // Add first N articles
    latestArticles.forEach(article => {

        // Clone template instead of using innerHTML
        const preview = previewTemplate.cloneNode(true);


        // Fill image link
        const imageLink = preview.querySelector(ARTICLE_PREVIEW_IMG_LINK_SELECTOR);
        imageLink.setAttribute("href", article?.url ?? "");


        // Fill image
        const thumbnail = resolveUrl(article?.thumbnail, article?.url, PLACEHOLDER_ARTICLE_IMAGE)
        const img = preview.querySelector("img");
        img.setAttribute("src", thumbnail);
        img.setAttribute("alt", "thumbnail");
        img.setAttribute("fetchpriority", "high");


        // Fill title link
        const titleLinkEl = preview.querySelector(ARTICLE_PREVIEW_TITLE_LINK_SELECTOR);
        titleLinkEl.setAttribute("href", article?.url ?? "");


        // Fill title
        const titleEl = preview.querySelector(ARTICLE_PREVIEW_TITLE_SELECTOR);
        titleEl.textContent = article?.title ?? "";


        // Fill date
        const dateEl = preview.querySelector(ARTICLE_PREVIEW_DATE_SELECTOR);
        const postedDateStr = formatDate(article?.createdOnDate);
        dateEl.textContent = postedDateStr;


        // Fill description
        const descEl = preview.querySelector(ARTICLE_PREVIEW_DESCRIPTION_SELECTOR);
        descEl.textContent = article?.description ?? "";


        // Insert before first placeholder to preserve its position in markup
        container.insertBefore(preview, previewTemplate);
    });


    // Remove all placeholder templates
    placeholderTemplates.forEach(placeholder => placeholder.remove());


    // Write into HTML file
    fs.writeFileSync(indexPath, document.toString());
}


// Snippet Methods
function isSnippet(inputPath, inFilePath) {
    const absSnippetPath = path.join(inputPath, SNIPPET_DIR);
    const relSnippetPath = path.relative(absSnippetPath, inFilePath)
    return !(relSnippetPath.startsWith('..') || path.isAbsolute(relSnippetPath) || !relSnippetPath.includes(path.sep))
}
function updateSnippets(inputPath, inFilePath, wasDeleted, result) {

    // Return If the file was deleted
    if (wasDeleted && snippetsMetadata.hasOwnProperty(inFilePath)) {
        delete snippetsMetadata[inFilePath];
        areSnippetsDirty = true;
        return;
    }


    // Return if not snippet file
    if (!isSnippet(inputPath, inFilePath)) {
        return
    }


    // Return if no metadata
    if (!result?.exports?.metadata) {
        return
    }


    // Return if meta data has not changed
    let oldMetadata = snippetsMetadata[inFilePath]
    let url = normalizeUrl(`/${path.dirname(path.relative(inputPath, inFilePath))}/`)
    let newMetadata = { ...result?.exports?.metadata, url }
    if (util.isDeepStrictEqual(oldMetadata, newMetadata)) {
        return;
    }


    // Remove if not to be published
    if (newMetadata?.toPublish === false) {
        delete snippetsMetadata[inFilePath];
    }
    else {  // Add/Update meta data
        snippetsMetadata[inFilePath] = newMetadata;
    }


    // Mark snippets as "dirty" i.e. to be all updated later
    areSnippetsDirty = true;
}
function createSnippetsData(outputPath) {

    // Sort snippets by date/title
    const snippetsList = Object.values(snippetsMetadata).sort((a, b) => {

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
    let absDataDir = path.join(outputPath, SNIPPET_DATA_DIR);
    if (!fs.existsSync(absDataDir)) {
        fs.mkdirSync(absDataDir);
    }


    // Create site data.json files
    for (let i = 0; i < snippetsList.length; i += SNIPPETS_PER_FILE) {
        const chunk = snippetsList.slice(i, i + SNIPPETS_PER_FILE);
        const jsonContent = JSON.stringify({ snippets: chunk });
        const fileNumber = i / SNIPPETS_PER_FILE;
        const fileName = `${SNIPPET_DATA_PREFIX}${fileNumber}.json`;
        fs.writeFileSync(path.join(absDataDir, fileName), jsonContent);
    }


    // Create stats file
    let stats = {
        totalSnippets: snippetsList.length,
        snippetsPerFile: SNIPPETS_PER_FILE
    }
    fs.writeFileSync(path.join(outputPath, SNIPPET_DATA_DIR, SNIPPET_STATS_FILE), JSON.stringify(stats));
}
async function buildSnippetSearchIndex(outputPath) {

    // Add all records
    const { index } = await pagefind.createIndex();
    for (const key in snippetsMetadata) {

        // Skip if not searchable
        let snippet = { ...DEFAULT_SNIPPETS_METADATA, ...snippetsMetadata[key] };
        if (snippet?.isSearchable === false) {
            continue
        }


        // Make all meta values string for Pagefind
        const stringMeta = {};
        for (const metaKey in snippet) {
            let value = snippet[metaKey];
            if (Array.isArray(value)) {
                value = value.join(",")
            } else if (value instanceof Date) {
                value = value.toISOString()
            } else if (typeof value !== "string") {
                value = String(value)
            }
            stringMeta[metaKey] = value;
        }


        // Add record
        const normalizedUrl = normalizeUrl(snippet.url);
        await index.addCustomRecord({
            url: normalizedUrl,
            content: `${snippet.title} ${snippet.searchKeywords.join(" ")}`,
            meta: stringMeta,
            filters: { tags: snippet?.tags ?? [] },
            language: "en",
        });
    }


    // Save all records
    await index.writeFiles({
        outputPath: path.join(outputPath, SNIPPET_SEARCH_DIR)
    });
}
function modSnippetWrapper(inputPath, outputPath, inFilePath, outFilePath, code) {
    const normalizedInFilePath = inFilePath.replaceAll(path.sep, '/');
    return `import Content, { metadata } from "${normalizedInFilePath}"; import { Snippet } from "@/components.jsx"; import * as SnippetComponents from "@/components.jsx"; export { metadata } from "${normalizedInFilePath}";\n\n<Snippet metadata={metadata}><Content components={SnippetComponents} /></Snippet>`
}
function injectLatestSnippets(outputPath) {

    // Get snippets
    const snippets = Object.values(snippetsMetadata).sort((a, b) => {  // Sort Newest First
        const dateA = a.createdOnDate instanceof Date ? a.createdOnDate.getTime() : 0;
        const dateB = b.createdOnDate instanceof Date ? b.createdOnDate.getTime() : 0;
        if (dateA !== dateB) {
            return dateB - dateA;
        }


        // Fallback sort alphabetically by title
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
    });


    // Return if no home page found
    const indexPath = path.join(outputPath, HOME_PAGE);
    if (!fs.existsSync(indexPath)) {
        console.warn(`${indexPath} not found for build-time snippet injection`);
        return;
    }


    // Return if latest snippets container not found
    const html = fs.readFileSync(indexPath, 'utf8');
    const { document } = parseHTML(html);
    const container = document.querySelector(LATEST_SNIPPETS_SELECTOR);
    if (!container) {
        return;
    }


    // Return if no snippets
    const latestSnippets = snippets.slice(0, LATEST_SNIPPETS_COUNT);
    if (latestSnippets.length === 0) {
        document.querySelector(LATEST_SNIPPETS_HEADER_SELECTOR)?.remove(); // Remove header
        document.querySelector(LATEST_SNIPPETS_SELECTOR)?.remove(); // Remove container
        document.querySelector(SEE_ALL_SNIPPETS_SELECTOR)?.remove(); // Remove see all
        fs.writeFileSync(indexPath, document.toString());
        return;
    }


    // Return if no placeholder templates found
    const placeholderTemplates = Array.from(container.querySelectorAll(SNIPPET_PREVIEW_SELECTOR));
    const previewTemplate = placeholderTemplates[0];
    if (!previewTemplate) {
        console.warn(`No template snippet preview found in ${indexPath}`);
        return;
    }


    // Add first N snippets
    latestSnippets.forEach(snippet => {

        // Clone template instead of using innerHTML
        const preview = previewTemplate.cloneNode(true);


        // Fill image link
        const imageLink = preview.querySelector(SNIPPET_PREVIEW_IMG_LINK_SELECTOR);
        imageLink.setAttribute("href", snippet?.url ?? "");


        // Fill image
        const thumbnail = resolveUrl(snippet?.thumbnail, snippet?.url, PLACEHOLDER_SNIPPET_IMAGE)
        const img = preview.querySelector("img");
        img.setAttribute("src", thumbnail);
        img.setAttribute("alt", "thumbnail");
        img.setAttribute("fetchpriority", "high");


        // Fill title link
        const titleLinkEl = preview.querySelector(SNIPPET_PREVIEW_TITLE_LINK_SELECTOR);
        titleLinkEl.setAttribute("href", snippet?.url ?? "");


        // Fill title
        const titleTextEl = titleLinkEl.querySelector("div");
        titleTextEl.textContent = snippet?.title ?? "";


        // Insert before first placeholder to preserve its position in markup
        container.insertBefore(preview, previewTemplate);
    });


    // Remove all placeholder templates now that real previews are in place
    placeholderTemplates.forEach(placeholder => placeholder.remove());


    // Write into HTML file
    fs.writeFileSync(indexPath, document.toString());
}


// Override Methods
export async function onFileChangeEnd(inputPath, outputPath, inFilePath, outFilePath, wasDeleted, result) {

    // Compress file if js or css
    await compressFile(outFilePath);


    // update article metadata
    updateArticles(inputPath, inFilePath, wasDeleted, result);


    // update snippet metadata
    updateSnippets(inputPath, inFilePath, wasDeleted, result);
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


    // Create article data & search index
    if (areArticlesDirty) {
        createArticlesData(outputPath)
        await buildArticleSearchIndex(outputPath)
        injectLatestArticles(outputPath)
    }


    // Create article data & search index
    if (areSnippetsDirty) {
        createSnippetsData(outputPath)
        await buildSnippetSearchIndex(outputPath)
        injectLatestSnippets(outputPath)
    }


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


    // Mdx options
    var oldMdxOptions = settings.mdxOptions;
    settings.mdxOptions = (options) => {
        options = oldMdxOptions(options);
        options.remarkPlugins = [
            ...(options.remarkPlugins ?? []),
            [remarkHeadingId, { defaults: true }],
        ];
        options.rehypePlugins = [
            ...(options.rehypePlugins ?? []),
            [rehypeHighlight, { languages }],
            [rehypeMdxCodeProps, { tagName: 'code' }]
        ]

        return options
    }

    return settings
}
export function modMDXCode(inputPath, outputPath, inFilePath, outFilePath, code) {

    // Add wrapper to article code
    if (isArticle(inputPath, inFilePath)) {
        return modArticleWrapper(inputPath, outputPath, inFilePath, outFilePath, code);
    }


    // Add wrapper to snippet code
    if (isSnippet(inputPath, inFilePath)) {
        return modSnippetWrapper(inputPath, outputPath, inFilePath, outFilePath, code);
    }

    return code
}
export async function toIgnore(inputPath, outputPath, targetPath) {
    const isGOutputStream = /\.goutputstream-\w+$/.test(targetPath);
    if (isGOutputStream) {
        return true;
    }

    return false;
}
