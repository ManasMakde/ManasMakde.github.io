import { fetchSnippets, getSearchQueryFromUrl } from "./search.js";


// Properties
const RESULTS_PER_PAGE = 10;
const PAGE_QUERY = "page";
const QUERY_BANNER_SELECTOR = "#query-banner";
const SNIPPET_CARD_CONTAINER_SELECTOR = ".snippets-card-container";
const SNIPPET_CARD_CLASS = "card";
const SNIPPET_LOADING_CLASS = "is-loading";
const EMPTY_SNIPPET_MESSAGE = "No posts yet, Stay tuned!";
const EMPTY_CLASS = "empty-blog";
const PAGINATION_BAR_SELECTOR = "#pagination";
const PAGINATION_PREV_BTN_SELECTOR = ".pagination-prev";
const PAGINATION_PAGE_1_SELECTOR = ".pagination-item:nth-of-type(2)";  // Intentionally not :nth-of-type(1) DO NOT CHANGE
const PAGINATION_START_DOTS_SELECTOR = ".pagination-dots:nth-of-type(1)";
const PAGINATION_PAGE_4_SELECTOR = ".pagination-item:nth-of-type(3)";
const PAGINATION_PAGE_5_SELECTOR = ".pagination-item:nth-of-type(4)";
const PAGINATION_ACTIVE_BTN_SELECTOR = ".pagination-active";
const PAGINATION_PAGE_7_SELECTOR = ".pagination-item:nth-of-type(6)";
const PAGINATION_PAGE_8_SELECTOR = ".pagination-item:nth-of-type(7)";
const PAGINATION_END_DOTS_SELECTOR = ".pagination-dots:nth-of-type(2)";
const PAGINATION_PAGE_11_SELECTOR = ".pagination-item:nth-of-type(8)";
const PAGINATION_NEXT_BTN_SELECTOR = ".pagination-next";


// Methods
function formatDate(dateInput) {
    // Return if invalid
    if (dateInput === undefined || dateInput === null) {
        return "";
    }


    // Check if can be casted to Date type
    let checkDateInput = new Date(dateInput);
    if (isNaN(checkDateInput.getTime())) {
        console.warn("formatDate: invalid date input");
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
function getPageNumFromUrl() {
    const pageNumber = Number(new URLSearchParams(window.location.search).get(PAGE_QUERY)) || 1;
    return Math.max(pageNumber, 1);
}
function buildPageUrl(pageNumber) {
    const url = new URL(window.location.href);
    url.searchParams.set(PAGE_QUERY, pageNumber);
    return url.toString();
}
function setupPaginationBtns(currentIndex, totalIndices) {

    // Get pagination bar
    let paginationBar = document.querySelector(PAGINATION_BAR_SELECTOR);
    paginationBar.style.display = "";  // Ensure pagination bar is visible


    // Get all elements in pagination bar
    let prevBtn = paginationBar.querySelector(PAGINATION_PREV_BTN_SELECTOR);
    let page1 = paginationBar.querySelector(PAGINATION_PAGE_1_SELECTOR);
    let startDots = paginationBar.querySelector(PAGINATION_START_DOTS_SELECTOR);
    let page4 = paginationBar.querySelector(PAGINATION_PAGE_4_SELECTOR);
    let page5 = paginationBar.querySelector(PAGINATION_PAGE_5_SELECTOR);
    let pageActiveBtn = paginationBar.querySelector(PAGINATION_ACTIVE_BTN_SELECTOR);
    let page7 = paginationBar.querySelector(PAGINATION_PAGE_7_SELECTOR);
    let page8 = paginationBar.querySelector(PAGINATION_PAGE_8_SELECTOR);
    let endDots = paginationBar.querySelector(PAGINATION_END_DOTS_SELECTOR);
    let page11 = paginationBar.querySelector(PAGINATION_PAGE_11_SELECTOR);
    let nextBtn = paginationBar.querySelector(PAGINATION_NEXT_BTN_SELECTOR);


    // Prev Button
    let toShowPrev = (currentIndex != 1);
    prevBtn.style.display = toShowPrev ? "" : "none"
    prevBtn.href = buildPageUrl(currentIndex - 1);


    // Page 1 button
    let toShowPage1 = (4 <= currentIndex);
    page1.style.display = toShowPage1 ? "" : "none";
    page1.href = buildPageUrl(1);
    page1.textContent = toShowPage1 ? 1 : "-";


    // Start Dots 
    let toShowStartDots = (5 <= currentIndex);
    startDots.style.display = toShowStartDots ? "" : "none";


    // Page 4 button
    let toShowPage4 = (3 <= currentIndex);
    page4.style.display = toShowPage4 ? "" : "none";
    page4.href = buildPageUrl(currentIndex - 2);
    page4.textContent = toShowPage4 ? currentIndex - 2 : "-";


    // Page 5 button
    let toShowPage5 = (2 <= currentIndex);
    page5.style.display = toShowPage5 ? "" : "none";
    page5.href = buildPageUrl(currentIndex - 1);
    page5.textContent = toShowPage5 ? currentIndex - 1 : "-";


    // Active button
    pageActiveBtn.textContent = currentIndex;


    // Page 7 button
    let toShowPage7 = (totalIndices >= currentIndex + 1);
    page7.style.display = toShowPage7 ? "" : "none";
    page7.href = buildPageUrl(currentIndex + 1);
    page7.textContent = toShowPage7 ? currentIndex + 1 : "-";


    // Page 8 button
    let toShowPage8 = (totalIndices >= currentIndex + 2);
    page8.style.display = toShowPage8 ? "" : "none";
    page8.href = buildPageUrl(currentIndex + 2);
    page8.textContent = toShowPage8 ? currentIndex + 2 : "-";


    // Ending Dots
    let toShowEndDots = (currentIndex < totalIndices - 3);
    endDots.style.display = toShowEndDots ? "" : "none";


    // Page 11 button
    let toShowPage11 = (currentIndex < totalIndices - 2);
    page11.style.display = toShowPage11 ? "" : "none";
    page11.href = buildPageUrl(totalIndices);
    page11.textContent = toShowPage11 ? totalIndices : "-";


    // Next button
    let toShowNext = (currentIndex != totalIndices);
    nextBtn.style.display = toShowNext ? "" : "none";
    nextBtn.href = buildPageUrl(currentIndex + 1);
}
function assignQueryBanner(resultCount = 0, queries = {}) {

    // Return if no queries
    if (!queries.searchQuery) {
        return;
    }


    // Return if banner not found
    let queryBannerElement = document.querySelector(QUERY_BANNER_SELECTOR);
    if (!queryBannerElement) {
        console.warn("assignQueryBanner: query banner element not found");
        return;
    }


    // Make sure banner is visible
    queryBannerElement.style.display = ""


    // Write into banner based on queries
    let queryText = `${resultCount} ${resultCount == 1 ? "result" : "results"}`;
    queryText += queries.searchQuery ? ` for "${queries.searchQuery}"` : "";


    // Assign into query Banner
    queryBannerElement.textContent = queryText;
}
function updateSnippetCards(snippets, showDates = true) {

    // Return if no container
    const container = document.querySelector(SNIPPET_CARD_CONTAINER_SELECTOR);
    if (!container) {
        console.warn("updateSnippetCards: container not found");
        return;
    }

    // Clear existing cards
    container.innerHTML = "";


    // Return if no snippets provided
    if(snippets.length === 0){
        container.innerHTML = `<div class="${EMPTY_CLASS}">${EMPTY_SNIPPET_MESSAGE}</div>`;
        return;
    }


    // Add new cards
    let currentMonthYear = null;
    for (let i = 0; i < snippets.length; i++) {
        const snippet = snippets[i];
        const thumbnail = snippet?.thumbnail;
        const imgUrl = thumbnail ? new URL(thumbnail, window.location.origin + snippet?.url).href : "";


        // Insert month year heading when group changes
        const snippetDate = snippet?.createdOnDate ? new Date(snippet.createdOnDate) : null;
        const monthYear = snippetDate ? snippetDate.toLocaleString("default", { month: "long", year: "numeric" }) : null;
        if (monthYear && monthYear !== currentMonthYear && showDates) {
            currentMonthYear = monthYear;
            const heading = document.createElement("h2");
            heading.textContent = monthYear;
            container.appendChild(heading);
        }


        // Create the anchor element directly
        const card = document.createElement("div");
        card.className = `${SNIPPET_CARD_CLASS} ${SNIPPET_LOADING_CLASS}`;


        // Inject the inner structure
        card.innerHTML = `
            <a href="${snippet?.url ?? ""}" class="card-image-link">
                <img ${imgUrl ? `src="${imgUrl}"` : ""}
                    onerror="if(this.src!=='/static/placeholder.png')this.src='/static/placeholder.png';this.classList.remove('is-loading')"
                    onload="this.closest('.card').classList.remove('is-loading')"
                    alt="thumbnail" fetchpriority="high">
            </a>
            <div class="card-body">
                <a class="card-title" href="${snippet?.url ?? ""}">${snippet?.title ?? ""}</a>
                <span class="card-date">${formatDate(snippet?.createdOnDate)}</span>
                <p class="card-description">${snippet?.description ?? ""}</p>
            </div>`;


        // Directly append to the container
        container.appendChild(card);
    }
}
async function init() {
    // Get url queries 
    const urlQueries = {
        searchQuery: getSearchQueryFromUrl(),
        pageNumber: getPageNumFromUrl(),
    }


    // Set search result as loading
    assignQueryBanner("Loading", urlQueries);


    // Get all snippets based on page number & search query
    const { snippets, totalSnippets } = await fetchSnippets(urlQueries.searchQuery, RESULTS_PER_PAGE, RESULTS_PER_PAGE * (urlQueries.pageNumber - 1));


    // Display what was queried
    assignQueryBanner(totalSnippets, urlQueries);


    // Add snippet data to all cards
    updateSnippetCards(snippets, urlQueries.searchQuery == "");


    // Setup pagination bar only if there are enough snippets to paginate
    if (RESULTS_PER_PAGE < totalSnippets) {
        const totalPages = 0 < totalSnippets ? Math.ceil(totalSnippets / RESULTS_PER_PAGE) : 1;
        setupPaginationBtns(urlQueries.pageNumber, totalPages);
    }
}


init();