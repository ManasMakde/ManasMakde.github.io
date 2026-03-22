import { getSearchQueryFromUrl, SEARCH_QUERY, PAGEFIND_PATH, STATS_FILE_PATH, DATA_FILE_PATH_PREFIX } from "/static/global.js";


// Properties
export const QUICK_SEARCH_DELAY = 300;  // Amount to wait before quick searching
export const DEFAULT_QUICK_SEARCH_COUNT = 5;
export const DEFAULT_SEARCH_SELECTORS = {
    searchBar: "#searchbar",
    searchInput: ".search-input",
    searchBtn: ".search-btn",
    searchDropdown: ".search-dropdown",
    searchResultContainer: ".search-results",
    searchMore: ".search-more",
    searchNonefound: ".search-nonefound",
    searchLoading: ".search-loading"
};
let pagefind;
let pagefindPromise = null; // To avoid reinitializing pagefind multiple times


// Utility Methods
async function fetchDefaultSnippets(resultCount, skipCount = 0) {
    // Get stats
    const statsResponse = await fetch(STATS_FILE_PATH);
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
        const dataResponse = await fetch(`${DATA_FILE_PATH_PREFIX}${i}.json`);
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
export async function fetchSnippets(searchQuery, tags = [], resultCount, skipCount = 0) {

    // fetch & return default snippets if no query is provided
    if (!searchQuery && tags.length == 0) {
        return fetchDefaultSnippets(resultCount, skipCount);
    }


    // Wait for pagefind if not initialized
    const pf = await initPagefind();


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
            title: data?.meta?.title ?? "",
            thumbnail: data?.meta?.thumbnail ?? "",
            tags: data?.meta?.tags?.split(",").filter(Boolean) ?? []
        };
    }));


    return { snippets, totalSnippets: search.results.length };
}


// Primary Methods
async function initPagefind() {
    if (!pagefindPromise) {
        pagefindPromise = (async () => {
            pagefind = await import(PAGEFIND_PATH);
            await pagefind.init();
            return pagefind;
        })();
    }
    return pagefindPromise;
}
function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
    };
}
function populateSearchDropdown(searchResultContainer, searchMoreElement, searchNonefoundElement, query = "", snippets = [], areMoreAvailable = false) {

    // Remove old quick search results
    const oldLinks = searchResultContainer.querySelectorAll('a');
    oldLinks.forEach(link => link.remove());


    // Change display of "show all results"
    searchMoreElement.style.display = areMoreAvailable ? "" : "none";
    searchMoreElement.href = `/?${SEARCH_QUERY}=${encodeURIComponent(query)}`;


    // Change display of "No results found"
    searchNonefoundElement.style.display = snippets.length == 0 && query.length != 0 ? "" : "none";


    // Add new quick search results
    snippets.forEach(item => {
        const anchor = document.createElement('a');
        anchor.href = item.url;
        anchor.textContent = item.title;
        anchor.title = item.title;
        searchResultContainer.appendChild(anchor);
    });
}
function setupQuickSearch(searchInput, searchResultContainer, searchMore, searchNonefound, searchLoading) {

    let lastSearchId = 0;  // To avoid older quick search request from overriding newer one
    return debounce(async () => {   // Perform quick search after a small duration (to avoid sending redundant requests)

        // Set new search id
        const thisSearchId = ++lastSearchId;


        // Set as loading
        populateSearchDropdown(searchResultContainer, searchMore, searchNonefound);  // Hide everything in dropdown
        searchLoading.style.display = "";


        // Get search results
        const query = searchInput.value;
        const quickSearchResults = (query === "") ? [] : (await fetchSnippets(query, [], DEFAULT_QUICK_SEARCH_COUNT + 1)).snippets;
        if (thisSearchId !== lastSearchId) {
            return;
        }


        // Unset as loading
        searchLoading.style.display = "none";


        // Assign found snippets into dropdown
        let areMoreAvailable = DEFAULT_QUICK_SEARCH_COUNT < quickSearchResults.length;  // Are there more snippets available than what is shown in quicksearch?
        populateSearchDropdown(searchResultContainer, searchMore, searchNonefound, query, quickSearchResults.slice(0, DEFAULT_QUICK_SEARCH_COUNT), areMoreAvailable);

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
async function setupSearchBar(selectors) {

    // Return if no searchbar
    const searchBar = document.querySelector(selectors.searchBar);
    if (!searchBar) {
        return
    }


    // Get all elements
    const searchInput = searchBar.querySelector(selectors.searchInput);
    const searchBtn = searchBar.querySelector(selectors.searchBtn);
    const searchResultContainer = searchBar.querySelector(selectors.searchResultContainer);
    const searchMore = searchBar.querySelector(selectors.searchMore);
    const searchNonefound = searchBar.querySelector(selectors.searchNonefound);
    const searchLoading = searchBar.querySelector(selectors.searchLoading);


    // Add query to input if already searched for
    const searchQuery = getSearchQueryFromUrl();
    searchInput.value = searchQuery;


    // Creating search functionality
    const gotoSearchPage = () => {
        const query = searchInput.value;
        window.location.href = query ? `/?${SEARCH_QUERY}=${encodeURIComponent(query)}` : window.location.pathname;
    };
    const quickSearch = setupQuickSearch(searchInput, searchResultContainer, searchMore, searchNonefound, searchLoading);
    const navigateSearchDropdown = setupNavigateSearchDropdown(searchInput, searchResultContainer, searchMore, gotoSearchPage)


    // Bind search method with button and input bar
    searchBtn.addEventListener("click", gotoSearchPage);
    searchInput.addEventListener("input", quickSearch);
    searchInput.addEventListener("keydown", navigateSearchDropdown);
    searchResultContainer.addEventListener("keydown", navigateSearchDropdown);
    searchMore.addEventListener("keydown", navigateSearchDropdown);
}
async function main(selectors = DEFAULT_SEARCH_SELECTORS) {

    // Setup page find
    initPagefind();


    // setup searchbar if present
    setupSearchBar(selectors);
}


main();