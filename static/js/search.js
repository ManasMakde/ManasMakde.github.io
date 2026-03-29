// Properties
export const SEARCH_QUERY = "search";
const PAGEFIND_PATH = "/static/search/pagefind.js";
const STATS_FILE_PATH = "/static/data/_stats.json";
const DATA_FILE_PATH_PREFIX = "/static/data/data-";
let pagefind;
let pagefindPromise = null; // To avoid reinitializing pagefind multiple times


// Utility Methods
export function getSearchQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(SEARCH_QUERY) ?? "";
}
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
export async function fetchSnippets(searchQuery, resultCount, skipCount = 0) {

    // fetch & return default snippets if no query is provided
    if (!searchQuery) {
        return fetchDefaultSnippets(resultCount, skipCount);
    }


    // Wait for pagefind if not initialized
    const pf = await initPagefind();


    // Get all search results
    const search = await pf.search(searchQuery || null, {});  // Intentionally adding null otherwise results don't show up DO NOT CHANGE


    // Iterate through search results 
    const resultRange = search.results.slice(skipCount, skipCount + resultCount);
    const snippets = await Promise.all(resultRange.map(async (res) => {
        const data = await res.data();
        return {
            url: data?.url ?? "",
            title: data?.meta?.title ?? "",
            description: data?.meta?.description ?? "",
            createdOnDate: data?.meta?.date ?? "",
            thumbnail: data?.meta?.thumbnail ?? ""
        };
    }));


    return { snippets, totalSnippets: search.results.length };
}


// Primary Methods
export async function initPagefind() {
    if (!pagefindPromise) {
        pagefindPromise = (async () => {
            pagefind = await import(PAGEFIND_PATH);
            await pagefind.init();
            return pagefind;
        })();
    }
    return pagefindPromise;
}