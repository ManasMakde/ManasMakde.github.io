// import { fetchSnippets } from "/static/js/search.js";


// // Properties
// const RESULTS_COUNT = 3;
// const BLOG_POSTS_SELECTOR = "#blog-posts-content";
// const SNIPPET_LOADING_CLASS = "is-loading";


// // Methods
// function formatDate(dateInput) {
//     // Return if invalid
//     if (dateInput === undefined || dateInput === null) {
//         return "";
//     }

//     // Check if can be casted to Date type
//     let checkDateInput = new Date(dateInput);
//     if(isNaN(checkDateInput.getTime())){
//         console.log("Invalid Datee")
//         return dateInput;
//     }
    
//     // Format if of Date type
//     const formatter = new Intl.DateTimeFormat('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });

//     return formatter.format(checkDateInput);
// }
// function updateSnippetCards(snippets) {
//     const container = document.querySelector(BLOG_POSTS_SELECTOR);
//     if (!container) {
//         console.warn("updateSnippetCards container not found");
//         return;
//     }

//     // Clear existing cards
//     container.innerHTML = "";

//     // Add new cards
//     for (let i = 0; i < snippets.length; i++) {
//         const snippet = snippets[i];
//         const thumbnail = snippet?.thumbnail;
//         const imgUrl = thumbnail ? new URL(thumbnail, window.location.origin + snippet?.url).href : "";
//         const card = document.createElement("div");
//         card.className = `card ${SNIPPET_LOADING_CLASS}`;
//         card.innerHTML = `
//             <a href="${snippet?.url ?? ""}" class="card-image-link">
//                 <img ${imgUrl ? `src="${imgUrl}"` : ""}
//                     onerror="if(this.src!=='/static/placeholder.png')this.src='/static/placeholder.png';this.classList.remove('is-loading')"
//                     onload="this.closest('.card').classList.remove('is-loading')"
//                     alt="thumbnail" fetchpriority="high">
//             </a>
//             <div class="card-body">
//                 <a class="card-title" href="${snippet?.url ?? ""}">${snippet?.title ?? ""}</a>
//                 <span class="card-date">${formatDate(snippet?.createdOnDate)}</span>
//                 <p class="card-description">${snippet?.description ?? ""}</p>
//             </div>`;

//         container.appendChild(card);
//     }
// }
// async function main() {
//     // Get latest snippets
//     const { snippets } = await fetchSnippets(null, RESULTS_COUNT, 0);

//     // Add snippet data to all cards
//     updateSnippetCards(snippets);
// }

// main();