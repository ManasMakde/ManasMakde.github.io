import { SNIPPET_DATA_DIR, SNIPPET_PAGEFIND, SNIPPET_DATA_PREFIX, SNIPPET_STATS_FILE } from "/static/js/global.js"
import { BLOG_DATA_DIR, BLOG_PAGEFIND, BLOG_DATA_PREFIX, BLOG_STATS_FILE } from "/static/js/global.js"
import { SEARCH_QUERY, PAGE_QUERY, getSearchQueryFromUrl, getTagsQueryFromUrl } from "/static/js/global.js"


// Enums
export const CONTENT_TYPE = Object.freeze({
    ARTICLE: "article",
    SNIPPET: "snippet"
});


// Properties
const QUICK_SEARCH_DELAY = 300;  // Amount to wait before quick searching
const DEFAULT_QUICK_SEARCH_COUNT = 5;
const SEARCH_BAR_SELECTOR = ".searchbar";
const SEARCH_INPUT_SELECTOR = ".searchbar input";
const SEARCH_BTN_SELECTOR = ".searchbar-btn";
const SEARCH_RESULT_CONTAINER_SELECTOR = ".searchbar-results";
const SEARCH_MORE_SELECTOR = ".searchbar-more";
const SEARCH_NONEFOUND_SELECTOR = ".searchbar-nonefound";
const SEARCH_LOADING_SELECTOR = ".searchbar-loading";


// Article Properties
const ERROR_LOADING_ARTICLES = "Error loading articles"
const NO_ARTICLES_MESSAGE = "No posts yet, Stay tuned!"
const ARTICLE_PREVIEW_CLASS = "article-preview"
const ARTICLE_PREVIEW_IMG_LINK_CLASS = "article-preview-image-link"
const ARTICLE_PREVIEW_TITLE_CLASS = "article-preview-title"
const ARTICLE_PREVIEW_DATE_CLASS = "article-preview-date"
const ARTICLE_PREVIEW_DESCRIPTION_CLASS = "article-preview-description"
const ARTICLE_PREVIEW_TITLE_LINK_CLASS = "article-preview-title-link"
const ARTICLE_LOADING_CLASS = "loading"
const ARTICLE_PUBLISHED_PREFIX = "Published: "
const ARTICLE_EDITED_PREFIX = "Edited: "
const ARTICLE_SEARCH_PAGE_URL = "/blog/";
let articlePagefind;
let articlePagefindPromise = null;


// Snippet Properties
const ERROR_LOADING_SNIPPETS = "Error loading snippets"
const NO_SNIPPETS_MESSAGE = "No posts yet, Stay tuned!"
const SNIPPET_PREVIEW_CLASS = "snippet-preview"
const SNIPPET_PREVIEW_IMG_LINK_CLASS = "snippet-preview-image-link"
const SNIPPET_PREVIEW_TITLE_CLASS = "snippet-preview-title"
const SNIPPET_PREVIEW_DATE_CLASS = "snippet-preview-date"
const SNIPPET_PREVIEW_DESCRIPTION_CLASS = "snippet-preview-description"
const SNIPPET_PREVIEW_TITLE_LINK_CLASS = "snippet-preview-title-link"
const SNIPPET_LOADING_CLASS = "loading"
const SNIPPET_PUBLISHED_PREFIX = "Published: "
const SNIPPET_EDITED_PREFIX = "Edited: "
const SNIPPET_SEARCH_PAGE_URL = "/snippets/";
let snippetPagefind;
let snippetPagefindPromise = null;


// Article Search Methods
async function fetchDefaultArticles(resultCount, skipCount = 0) {

    // Get stats
    const statsResponse = await fetch(`${BLOG_DATA_DIR}${BLOG_STATS_FILE}`);
    const stats = await statsResponse.json();


    // Setup variables
    const { totalArticles, articlesPerFile } = stats;
    let articles = [];
    let totalFiles = Math.ceil(totalArticles / articlesPerFile);
    let remainderArticles = totalArticles % articlesPerFile;
    remainderArticles = remainderArticles || articlesPerFile;  // Round back reminder 0 to articlesPerFile
    let deficitArticles = articlesPerFile - remainderArticles;
    let skipFiles = Math.trunc((skipCount + deficitArticles) / articlesPerFile);
    let skipIndex = (skipCount + deficitArticles) % articlesPerFile;


    // Iterate and fetch articles
    for (let i = totalFiles - skipFiles - 1; 0 <= i && articles.length < resultCount; i--) {

        // Fetch articles
        const dataResponse = await fetch(`${BLOG_DATA_DIR}${BLOG_DATA_PREFIX}${i}.json`);
        const data = await dataResponse.json();


        // Add fetched articles to list
        for (let j = articlesPerFile - skipIndex - 1; 0 <= j && articles.length < resultCount; j--) {
            articles.push(data.articles[j]);
        }


        // Reset skip index
        skipIndex = 0;
    }

    return {
        articles,  // Articles data within resultCount
        totalArticles: totalArticles   // Total available articles
    };
}
async function fetchArticlesUnsafe(searchQuery, resultCount, skipCount) {

    // fetch & return default articles if no query is provided
    if (!searchQuery) {
        return await fetchDefaultArticles(resultCount, skipCount);
    }


    // Wait for articlePagefind if not initialized
    const pf = await initArticlePagefind();


    // Get all search results
    const search = await pf.search(searchQuery || null, {});  // Intentionally adding null otherwise results don't show up DO NOT CHANGE


    // Iterate through search results 
    const resultRange = search.results.slice(skipCount, skipCount + resultCount);
    const articles = await Promise.all(resultRange.map(async (res) => {
        const data = await res.data();
        return {
            url: data?.url ?? "",
            ...(data?.meta ?? {})
        };
    }));


    return { articles, totalArticles: search.results.length };
}
export async function fetchArticles(searchQuery, resultCount, skipCount = 0) {
    try {
        return await fetchArticlesUnsafe(searchQuery, resultCount, skipCount);
    }
    catch (err) {
        console.error("Failed to fetch articles:", err);
        return { articles: [], totalArticles: 0 };
    }
}
export async function initArticlePagefind() {

    if (!articlePagefindPromise) {
        articlePagefindPromise = (async () => {
            articlePagefind = await import(BLOG_PAGEFIND);
            await articlePagefind.init();
            return articlePagefind;
        })();
    }

    return articlePagefindPromise;
}


// Snippet Search Methods
async function fetchDefaultSnippets(resultCount, skipCount = 0) {

    // Get stats
    const statsResponse = await fetch(`${SNIPPET_DATA_DIR}${SNIPPET_STATS_FILE}`);
    const stats = await statsResponse.json();


    // Setup variables
    const { totalSnippets, snippetsPerFile } = stats;
    let snippets = [];
    let totalFiles = Math.ceil(totalSnippets / snippetsPerFile);
    let remainderSnippets = totalSnippets % snippetsPerFile;
    remainderSnippets = remainderSnippets || snippetsPerFile;  // Round back reminder 0 to snippetsPerFile
    let deficitSnippets = snippetsPerFile - remainderSnippets;
    let skipFiles = Math.trunc((skipCount + deficitSnippets) / snippetsPerFile);
    let skipIndex = (skipCount + deficitSnippets) % snippetsPerFile;


    // Iterate and fetch snippets
    for (let i = totalFiles - skipFiles - 1; 0 <= i && snippets.length < resultCount; i--) {

        // Fetch snippets
        const dataResponse = await fetch(`${SNIPPET_DATA_DIR}${SNIPPET_DATA_PREFIX}${i}.json`);
        const data = await dataResponse.json();


        // Add fetched snippets to list
        for (let j = snippetsPerFile - skipIndex - 1; 0 <= j && snippets.length < resultCount; j--) {
            snippets.push(data.snippets[j]);
        }


        // Reset skip index
        skipIndex = 0;
    }

    return {
        snippets,  // Snippets data within resultCount
        totalSnippets: totalSnippets   // Total available snippets
    };
}
async function fetchSnippetsUnsafe(searchQuery, resultCount, tags = [], skipCount = 0) {

    // fetch & return default snippets if no query is provided
    if (!searchQuery && tags.length == 0) {
        return await fetchDefaultSnippets(resultCount, skipCount);
    }


    // Wait for snippetPagefind if not initialized
    const pf = await initSnippetPagefind();


    // Get all search results
    let options = tags.length == 0 ? {} : {
        filters: {
            tags: { any: tags }
        }
    };
    const search = await pf.search(searchQuery || null, options);  // Intentionally adding null otherwise results don't show up DO NOT CHANGE


    // Iterate through search results 
    const resultRange = search.results.slice(skipCount, skipCount + resultCount);
    const snippets = await Promise.all(resultRange.map(async (res) => {
        const data = await res.data();
        return {
            url: data?.url ?? "",
            ...(data?.meta ?? {})
        };
    }));


    return { snippets, totalSnippets: search.results.length };
}
export async function fetchSnippets(searchQuery, resultCount, tags = [], skipCount = 0) {
    try {
        return await fetchSnippetsUnsafe(searchQuery, resultCount, tags, skipCount);
    }
    catch (err) {
        console.error("Failed to fetch snippets:", err);
        return { snippets: [], totalSnippets: 0 };
    }
}


export async function initSnippetPagefind() {

    if (!snippetPagefindPromise) {
        snippetPagefindPromise = (async () => {
            snippetPagefind = await import(SNIPPET_PAGEFIND);
            await snippetPagefind.init();
            return snippetPagefind;
        })();
    }

    return snippetPagefindPromise;
}


// Searchbar Methods
function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
    };
}
function populateSearchDropdown(searchPageUrl, searchResultContainer, searchMoreElement, searchNonefoundElement, query = "", items = [], areMoreAvailable = false) {

    // Remove old quick search results
    const oldLinks = searchResultContainer.querySelectorAll('a');
    oldLinks.forEach(link => link.remove());


    // Change display of "show all results"
    searchMoreElement.style.display = areMoreAvailable ? "" : "none";
    searchMoreElement.href = `${searchPageUrl}?${SEARCH_QUERY}=${encodeURIComponent(query)}`;


    // Change display of "No results found"
    searchNonefoundElement.style.display = items.length == 0 && query.length != 0 ? "" : "none";


    // Add new quick search results
    items.forEach(item => {
        const anchor = document.createElement('a');
        anchor.href = item.url;
        anchor.textContent = item.title;
        anchor.title = item.title;
        searchResultContainer.appendChild(anchor);
    });
}
async function fetchQuickSearchItems(type, query, count) {

    // Return early if type is invalid
    if (type !== CONTENT_TYPE.ARTICLE && type !== CONTENT_TYPE.SNIPPET) {
        console.warn("fetchQuickSearchItems: invalid content type", type);
        return [];
    }

    if (type === CONTENT_TYPE.ARTICLE) {
        return (await fetchArticles(query, count)).articles;
    }

    return (await fetchSnippets(query, count)).snippets;
}
function setupQuickSearch(type, searchPageUrl, searchInput, searchResultContainer, searchMore, searchNonefound, searchLoading) {

    let lastSearchId = 0;  // To avoid older quick search request from overriding newer one
    return debounce(async () => {   // Perform quick search after a small duration (to avoid sending redundant requests)

        // Set new search id
        const thisSearchId = ++lastSearchId;


        // Set as loading
        populateSearchDropdown(searchPageUrl, searchResultContainer, searchMore, searchNonefound);  // Hide everything in dropdown
        searchLoading.style.display = "";


        // Get search results
        const query = searchInput.value;
        let quickSearchResults = [];
        if (query !== "") {
            if (type === CONTENT_TYPE.ARTICLE) {
                quickSearchResults = (await fetchArticles(query, DEFAULT_QUICK_SEARCH_COUNT + 1)).articles;
            }
            else {
                quickSearchResults = (await fetchSnippets(query, DEFAULT_QUICK_SEARCH_COUNT + 1)).snippets;
            }
        }
        if (thisSearchId !== lastSearchId) {
            return;
        }


        // Unset as loading
        searchLoading.style.display = "none";


        // Assign found items into dropdown
        let areMoreAvailable = DEFAULT_QUICK_SEARCH_COUNT < quickSearchResults.length;  // Are there more items available than what is shown in quicksearch?
        populateSearchDropdown(searchPageUrl, searchResultContainer, searchMore, searchNonefound, query, quickSearchResults.slice(0, DEFAULT_QUICK_SEARCH_COUNT), areMoreAvailable);

    }, QUICK_SEARCH_DELAY);
}
function setupNavigateSearchDropdown(searchInput, searchResultContainer, searchMore, gotoSearchPage) {
    return (event) => {

        // Get all results and the "show all" link if it's visible
        const results = Array.from(searchResultContainer.querySelectorAll('a'));
        if (searchMore.style.display !== "none") {
            results.push(searchMore);
        }


        // Goto search page enter is pressed
        const currentIndex = results.indexOf(document.activeElement);
        if (event.key === "Enter") {
            gotoSearchPage();
        }
        else if (event.key === "ArrowDown") {
            event.preventDefault();
            const nextIndex = Math.min(currentIndex + 1, results.length - 1);  // clamp within search results count
            results[nextIndex]?.focus();
        }
        else if (event.key === "ArrowUp") {
            event.preventDefault();
            const prevIndex = currentIndex - 1;
            const target = results[prevIndex] || searchInput;  // if index < 0 focus on searchInput
            target.focus();
        }

    };
}
export async function setupSearchBar(type) {

    // Return if type is invalid
    if (type !== CONTENT_TYPE.ARTICLE && type !== CONTENT_TYPE.SNIPPET) {
        console.warn("setupSearchBar: invalid content type", type);
        return;
    }


    // Return if no searchbar
    const searchBar = document.querySelector(SEARCH_BAR_SELECTOR);
    if (!searchBar) {
        console.warn("setupSearchBar: search bar element not found");
        return;
    }


    // Get all elements
    const searchInput = searchBar.querySelector(SEARCH_INPUT_SELECTOR);
    const searchBtn = searchBar.querySelector(SEARCH_BTN_SELECTOR);
    const searchResultContainer = searchBar.querySelector(SEARCH_RESULT_CONTAINER_SELECTOR);
    const searchMore = searchBar.querySelector(SEARCH_MORE_SELECTOR);
    const searchNonefound = searchBar.querySelector(SEARCH_NONEFOUND_SELECTOR);
    const searchLoading = searchBar.querySelector(SEARCH_LOADING_SELECTOR);


    // Add query to input if already searched for
    const searchQuery = getSearchQueryFromUrl();
    searchInput.value = searchQuery;


    // Pick search page url per type
    const searchPageUrl = type === CONTENT_TYPE.ARTICLE ? ARTICLE_SEARCH_PAGE_URL : SNIPPET_SEARCH_PAGE_URL;


    // Creating search functionality
    const gotoSearchPage = () => {
        const query = searchInput.value;
        window.location.href = query ? `${searchPageUrl}?${SEARCH_QUERY}=${encodeURIComponent(query)}` : window.location.pathname;
    };
    const quickSearch = setupQuickSearch(type, searchPageUrl, searchInput, searchResultContainer, searchMore, searchNonefound, searchLoading);
    const navigateSearchDropdown = setupNavigateSearchDropdown(searchInput, searchResultContainer, searchMore, gotoSearchPage);


    // Bind search method with button and input bar
    searchBtn.addEventListener("click", gotoSearchPage);
    searchInput.addEventListener("input", quickSearch);
    searchInput.addEventListener("keydown", navigateSearchDropdown);
    searchMore.addEventListener("keydown", navigateSearchDropdown);
    searchResultContainer.addEventListener("keydown", navigateSearchDropdown);
}
