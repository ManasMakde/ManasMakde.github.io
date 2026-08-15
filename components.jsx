import fs from "fs";
import path from "path";
import { SITE_DOMAIN, SITE_NAME } from "./static/js/global.js"


// Properties
const DEFAULT_BOTTOM_NOTE = <>Scraping data for AI training is strictly prohibited. <a href="/terms#ai-data-scraping-policy" style="text-decoration:underline">View Terms</a></>
export const DEFAULT_ARTICLE_STYLES_FILE = "styles.css";
export const DEFAULT_ARTICLE_SCRIPT_FILE = "script.js";


// Utility Methods
function formatDate(dateInput) {
    if (dateInput === undefined || dateInput === null) {
        return "-";
    }


    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            return "-";
        }

        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        return formatter.format(dateInput);
    }


    return dateInput;
}


// Reusable Components
export function HTMLSkeleton({ title = "", extendHead = <></>, children }) {  // The "Boilerplate" html, Useful for cross device compatibility
    return (<>
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title} - {SITE_NAME}</title>
                <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico?" />
                <link rel="stylesheet" href="/static/css/global-styles.css" />
                {extendHead}
            </head>
            <body>
                {children}
            </body>
        </html>
    </>)
}
export function Header({ title = "Manas R. Makde" }) {
    return (<>
        <link rel="stylesheet" href="/static/css/header.css" />
        <a id="site-header" href="/">
            <img id="site-logo" alt="logo" src={"/static/images/logo.png"} />
            <div id="site-title">{title}</div>
            <div id="site-motto">{"Let's keep it dead simple!"}</div>
        </a>
    </>)
}
export function NavBar({ }) {
    return (<>
        <link rel="stylesheet" href="/static/css/navbar.css" />
        <nav id="site-navbar">
            <a href="/blog">Blog</a>
            <a href="/snippets">Snippets</a>
            <a href="/#projects">Projects</a>
            <a href="/#site-contacts">Contact</a>
        </nav>
    </>)
}
export function SearchBar({ id = "searchbar" }) {
    return (<>
        <link rel="stylesheet" href="/static/css/searchbar.css" />
        <div id={id} className="searchbar">
            {/* <script src="/static/js/search-bar.js" type="module"></script> */}
            <input type="text" placeholder="Search..." />
            <div className="searchbar-dropdown">
                <div className="searchbar-results"></div>
                <a href="#" className="searchbar-more" style={"display:none"}>Show all results</a>
                <a className="searchbar-nonefound" style={"display:none"}>No results found</a>
                <a className="searchbar-loading" style={"display:none"}>Loading...</a>
            </div>
            <button className="searchbar-btn" aria-label="Search Button"></button>
        </div>
    </>)
}
export function PaginationBar({ id = "paginationbar", style }) {
    return (<>
        <link rel="stylesheet" href="/static/css/paginationbar.css" />
        <nav id={id} className="paginationbar" style={style}>
            <a className="paginationbar-prev" aria-label="prev"></a>
            <a className="paginationbar-item">1</a>
            <span className="paginationbar-dots">...</span>
            <a className="paginationbar-item" >8</a>
            <a className="paginationbar-item" >9</a>
            <a className="paginationbar-item paginationbar-active" >10</a>
            <a className="paginationbar-item" >1</a>
            <a className="paginationbar-item" >12</a>
            <span className="paginationbar-dots">...</span>
            <a className="paginationbar-item" >50</a>
            <a className="paginationbar-next" aria-label="next"></a>
        </nav>
    </>)
}
export function Footer({ bottomNote = DEFAULT_BOTTOM_NOTE }) {
    return (<>
        <link rel="stylesheet" href="/static/css/footer.css" />
        <footer id="site-footer">
            <div id="site-contacts">
                <a id="github-contact" target="_blank" href="https://github.com/ManasMakde"></a>
                <a id="stackoverflow-contact" target="_blank" href="https://stackoverflow.com/users/22302305/manas-r-makde"></a>
                <a id="linkedin-contact" target="_blank" href="https://www.linkedin.com/in/manas-makde/"></a>
                <a id="instagram-contact" target="_blank" href="https://www.instagram.com/manas_makde/"></a>
                <a id="email-contact" target="_blank" href="mailto:manasmakde@gmail.com"></a>
                <a id="buymeacoffee" target="_blank" href="https://buymeacoffee.com/manas_makde"></a>
            </div>
            <div id="site-footer-note">{bottomNote}</div>
        </footer>
    </>)
}


// Wrappers
export function BlogArticle({ metadata = {}, children }) {

    // Default styles Component
    const stylePathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_ARTICLE_STYLES_FILE));
    const scriptPathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_ARTICLE_SCRIPT_FILE));
    const title = `${metadata?.title}`;
    const url = new URL(SITE_DOMAIN + "/" + path.relative(hostmdxInputPath, hostmdxCwd) + "/").href
    const thumbnail = metadata?.thumbnail ? new URL(metadata?.thumbnail, url).href : "";
    const defaultHead = (<>
        <link rel="stylesheet" href="/static/css/code-styles.css" />
        <link rel="stylesheet" href="/static/css/blog-article.css" />
        <script src="/static/js/blog-article.js" type="module"></script>
        {stylePathExists && <link rel="stylesheet" href={DEFAULT_ARTICLE_STYLES_FILE} />}
        {scriptPathExists && <script src={DEFAULT_ARTICLE_SCRIPT_FILE} type="module"></script>}


        {/* Meta Data */}
        <meta name="description" content={title} />
        <meta name="author" content={metadata?.author} />


        {/* Preview card*/}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={thumbnail} />


        {/* Twitter Preview card*/}
        <meta name="twitter:site" content={SITE_NAME} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:image" content={thumbnail} />
    </>);


    return (<HTMLSkeleton title={metadata?.title} extendHead={[defaultHead, metadata?.extendHead]}>

        <Header />
        <SearchBar />
        <NavBar />

        <div id="blog-article-header">
            {metadata?.thumbnail && metadata?.thumbnail !== "" && <img id="blog-article-thumbnail" src={metadata?.thumbnail} onerror={`if(this.src!=="")this.src=""`} alt="thumbnail" />}
            <div id="blog-article-card-title-wrapper">
                <h1 id="blog-article-card-title">{metadata?.title ?? "Untitled"}</h1>
                {metadata?.author && <a id="blog-article-author" className={!metadata?.authorWebsite && "blog-article-no-author"} href={metadata?.authorWebsite ? metadata?.authorWebsite : undefined}>By {metadata.author}</a>}
                {metadata?.createdOnDate && <div id="blog-article-creation-date">Posted: {formatDate(metadata?.createdOnDate)}</div>}
                {metadata?.editedOnDate && <div id="blog-article-update-date">Updated: {formatDate(metadata?.editedOnDate)}</div>}
            </div>
        </div>

        <article id="blog-article-content">{children}</article>

        <Footer />

    </HTMLSkeleton>)
}
