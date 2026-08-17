// Properties
export const SITE_NAME = "Manas R. Makde"
export const SITE_DOMAIN = "https://manasmakde.com";
export const SEARCH_QUERY = "search";
export const PAGE_QUERY = "page";
export const TAGS_QUERY_PARAM = "tags";


// Blog Properties
export const BLOG_DIR = "/blog/"
export const BLOG_DATA_DIR = "/static/blog-data/"
export const BLOG_DATA_PREFIX = "blog-data-";
export const BLOG_STATS_FILE = "blog-stats.json";
export const BLOG_SEARCH_DIR = "/static/blog-search/";
export const BLOG_PAGEFIND = `${BLOG_SEARCH_DIR}pagefind.js`;
export const ARTICLES_PER_FILE = 500
export const DEFAULT_ARTICLES_METADATA = {
    title: 'Untitled',
    thumbnail: "",
    description: "",
    createdOnDate: null,
    editedOnDate: null,
    searchKeywords: [],
    isSearchable: true,
    toPublish: true,
};


// Snippet Properties
export const SNIPPET_DIR = "/snippets/"
export const SNIPPET_DATA_DIR = "/static/snippets-data/"
export const SNIPPET_DATA_PREFIX = "snippet-data-";
export const SNIPPET_STATS_FILE = "snippets-stats.json";
export const SNIPPET_SEARCH_DIR = "/static/snippets-search/";
export const SNIPPET_PAGEFIND = `${SNIPPET_SEARCH_DIR}pagefind.js`;
export const SNIPPETS_PER_FILE = 500
export const DEFAULT_SNIPPETS_METADATA = {
    title: 'Untitled',
    thumbnail: "",
    createdOnDate: null,
    editedOnDate: null,
    tags: [],
    searchKeywords: [],
    isSearchable: true,
    toPublish: true,
};


// Utility Method
export function getSearchQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(SEARCH_QUERY) ?? "";
}
export function getPageNumFromUrl() {
    const pageNumber = Number(new URLSearchParams(window.location.search).get(PAGE_QUERY)) || 1;
    return Math.max(pageNumber, 1);
}
export function getTagsQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let tagsString = urlParams.get(TAGS_QUERY_PARAM)
    return tagsString?.split(",").filter(Boolean) ?? [];
}
export function formatDate(dateInput) {

    // Return if invalid
    if (dateInput === undefined || dateInput === null) {
        return "";
    }


    // Check if can be casted to Date type
    let checkDateInput = new Date(dateInput);
    if (isNaN(checkDateInput.getTime())) {
        return dateInput;
    }


    // Format if of Date type
    const formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return formatter.format(checkDateInput);
}
export function getCleanDomain(domain) {

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
export function isAbsUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false
    }
}
export function normalizeUrl(url) {
    return url.replace(/\\/g, "/")
}
export function resolveUrl(url, baseUrl, fallbackUrl = "") {

    // Return if absolute url
    if (isAbsUrl(url)) {
        return url
    }


    // Return fallback url
    if (!url) {
        return fallbackUrl
    }


    // normalize backslashes before trimming slashes
    const normalizedBaseUrl = normalizeUrl(baseUrl)
    const normalizedUrl = normalizeUrl(url)
    const cleanBaseUrl = normalizedBaseUrl.replace(/\/+$/, '')
    const cleanUrl = normalizedUrl.replace(/^\/+/, '')

    return `${cleanBaseUrl}/${cleanUrl}`
}
