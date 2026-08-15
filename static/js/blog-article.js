import { initPagefind, setupSearchBar } from "/static/js/blog-search.js"



// Main
async function init() {

    // Setup page find
    initPagefind();


    // Setup searchbar if present
    setupSearchBar();
}

init();
