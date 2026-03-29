import { fetchSnippets, getSearchQueryFromUrl, initPagefind, SEARCH_QUERY } from "./search.js";


// Properties
const QUICK_SEARCH_DELAY = 300;  // Amount to wait before quick searching
const DEFAULT_QUICK_SEARCH_COUNT = 5;
const SEARCH_PAGE_URL = "/blog/";
const SEARCH_BAR_SELECTOR = "#searchbar";
const SEARCH_INPUT_SELECTOR = ".search-input";
const SEARCH_BTN_SELECTOR = ".search-btn";
const SEARCH_RESULT_CONTAINER_SELECTOR = ".search-results";
const SEARCH_MORE_SELECTOR = ".search-more";
const SEARCH_NONEFOUND_SELECTOR = ".search-nonefound";
const SEARCH_LOADING_SELECTOR = ".search-loading";


// Utility Methods
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
    searchMoreElement.href = `${SEARCH_PAGE_URL}?${SEARCH_QUERY}=${encodeURIComponent(query)}`;


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
        const quickSearchResults = (query === "") ? [] : (await fetchSnippets(query, DEFAULT_QUICK_SEARCH_COUNT + 1)).snippets;
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
function setupSearchBar() {

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


    // Creating search functionality
    const gotoSearchPage = () => {
        const query = searchInput.value;
        window.location.href = query ? `${SEARCH_PAGE_URL}?${SEARCH_QUERY}=${encodeURIComponent(query)}` : window.location.pathname;
    };
    const quickSearch = setupQuickSearch(searchInput, searchResultContainer, searchMore, searchNonefound, searchLoading);
    const navigateSearchDropdown = setupNavigateSearchDropdown(searchInput, searchResultContainer, searchMore, gotoSearchPage);


    // Bind search method with button and input bar
    searchBtn.addEventListener("click", gotoSearchPage);
    searchInput.addEventListener("input", quickSearch);
    searchInput.addEventListener("keydown", navigateSearchDropdown);
    searchResultContainer.addEventListener("keydown", navigateSearchDropdown);
    searchMore.addEventListener("keydown", navigateSearchDropdown);
}
function init() {

    initPagefind();


    // setup searchbar if present
    setupSearchBar();
}


init();