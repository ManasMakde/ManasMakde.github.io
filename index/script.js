import { TAGS_QUERY, getSearchQueryFromUrl, getPageNumFromUrl, getTagsQueryFromUrl, gotoPageNumber } from "/static/global.js";
import { fetchSnippets } from "/static/search.js"


// Properties
const RESULTS_PER_PAGE = 16;
const QUERY_BANNER_SELECTOR = "#query-banner";
const SNIPPET_CARD_SELECTOR = ".snippet-card";
const SNIPPET_LOADING_CLASS = "is-loading";
const SNIPPET_THUMBNAIL_SELECTOR = ".snippet-card-thumbnail";
const SNIPPET_IMG_SELECTOR = ".snippet-card-thumbnail img";
const SNIPPET_TITLE_SELECTOR = ".snippet-card-title";
const SNIPPET_TITLE_DIV_SELECTOR = ".snippet-card-title div";
const SNIPPET_TAG_CONTAINER_SELECTOR = ".snippet-card-tags";
const SNIPPET_TAG_CLASS = "tag";
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
    prevBtn.onclick = toShowPrev ? () => { gotoPageNumber(currentIndex - 1) } : null;


    // Page 1 button
    let toShowPage1 = (4 <= currentIndex);
    page1.style.display = toShowPage1 ? "" : "none";
    page1.onclick = toShowPage1 ? () => { gotoPageNumber(1) } : null;
    page1.textContent = toShowPage1 ? 1 : "-";


    // Start Dots 
    let toShowStartDots = (5 <= currentIndex);
    startDots.style.display = toShowStartDots ? "" : "none";


    // Page 4 button
    let toShowPage4 = (3 <= currentIndex);
    page4.style.display = toShowPage4 ? "" : "none";
    page4.onclick = toShowPage4 ? () => { gotoPageNumber(currentIndex - 2) } : null;
    page4.textContent = toShowPage4 ? currentIndex - 2 : "-";


    // Page 5 button
    let toShowPage5 = (2 <= currentIndex);
    page5.style.display = toShowPage5 ? "" : "none";
    page5.onclick = toShowPage5 ? () => { gotoPageNumber(currentIndex - 1) } : null;
    page5.textContent = toShowPage5 ? currentIndex - 1 : "-";


    // Active button
    pageActiveBtn.textContent = currentIndex;


    // Page 7 button
    let toShowPage7 = (totalIndices >= currentIndex + 1);
    page7.style.display = toShowPage7 ? "" : "none";
    page7.onclick = toShowPage7 ? () => { gotoPageNumber(currentIndex + 1) } : null;
    page7.textContent = toShowPage7 ? currentIndex + 1 : "-";


    // Page 8 button
    let toShowPage8 = (totalIndices >= currentIndex + 2);
    page8.style.display = toShowPage8 ? "" : "none";
    page8.onclick = toShowPage8 ? () => { gotoPageNumber(currentIndex + 2) } : null;
    page8.textContent = toShowPage8 ? currentIndex + 2 : "-";


    // Ending Dots
    let toShowEndDots = (currentIndex < totalIndices - 3);
    endDots.style.display = toShowEndDots ? "" : "none";


    // Page 11 button
    let toShowPage11 = (currentIndex < totalIndices - 2);
    page11.style.display = toShowPage11 ? "" : "none";
    page11.onclick = toShowPage11 ? () => { gotoPageNumber(totalIndices) } : null;
    page11.textContent = toShowPage11 ? totalIndices : "-";


    // Next button
    let toShowNext = (currentIndex != totalIndices);
    nextBtn.style.display = toShowNext ? "" : "none";
    nextBtn.onclick = toShowNext ? () => { gotoPageNumber(currentIndex + 1) } : null;
}

function assignQueryBanner(resultCount = 0, queries = {}) {

    // Return if no queries
    if (!queries.searchQuery && queries.tags.length == 0) {
        return;
    }


    // Return if banner not found
    let queryBannerElement = document.querySelector(QUERY_BANNER_SELECTOR);
    if (!queryBannerElement) {
        return;
    }


    // Make sure banner is visible
    queryBannerElement.style.display = ""


    // Write into banner based on queries
    let queryText = `${resultCount} ${resultCount == 1 ? "result" : "results"}`;
    queryText += queries.searchQuery ? ` for "${queries.searchQuery}"` : "";
    queryText += queries.tags.length != 0 ? ` with ${queries.tags.length == 1 ? "tag" : "tags"} ${queries.tags.map(i => `[ ${i} ]`).join(" ")}` : "";


    // Assign into query Banner
    queryBannerElement.textContent = queryText;
}

function updateSnippetCards(snippets) {
    // Iterate over all snippet cards
    const snippetCards = document.querySelectorAll(SNIPPET_CARD_SELECTOR);
    for (let i = 0; i < snippetCards.length; i++) {

        // Remove loading class
        const card = snippetCards[i];
        card.classList.remove(SNIPPET_LOADING_CLASS);


        // Hide/Remove card if no more snippets left
        if (snippets.length <= i) {
            card.style.display = "none";
            continue;
        }


        // Add image to thumbnail
        let imgElement = card.querySelector(SNIPPET_IMG_SELECTOR);
        let thumbnail = snippets[i]?.thumbnail;
        const imgUrl = thumbnail ? new URL(thumbnail, window.location.origin + snippets[i]?.url).href : "";
        imgElement.src = imgUrl;


        // Add link to thumbnail
        let thumbnailElement = card.querySelector(SNIPPET_THUMBNAIL_SELECTOR);
        thumbnailElement.href = snippets[i]?.url;
        thumbnailElement.style.display = thumbnail ? "" : "none";


        // Add text to title
        let titleDivElement = card.querySelector(SNIPPET_TITLE_DIV_SELECTOR);
        titleDivElement.textContent = snippets[i]?.title;


        // Add link to title
        let titleElement = card.querySelector(SNIPPET_TITLE_SELECTOR);
        titleElement.href = snippets[i]?.url;
        titleElement.classList.remove(SNIPPET_LOADING_CLASS);


        // Remove existing tags
        let tagContainer = card.querySelector(SNIPPET_TAG_CONTAINER_SELECTOR);
        tagContainer.classList.remove(SNIPPET_LOADING_CLASS);
        while (tagContainer.firstChild) {
            tagContainer.removeChild(tagContainer.firstChild);
        }


        // Add tags
        let tags = snippets[i]?.tags ?? [];
        for (let i = 0; i < tags.length; i++) {
            // Skip tag if empty
            if (tags[i] == "") {
                continue;
            }


            // Assign values to tag element
            const tagElement = document.createElement('a');
            tagElement.href = `/?${TAGS_QUERY}=${encodeURIComponent(tags[i])}`;
            tagElement.className = SNIPPET_TAG_CLASS;
            tagElement.textContent = tags[i];
            tagContainer.appendChild(tagElement);
        }
    }
}

async function main() {
    // Get url queries 
    const urlQueries = {
        searchQuery: getSearchQueryFromUrl(),
        pageNumber: getPageNumFromUrl(),
        tags: getTagsQueryFromUrl()
    }


    // Set search result as loading
    assignQueryBanner("Loading", urlQueries);


    // Get all snippets based on page number, search & tags query
    const { snippets, totalSnippets } = await fetchSnippets(urlQueries.searchQuery, urlQueries.tags, RESULTS_PER_PAGE, RESULTS_PER_PAGE * (urlQueries.pageNumber - 1));


    // Display what was queried
    assignQueryBanner(totalSnippets, urlQueries);


    // Add snippet data to all cards
    updateSnippetCards(snippets);


    // Setup pagination bar only if there are enough snippets to paginate
    if (RESULTS_PER_PAGE < totalSnippets) {
        const totalPages = 0 < totalSnippets ? Math.ceil(totalSnippets / RESULTS_PER_PAGE) : 1;
        setupPaginationBtns(urlQueries.pageNumber, totalPages);
    }
}

main();