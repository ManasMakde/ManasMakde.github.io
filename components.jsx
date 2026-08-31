import fs from "fs";
import path from "path";
import { SITE_DOMAIN, SITE_NAME, TAGS_QUERY_PARAM, resolveUrl } from "./static/js/global.js"


// Properties
const DEFAULT_BOTTOM_NOTE = <>Scraping data for AI training is strictly prohibited. <a href="/terms#ai-data-scraping-policy" style="text-decoration:underline">View Terms</a></>
const DEFAULT_CODE_TAB_STYLE = "max-height:31rem";
const DEFAULT_ARTICLE_STYLES_FILE = "styles.css";
const DEFAULT_ARTICLE_SCRIPT_FILE = "script.js";
const DEFAULT_SNIPPET_STYLES_FILE = "styles.css";
const DEFAULT_SNIPPET_SCRIPT_FILE = "script.js";


// CodeTabs Properties
const LANGUAGE_CLASS_PREFIX = "hljs language-";
const DISPLAY_NAME_PROP = "display-name";


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
        <a id="site-header" href="/" tabIndex="-1">
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
export function CodeTabs({ activeIndex = 0, dropdown = false, id = undefined, style = {}, childrenStyle = DEFAULT_CODE_TAB_STYLE, children }) {

    // Make sure children are in array format
    if (!Array.isArray(children)) {
        children = [children]
    }


    // Reset active index if it exceeds language count
    if (children.length <= activeIndex) {
        activeIndex = 0;
    }


    // Get Languages & set default active code block
    let languages = []
    for (let i = 0; i < children.length; i++) {

        // Skip if not <pre>
        let child = children[i];
        if (child?.type !== "pre") {
            continue;
        }


        // Skip if no subchildren
        let subchildren = child?.props?.children;
        if (!subchildren) {
            return;
        }


        // Make sure subchildren are array
        if (!Array.isArray(subchildren)) {
            subchildren = [subchildren]
        }


        // Skip if not <code>
        let firstSubchild = subchildren?.[0]
        if (firstSubchild?.type !== "code") {
            continue;
        }


        // Add common styles to children
        let styleString = (childrenStyle !== "" ? `${childrenStyle};` : "") + (firstSubchild?.props?.style ? firstSubchild.props.style : "");
        firstSubchild = Preact.cloneElement(firstSubchild, {
            style: styleString != "" ? styleString : undefined
        });


        // Set as active if it matches index
        children[i] = Preact.cloneElement(child, {
            className: `${child.props.className || ""} ${i === activeIndex ? "codetabs-active" : ""}`,
            children: firstSubchild
        });


        // Skip if no className or displayName props
        if (!(firstSubchild?.props?.className instanceof String) && (firstSubchild?.props?.[DISPLAY_NAME_PROP] instanceof String)) {
            continue;
        }


        // Get language from displayName
        if (firstSubchild?.props?.[DISPLAY_NAME_PROP]) {
            languages.push(firstSubchild?.props?.[DISPLAY_NAME_PROP]);
            continue;
        }


        // Fallback by getting language from className
        let language = firstSubchild?.props?.className?.replace(LANGUAGE_CLASS_PREFIX, "");
        if (language) {
            languages.push(language);
        }
    }


    // Assign topbar either button or dropdown
    let topbarContent = (<></>)
    if (dropdown) {
        topbarContent = (<select name="codetabs-select" onchange="changeTab(this, this.value)">
            {languages.map((lang, index) => (
                <option key={index} value={index} selected={index === activeIndex}>
                    {lang}
                </option>
            ))}
        </select>)
    }
    else {
        topbarContent = (<>{
            languages.map((lang, index) => (
                <button key={lang} className={index === activeIndex ? "codetabs-selected" : undefined} onclick={`changeTabByButton(this, ${index})`}>
                    {lang}
                </button>
            ))
        }</>)
    }


    return (<div className="codetabs" id={id} style={style}>
        <script src="/static/js/codetabs.js"></script>
        <div className="codetabs-topbar">{topbarContent}</div>
        <button className="codetabs-copy" onclick="copyCode(this)"></button>
        <div className="codetabs-content">
            {children}
        </div>
    </div>)
}
export function Tags({ tags, assignHref = true }) {

    // Return empty fragment if no tags
    if (!tags || tags?.length == 0) {
        return (<></>)
    }

    return tags?.map((tag, index) => (<a className="tag" key={index} href={assignHref ? `/snippets/?${TAGS_QUERY_PARAM}=${encodeURIComponent(tag.toLowerCase())}` : undefined}>{tag.toLowerCase()}</a>));
}
export function Pic({ src, href, alt, target, subtext, imageAttr, style, imgStyle, subtextStyle }) {

    return (<>
        <link rel="stylesheet" href="/static/css/pic.css" />
        <a href={href} className="pic" target={target} style={style}>
            <img src={src} alt={alt} style={imgStyle} {...imageAttr} />
            {subtext && (<span className="pic-subtext" style={subtextStyle}>{subtext}</span>)}
        </a>
    </>);
}


// Wrappers
export function BlogArticle({ metadata = {}, children }) {

    // Default styles Component
    const stylePathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_ARTICLE_STYLES_FILE));
    const scriptPathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_ARTICLE_SCRIPT_FILE));
    const thumbnail = resolveUrl(metadata?.thumbnail, `/${path.relative(hostmdxInputPath, hostmdxCwd)}/`);
    const url = new URL(SITE_DOMAIN + "/" + path.relative(hostmdxInputPath, hostmdxCwd) + "/").href
    const defaultHead = (<>
        <link rel="stylesheet" href="/static/css/code.css" />
        <link rel="stylesheet" href="/static/css/article.css" />
        <script src="/static/js/article.js" type="module"></script>
        {stylePathExists && <link rel="stylesheet" href={DEFAULT_ARTICLE_STYLES_FILE} />}
        {scriptPathExists && <script src={DEFAULT_ARTICLE_SCRIPT_FILE} type="module"></script>}


        {/* Meta Data */}
        <meta name="description" content={metadata?.title} />
        <meta name="author" content={metadata?.author} />


        {/* Preview card*/}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={metadata?.title} />
        <meta property="og:image" content={thumbnail} />


        {/* Twitter Preview card*/}
        <meta name="twitter:site" content={SITE_NAME} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={metadata?.title} />
        <meta property="twitter:image" content={thumbnail} />
    </>);


    return (<HTMLSkeleton title={metadata?.title} extendHead={[defaultHead, metadata?.extendHead]}>

        <Header />
        <SearchBar />
        <NavBar />

        <div id="blog-article-header">
            {thumbnail && <img id="blog-article-thumbnail" src={thumbnail} onerror={`if(this.src!=="")this.src=""`} alt="thumbnail" />}
            <div id="blog-article-title-wrapper">
                <h1 id="blog-article-title">{metadata?.title}</h1>
                {metadata?.author && <a id="blog-article-author" className={!metadata?.authorWebsite && "blog-article-no-author"} href={metadata?.authorWebsite ? metadata?.authorWebsite : undefined}>By {metadata.author}</a>}
                {metadata?.createdOnDate && <div id="blog-article-creation-date">Posted: {formatDate(metadata?.createdOnDate)}</div>}
                {metadata?.editedOnDate && <div id="blog-article-update-date">Updated: {formatDate(metadata?.editedOnDate)}</div>}
            </div>
        </div>

        <article id="blog-article-content">{children}</article>

        <Footer />

    </HTMLSkeleton>)
}
export function Snippet({ metadata = {}, children }) {

    // Default styles Component
    const stylePathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_SNIPPET_STYLES_FILE));
    const scriptPathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_SNIPPET_SCRIPT_FILE));
    const thumbnail = resolveUrl(metadata?.thumbnail, `/${path.relative(hostmdxInputPath, hostmdxCwd)}/`);
    const url = new URL(SITE_DOMAIN + "/" + path.relative(hostmdxInputPath, hostmdxCwd) + "/").href
    const defaultHead = (<>
        <link rel="stylesheet" href="/static/css/code.css" />
        <link rel="stylesheet" href="/static/css/snippet.css" />
        <script src="/static/js/snippet.js" type="module"></script>
        {stylePathExists && <link rel="stylesheet" href={DEFAULT_SNIPPET_STYLES_FILE} />}
        {scriptPathExists && <script src={DEFAULT_SNIPPET_SCRIPT_FILE} type="module"></script>}


        {/* Meta Data */}
        <meta name="description" content={metadata?.title} />
        <meta name="author" content={metadata?.author} />


        {/* Preview card*/}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={metadata?.title} />
        <meta property="og:image" content={thumbnail} />


        {/* Twitter Preview card*/}
        <meta name="twitter:site" content={SITE_NAME} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={metadata?.title} />
        <meta property="twitter:image" content={thumbnail} />
    </>);


    return (<HTMLSkeleton title={metadata?.title} extendHead={[defaultHead, metadata?.extendHead]}>
        <Header />
        <SearchBar />
        <NavBar />

        <div id="snippet-header">
            {thumbnail !== "" && <img id="snippet-thumbnail" src={thumbnail} onerror={`if(this.src!=="")this.src=""`} alt="thumbnail" />}
            <div id="snippet-title-wrapper">
                <h1 id="snippet-title">{metadata?.title}</h1>
                {metadata?.author && <a id="snippet-author" className={!metadata?.authorWebsite && "snippet-no-author"} href={metadata?.authorWebsite ? metadata?.authorWebsite : undefined}>By {metadata.author}</a>}
                {metadata?.createdOnDate && <div id="snippet-creation-date">Posted: {formatDate(metadata?.createdOnDate)}</div>}
                {metadata?.editedOnDate && <div id="snippet-update-date">Updated: {formatDate(metadata?.editedOnDate)}</div>}
            </div>
        </div>

        <article id="snippet-content">{children}</article>

        <div className="tag-container">
            <Tags tags={metadata?.tags} />
        </div>

        <Footer />
    </HTMLSkeleton>)
}
