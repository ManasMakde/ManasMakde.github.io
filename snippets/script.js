import { SNIPPET_DIR, SNIPPET_DATA_DIR, SNIPPET_PAGEFIND, SNIPPET_DATA_PREFIX, SNIPPET_STATS_FILE, SEARCH_QUERY, PAGE_QUERY } from "/static/js/global.js"
import { getSearchQueryFromUrl, getPageNumFromUrl, getTagsQueryFromUrl, formatDate } from "/static/js/global.js"
import { fetchSnippets, initSnippetPagefind, setupSearchBar, CONTENT_TYPE } from "/static/js/search.js"


// Properties
const RESULTS_PER_PAGE = 12;
const FALLBACK_SNIPPET_THUMBNAIL = "/static/images/fallback-snippet-thumbnail.png"
const ERROR_LOADING_SNIPPETS = "Error loading snippets"
const NO_SNIPPETS_MESSAGE = "No posts yet, Stay tuned!"
const QUERY_BANNER_SELECTOR = "#query-banner";
const SNIPPETS_CONTAINER_SELECTOR = ".snippets-preview-container"
const SNIPPET_PREVIEW_CLASS = "snippet-preview"
const SNIPPET_PREVIEW_THUMBNAIL_CLASS = "snippet-preview-thumbnail"
const SNIPPET_PREVIEW_TITLE_CLASS = "snippet-preview-title"
const SNIPPET_PREVIEW_TAGS_CLASS = "preview-tag-container"
const SNIPPET_TAG_CLASS = "tag"
const LOADING_CLASS = "is-loading"
const DATE_PUBLISHED_LABEL = "Posted: "
const DATE_EDITED_LABEL = "Updated: "


// Pagination Properties
const PAGINATION_BAR_SELECTOR = "#paginationbar";
const PAGINATION_PREV_BTN_SELECTOR = ".paginationbar-prev";
const PAGINATION_PAGE_1_SELECTOR = ".paginationbar-item:nth-of-type(2)";  // Intentionally not :nth-of-type(1) DO NOT CHANGE
const PAGINATION_START_DOTS_SELECTOR = ".paginationbar-dots:nth-of-type(1)";
const PAGINATION_PAGE_4_SELECTOR = ".paginationbar-item:nth-of-type(3)";
const PAGINATION_PAGE_5_SELECTOR = ".paginationbar-item:nth-of-type(4)";
const PAGINATION_ACTIVE_BTN_SELECTOR = ".paginationbar-active";
const PAGINATION_PAGE_7_SELECTOR = ".paginationbar-item:nth-of-type(6)";
const PAGINATION_PAGE_8_SELECTOR = ".paginationbar-item:nth-of-type(7)";
const PAGINATION_END_DOTS_SELECTOR = ".paginationbar-dots:nth-of-type(2)";
const PAGINATION_PAGE_11_SELECTOR = ".paginationbar-item:nth-of-type(8)";
const PAGINATION_NEXT_BTN_SELECTOR = ".paginationbar-next";


// Pagination Methods
function buildPageUrl(pageNumber) {
    const url = new URL(window.location.href);
    url.searchParams.set(PAGE_QUERY, pageNumber);
    return url.toString();
}
async function setupPaginationBar(currentPage, totalPages) {

    // Get pagination bar
    let paginationBar = document.querySelector(PAGINATION_BAR_SELECTOR);
    if (totalPages == 1) {  // Return & hide if only 1 page
        paginationBar.style.visibility = "hidden";
        return;
    }
    else {
        paginationBar.style.visibility = "visible";  // Ensure pagination bar is visible
    }


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
    let toShowPrev = (currentPage != 1);
    prevBtn.style.display = toShowPrev ? "" : "none"
    prevBtn.href = buildPageUrl(currentPage - 1);


    // Page 1 button
    let toShowPage1 = (4 <= currentPage);
    page1.style.display = toShowPage1 ? "" : "none";
    page1.href = buildPageUrl(1);
    page1.textContent = toShowPage1 ? 1 : "-";


    // Start Dots 
    let toShowStartDots = (5 <= currentPage);
    startDots.style.display = toShowStartDots ? "" : "none";


    // Page 4 button
    let toShowPage4 = (3 <= currentPage);
    page4.style.display = toShowPage4 ? "" : "none";
    page4.href = buildPageUrl(currentPage - 2);
    page4.textContent = toShowPage4 ? currentPage - 2 : "-";


    // Page 5 button
    let toShowPage5 = (2 <= currentPage);
    page5.style.display = toShowPage5 ? "" : "none";
    page5.href = buildPageUrl(currentPage - 1);
    page5.textContent = toShowPage5 ? currentPage - 1 : "-";


    // Active button
    pageActiveBtn.textContent = currentPage;


    // Page 7 button
    let toShowPage7 = (totalPages >= currentPage + 1);
    page7.style.display = toShowPage7 ? "" : "none";
    page7.href = buildPageUrl(currentPage + 1);
    page7.textContent = toShowPage7 ? currentPage + 1 : "-";


    // Page 8 button
    let toShowPage8 = (totalPages >= currentPage + 2);
    page8.style.display = toShowPage8 ? "" : "none";
    page8.href = buildPageUrl(currentPage + 2);
    page8.textContent = toShowPage8 ? currentPage + 2 : "-";


    // Ending Dots
    let toShowEndDots = (currentPage < totalPages - 3);
    endDots.style.display = toShowEndDots ? "" : "none";


    // Page 11 button
    let toShowPage11 = (currentPage < totalPages - 2);
    page11.style.display = toShowPage11 ? "" : "none";
    page11.href = buildPageUrl(totalPages);
    page11.textContent = toShowPage11 ? totalPages : "-";


    // Next button
    let toShowNext = (currentPage != totalPages);
    nextBtn.style.display = toShowNext ? "" : "none";
    nextBtn.href = buildPageUrl(currentPage + 1);
}


// Primary Methods
function assignQueryBanner(text) {

    // Return if banner not found
    let queryBannerElement = document.querySelector(QUERY_BANNER_SELECTOR);
    if (!queryBannerElement) {
        console.warn("assignQueryBanner: query banner element not found");
        return;
    }


    // Make sure banner is visible
    queryBannerElement.style.display = ""


    // Assign into query Banner
    queryBannerElement.textContent = text;
}
function fillSnippetPreview(preview, data) {

    console.log(data)


    // Assign thumbnail link
    const thumbnailLink = preview.querySelector(`.${SNIPPET_PREVIEW_THUMBNAIL_CLASS}`);
    thumbnailLink.href = data?.url ?? "";


    // Assign image
    const img = thumbnailLink.querySelector("img");
    const imgUrl = data?.thumbnail ? new URL(data.thumbnail, window.location.origin + data?.url).href : FALLBACK_SNIPPET_THUMBNAIL;
    img.src = imgUrl;
    img.setAttribute("fetchpriority", "high");
    img.onerror = function () {
        thumbnailLink.classList.remove(LOADING_CLASS);
    };
    img.onload = function () {
        thumbnailLink.classList.remove(LOADING_CLASS);
    };


    // Assign title link and text
    const titleLink = preview.querySelector(`.${SNIPPET_PREVIEW_TITLE_CLASS}`);
    titleLink.href = data?.url ?? "";
    titleLink.title = data?.title ?? "";
    titleLink.classList.remove(LOADING_CLASS);
    const titleTextEl = titleLink.querySelector("div");
    titleTextEl.textContent = data?.title ?? "";


    // Assign tags
    const tagsEl = preview.querySelector(`.${SNIPPET_PREVIEW_TAGS_CLASS}`);
    tagsEl.classList.remove(LOADING_CLASS);
    tagsEl.innerHTML = "";
    const rawTags = data?.tags ?? [];
    const tags = Array.isArray(rawTags) ? rawTags : typeof rawTags === "string" ? rawTags.split(",") : [];
    for (let i = 0; i < tags.length; i++) {
        const tagEl = document.createElement("a");
        tagEl.className = SNIPPET_TAG_CLASS;
        tagEl.href = `${SNIPPET_DIR}?tags=${encodeURIComponent(tags[i].toLowerCase())}`
        tagEl.textContent = tags[i].toLowerCase();
        tagsEl.appendChild(tagEl);
    }
}
function clearSnippetPreviews() {
    const previews = document.querySelectorAll(`.${SNIPPET_PREVIEW_CLASS}`);
    previews.forEach(preview => preview.remove());
}
function updateSnippetPreviews(previewTemplate, snippetDataList, toShowDates = true) {

    // Find container to populate
    let containerEl = document.querySelector(SNIPPETS_CONTAINER_SELECTOR)
    if (containerEl == null) {
        console.warn("updateSnippetPreviews container not found")
        return;
    }


    // Clear existing
    clearSnippetPreviews()


    // Return if none provided
    if (snippetDataList.length === 0) {
        return;
    }


    // Add new cards
    for (let i = 0; i < snippetDataList.length; i++) {

        // Get snippet data
        const data = snippetDataList[i];


        // Clone template instead of using innerHTML
        const preview = previewTemplate.cloneNode(true);
        preview.className = `${SNIPPET_PREVIEW_CLASS}`;


        // Fill details into snippet preview
        try {
            fillSnippetPreview(preview, data)
        }
        catch (err) {
            console.log(err);
        }


        // Append to container, keeps banner as first child
        containerEl.appendChild(preview);
    }
}
async function setupSnippetPreviews() {

    // Get snippets
    let searchQuery = getSearchQueryFromUrl()
    let pageNumber = getPageNumFromUrl()
    let tags = getTagsQueryFromUrl()
    const snippetsData = await fetchSnippets(searchQuery, RESULTS_PER_PAGE, tags, RESULTS_PER_PAGE * (pageNumber - 1))


    // Set banner text
    let bannerText = "";
    if (snippetsData == null) {
        bannerText = ERROR_LOADING_SNIPPETS;
    }
    else {
        if (searchQuery != "" || tags.length != 0) {
            bannerText = `${snippetsData.totalSnippets} ${snippetsData.totalSnippets == 1 ? "result" : "results"}`;
            bannerText += searchQuery ? ` for "${searchQuery}"` : "";
            bannerText += tags.length != 0 ? ` with ${tags.length == 1 ? "tag" : "tags"} [ ${tags.join(", ")} ]` : "";
        }
        else if (snippetsData.totalSnippets == 0) {
            bannerText = NO_SNIPPETS_MESSAGE
        }
    }


    // Clear previous previews
    let previewTemplate = document.querySelector(`.${SNIPPET_PREVIEW_CLASS}`)
    clearSnippetPreviews()


    // Display banner
    assignQueryBanner(bannerText)


    // Return if no snippets
    if (snippetsData == null || snippetsData.totalSnippets == 0) {
        return;
    }


    // Add preview snippets
    updateSnippetPreviews(previewTemplate, snippetsData.snippets);


    // Setup pagination bar
    const totalPages = 0 < snippetsData.totalSnippets ? Math.ceil(snippetsData.totalSnippets / RESULTS_PER_PAGE) : 1;
    setupPaginationBar(pageNumber, totalPages);
}


// Main
async function init() {

    // Setup page find
    initSnippetPagefind();


    // Setup snippet previews
    setupSnippetPreviews()


    // Setup searchbar if present
    setupSearchBar(CONTENT_TYPE.SNIPPET);
}

init();
