// Properties
export const SITE_NAME = "Manas R. Makde";
export const SITE_MOTTO = "Let's keep it dead simple!";
export const SITE_DESCRIPTION = "Simple reuseable code snippets for your convenience";
export const SITE_CREATION_TOOL = "https://www.npmjs.com/package/host-mdx"
export const SITE_DOMAIN = "https://manasmakde.github.io"
export const SITE_LOGO_PATH = "/static/logo.png"
export const SITE_PREVIEW_IMG = `${SITE_DOMAIN}/static/open-graph.png`;
export const PLACEHOLDER_IMG_PATH = "/static/placeholder.png"
export const PAGE_QUERY = "page";
export const SEARCH_QUERY = "search";
export const PAGEFIND_PATH = "/static/search/pagefind.js"
export const STATS_FILE_PATH = "/static/data/_stats.json"
export const DATA_FILE_PATH_PREFIX = "/static/data/data-"


// Methods
export function getPageNumFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageNumber = Number(urlParams.get(PAGE_QUERY)) || 1;
    return Math.max(pageNumber, 1);
}

export function getSearchQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(SEARCH_QUERY) ?? "";
}

export function gotoPageNumber(pageNumber) {
    const url = new URL(window.location.href);
    url.searchParams.set(PAGE_QUERY, pageNumber);
    window.location.href = url.toString();
}
