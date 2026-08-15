import { BLOG_DATA_DIR, BLOG_PAGEFIND, BLOG_DATA_PREFIX, BLOG_STATS_FILE, SEARCH_QUERY, PAGE_QUERY, getSearchQueryFromUrl, getPageNumFromUrl, formatDate } from "/static/js/global.js"
import { fetchArticles, initPagefind, setupSearchBar } from "/static/js/blog-search.js"


// Properties
const RESULTS_PER_PAGE = 10;
const FALLBACK_ARTICLE_THUMBNAIL = "/static/images/fallback-article-thumbnail.png"
const ERROR_LOADING_ARTICLES = "Error loading articles"
const NO_ARTICLES_MESSAGE = "No posts yet, Stay tuned!"
const QUERY_BANNER_SELECTOR = "#query-banner";
const ARTICLE_PREVIEW_CLASS = "article-preview"
const ARTICLE_PREVIEW_IMG_LINK_CLASS = "article-preview-image-link"
const ARTICLE_PREVIEW_TITLE_CLASS = "article-preview-title"
const ARTICLE_PREVIEW_DATE_CLASS = "article-preview-date"
const ARTICLE_PREVIEW_DESCRIPTION_CLASS = "article-preview-description"
const ARTICLE_PREVIEW_TITLE_LINK_CLASS = "article-preview-title-link"
const LOADING_CLASS = "loading"
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

    // Return & hide if only 1 page
    if (totalPages == 1) {
        paginationBar.style.visibility = "hidden";
        return;
    }



    // Get pagination bar
    let paginationBar = document.querySelector(PAGINATION_BAR_SELECTOR);
    paginationBar.style.visibility = "visible";  // Ensure pagination bar is visible


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
function fillArticlePreview(preview, data) {

    // Assign image link
    const imageLink = preview.querySelector(`.${ARTICLE_PREVIEW_IMG_LINK_CLASS}`);
    const imgUrl = data?.thumbnail ? new URL(data?.thumbnail, window.location.origin + data?.url).href : FALLBACK_ARTICLE_THUMBNAIL;
    imageLink.href = data?.url ?? "";


    // Assign image
    const img = preview.querySelector("img");
    img.src = imgUrl
    img.setAttribute("fetchpriority", "high");
    img.onerror = function () {
        this.classList.remove(LOADING_CLASS);
    };
    img.onload = function () {
        this.classList.remove(LOADING_CLASS);
    };


    // Assign title link
    const titleLink = preview.querySelector(`.${ARTICLE_PREVIEW_TITLE_LINK_CLASS}`);
    titleLink.href = data?.url ?? "";


    // Assign title
    const titleEl = preview.querySelector(`.${ARTICLE_PREVIEW_TITLE_CLASS}`);
    titleEl.textContent = data?.title ?? "";


    // Assign date
    const dateEl = preview.querySelector(`.${ARTICLE_PREVIEW_DATE_CLASS}`);
    const publishedDate = formatDate(data?.createdOnDate);
    const editedDate = data?.editedOnDate ? formatDate(data.editedOnDate) : "";
    dateEl.innerHTML = `${DATE_PUBLISHED_LABEL}${publishedDate}${editedDate ? `<br>${DATE_EDITED_LABEL}${editedDate}` : ""}`;


    // Assign description
    const descEl = preview.querySelector(`.${ARTICLE_PREVIEW_DESCRIPTION_CLASS}`);
    descEl.textContent = data?.description ?? ""
}
function clearArticlePreviews() {
    const previews = document.querySelectorAll(`.${ARTICLE_PREVIEW_CLASS}`);
    previews.forEach(preview => preview.remove());
}
function updateArticlePreviews(previewTemplate, articleDataList, toShowDates = true) {

    // Find banner to insert after
    let insertAfterEl = document.querySelector(QUERY_BANNER_SELECTOR)
    if (insertAfterEl == null) {
        console.warn("No query banner found!")
        return;
    }


    // Clear existing
    clearArticlePreviews()


    // Return if none provided
    if (articleDataList.length === 0) {
        return;
    }


    // Add new cards
    let currentMonthYear = null;
    for (let i = 0; i < articleDataList.length; i++) {

        // Get article data
        const data = articleDataList[i];


        // Insert month year heading when group changes
        const articleDate = data?.createdOnDate ? new Date(data.createdOnDate) : null;
        const monthYear = articleDate ? articleDate.toLocaleString("default", { month: "long", year: "numeric" }) : null;
        if (toShowDates && monthYear && monthYear !== currentMonthYear) {
            currentMonthYear = monthYear;
            const heading = document.createElement("h2");
            heading.textContent = monthYear;
            insertAfterEl.insertAdjacentElement("afterend", heading);
            insertAfterEl = heading;
        }


        // Clone template instead of using innerHTML
        const preview = previewTemplate.cloneNode(true);
        preview.className = `${ARTICLE_PREVIEW_CLASS}`;


        // Fill details into article preview
        try {
            fillArticlePreview(preview, data)
        }
        catch (err) {
            console.log(err);
        }


        // Insert in order after last inserted element
        insertAfterEl.insertAdjacentElement("afterend", preview);
        insertAfterEl = preview;
    }
}
async function setupArticlePreviews() {

    // Get articles
    let searchQuery = getSearchQueryFromUrl()
    let pageNumber = getPageNumFromUrl()
    const articlesData = await fetchArticles(searchQuery, RESULTS_PER_PAGE, RESULTS_PER_PAGE * (pageNumber - 1))


    // Set banner text
    let bannerText = "";
    if (articlesData == null) {
        bannerText = ERROR_LOADING_ARTICLES;
    }
    else {
        bannerText = searchQuery != "" ? `${articlesData.totalArticles} result${articlesData.totalArticles != 1 ? "s" : ""} for "${searchQuery}"` : (articlesData.totalArticles == 0) ? NO_ARTICLES_MESSAGE : "";
    }


    // Clear previous previews
    let previewTemplate = document.querySelector(`.${ARTICLE_PREVIEW_CLASS}`)
    clearArticlePreviews()


    // Display banner
    assignQueryBanner(bannerText)


    // Return if no articles
    if (articlesData == null || articlesData.totalArticles == 0) {
        return;
    }


    // Add preview articles
    updateArticlePreviews(previewTemplate, articlesData.articles);


    // Setup pagination bar
    const totalPages = 0 < articlesData.totalArticles ? Math.ceil(articlesData.totalArticles / RESULTS_PER_PAGE) : 1;
    setupPaginationBar(pageNumber, totalPages);
}


// Main
async function init() {

    // Setup page find
    initPagefind();


    // Setup article previews
    setupArticlePreviews()


    // Setup searchbar if present
    setupSearchBar();
}

init();
