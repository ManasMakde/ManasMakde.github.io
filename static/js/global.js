export const SITE_NAME = "Manas R. Makde"
export const SITE_DOMAIN = "https://manasmakde.com";
export const BLOG_DIR = "/blog/"
export const BLOG_DATA_DIR = "/static/blog-data/"
export const BLOG_DATA_PREFIX = "blog-data-";
export const BLOG_STATS_FILE = "blog-stats.json";
export const BLOG_SEARCH_DIR = "/static/blog-search/";
export const BLOG_PAGEFIND = `${BLOG_SEARCH_DIR}pagefind.js`;
export const ARTICLES_PER_FILE = 500
export const SEARCH_QUERY = "search";
export const PAGE_QUERY = "page";
export const DEFAULT_ARTICLES_METADATA = {
    title: 'Unknown',
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
