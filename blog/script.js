import { BLOG_DATA_DIR, BLOG_PAGEFIND, BLOG_DATA_PREFIX, BLOG_STATS_FILE, SEARCH_QUERY, PAGE_QUERY } from "/static/js/global.js"


const RESULTS_PER_PAGE = 10;
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
const DATE_PUBLISHED_LABEL = "Published: "
const DATE_EDITED_LABEL = "Edited: "
let pagefind;
let pagefindPromise = null;


// Search Methods
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


    // Wait for pagefind if not initialized
    const pf = await initPagefind();


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
async function fetchArticles(searchQuery, resultCount, skipCount = 0) {
    try {
        return await fetchArticlesUnsafe(searchQuery, resultCount, skipCount);
    }
    catch (err) {
        console.error("Failed to fetch articles:", err);
        return null;
    }
}
async function initPagefind() {
    if (!pagefindPromise) {
        pagefindPromise = (async () => {
            pagefind = await import(BLOG_PAGEFIND);
            await pagefind.init();
            return pagefind;
        })();
    }
    return pagefindPromise;
}


// Utility Method
function getSearchQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(SEARCH_QUERY) ?? "";
}
function getPageNumFromUrl() {
    const pageNumber = Number(new URLSearchParams(window.location.search).get(PAGE_QUERY)) || 1;
    return Math.max(pageNumber, 1);
}
function formatDate(dateInput) {

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
    imageLink.href = data?.url ?? "";


    // Assign image
    const img = preview.querySelector("img");
    img.src = data?.thumbnail ? new URL(data?.thumbnail, window.location.origin + data?.url).href : "";
    img.setAttribute("fetchpriority", "high");
    img.onerror = function () {
        if (this.src !== "") {
            this.src = "";
        }
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


// Main
async function init() {

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


    // // Setup pagination bar only if there are enough articles to paginate
    // if (RESULTS_PER_PAGE < totalArticles) {
    //     const totalPages = 0 < totalArticles ? Math.ceil(totalArticles / RESULTS_PER_PAGE) : 1;
    //     setupPaginationBtns(urlQueries.pageNumber, totalPages);
    // }
}

init();
