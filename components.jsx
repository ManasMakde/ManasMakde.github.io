import fs from "fs";
import path from "path";
import { SITE_NAME, SITE_DOMAIN, SITE_MOTTO, SITE_LOGO_PATH, PLACEHOLDER_IMG_PATH } from "@/static/js/global.js";


// Properties
export const DEFAULT_SNIPPET_STYLES_PATH = "styles.css";
export const DEFAULT_SNIPPET_SCRIPT_PATH = "script.js";
export const DEFAULT_CODE_TAB_STYLE = "max-height:31rem";
const languageClassPrefix = "hljs language-";
const displayNameProp = "display-name";


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


// Components
export function HTMLSkeleton({ title = "", extendHead = <></>, children }) {  // The "Boilerplate" html, Useful for cross device compatibility
    return (<>
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                {extendHead}
            </head>
            <body>
                {children}
            </body>
        </html>
    </>)
}
export function Header() {
    return (<a id="site-header" href="/">
        <img id="site-logo" alt="logo" src={SITE_LOGO_PATH} />
        <div id="site-title">{SITE_NAME}</div>
        <div id="site-motto">{SITE_MOTTO}</div>
    </a>)
}
export const NavBar = ({ }) => {
    return (<nav id="navigation-bar">
        <a href="/blog">Blog</a>
        <a href="/#projects">Projects</a>
        <a href="/#experience">Experience</a>
        <a href="/#contacts">Contact</a>
    </nav>)
}
export function SearchBar({ id = "searchbar" }) {
    return (<div id={id} className="search-wrapper">
        <script src="/static/js/search-bar.js" type="module"></script>
        <input className="search-input" type="text" placeholder="Search..." />
        <div className="search-dropdown">
            <div className="search-results"></div>
            <a href="#" className="search-more" style={"display:none"}>Show all results</a>
            <a className="search-nonefound" style={"display:none"}>No results found</a>
            <a className="search-loading" style={"display:none"}>Loading...</a>
        </div>
        <button className="search-btn" aria-label="Search Button"></button>
    </div>)
}
export function SnippetCard({ id, imgSrc, title, date, description, link, isLoading = false, loadingClass = "is-loading" }) {
    const removeLoadingFunction = isLoading ? `this.parentElement.classList.remove('${loadingClass}')` : "";
    const errorFunction = `if(this.src!=='${PLACEHOLDER_IMG_PATH}')this.src='${PLACEHOLDER_IMG_PATH}';${removeLoadingFunction}`;
    return (<div id={id} className={`card ${isLoading ? loadingClass : ""}`}>
        <a href={link} className="card-image-link">
            <img className={isLoading ? loadingClass : ""} src={imgSrc} onError={errorFunction} onLoad={removeLoadingFunction} alt="thumbnail" fetchPriority="high" />
        </a>

        <div className="card-body">
            <a href={link} className="card-title-link">
                <h2 className="card-title">{title}</h2>
            </a>
            <span className="card-date">{date}</span>
            <p className="card-description">{description}</p>
        </div>
    </div>)
}
export function Snippet({ metaData = {}, children }) {

    // Default styles Component
    const stylePathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_SNIPPET_STYLES_PATH));
    const scriptPathExists = fs.existsSync(path.join(hostmdxCwd, DEFAULT_SNIPPET_SCRIPT_PATH));
    const title = `${metaData?.title}`;
    const url = new URL(SITE_DOMAIN + "/" + path.relative(hostmdxInputPath, hostmdxCwd) + "/").href
    const thumbnail = metaData?.thumbnail ? new URL(metaData?.thumbnail, url).href : "";
    const defaultHead = (<>
        <link rel="preload" href="/static/copy-done-icon.png" as="image" />
        <link rel="stylesheet" href="/static/css/code-styles.css" />
        <link rel="stylesheet" href="/static/css/global-styles.css" />
        <script src="/static/js/snippets.js"></script>
        <meta name="description" content={title} />
        <meta name="author" content={metaData?.author} />
        {stylePathExists && <link rel="stylesheet" href={DEFAULT_SNIPPET_STYLES_PATH} />}
        {scriptPathExists && <script src={DEFAULT_SNIPPET_SCRIPT_PATH} type="module"></script>}


        {/* Preview card*/}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={thumbnail} />


        <meta name="twitter:site" content={SITE_NAME} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:image" content={thumbnail} />
    </>);


    return (<HTMLSkeleton title={`${metaData?.title}`} extendHead={[defaultHead, metaData?.extendHead]}>

        <Header />
        <SearchBar />
        <NavBar />

        <div id="snippet-header">
            {metaData?.thumbnail && metaData?.thumbnail !== "" && <img id="snippet-thumbnail" src={metaData?.thumbnail} onerror={`if(this.src!=='${PLACEHOLDER_IMG_PATH}')this.src='${PLACEHOLDER_IMG_PATH}'`} alt="thumbnail" />}
            <div id="snippet-card-title-wrapper">
                <h1 id="snippet-card-title">{metaData?.title ?? "Untitled"}</h1>
                {metaData?.author && <a id="snippet-author" className={!metaData?.authorWebsite && "snippet-no-author"} href={metaData?.authorWebsite ? metaData?.authorWebsite : undefined}>By {metaData.author}</a>}
                {metaData?.createdOnDate && <div id="snippet-creation-date">Posted: {formatDate(metaData?.createdOnDate)}</div>}
                {metaData?.editedOnDate && <div id="snippet-update-date">Updated: {formatDate(metaData?.editedOnDate)}</div>}
            </div>
        </div>

        <article id="snippet-content">
            {children}
        </article>

        <Footer showWarning={true} />

    </HTMLSkeleton>)
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
        if (!(firstSubchild?.props?.className instanceof String) && (firstSubchild?.props?.[displayNameProp] instanceof String)) {
            continue;
        }


        // Get language from displayName
        if (firstSubchild?.props?.[displayNameProp]) {
            languages.push(firstSubchild?.props?.[displayNameProp]);
            continue;
        }


        // Fallback by getting language from className
        let language = firstSubchild?.props?.className?.replace(languageClassPrefix, "");
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
        <div className="codetabs-topbar">{topbarContent}</div>
        <button className="codetabs-copy" onclick="copyCode(this)"></button>
        <div className="codetabs-content">
            {children}
        </div>
    </div>)
}
export function PaginationBar({ id = "pagination", style }) {
    return (<nav id={id} style={style}>
        <a className="pagination-prev" aria-label="prev"></a>
        <a className="pagination-item"></a>
        <span className="pagination-dots">...</span>
        <a className="pagination-item" ></a>
        <a className="pagination-item" ></a>
        <a className="pagination-item pagination-active" ></a>
        <a className="pagination-item" ></a>
        <a className="pagination-item" ></a>
        <span className="pagination-dots">...</span>
        <a className="pagination-item" ></a>
        <a className="pagination-next" aria-label="next"></a>
    </nav>)
}
export const Contact = ({ className, link }) => {
    return (<a href={link}>
        <i className={className}></i>
    </a>)
}
export function Footer({ }) {
    return (<footer>
        <div id="contacts">
            <a id="github-contact" target="_blank" href="https://github.com/ManasMakde"></a>
            <a id="stackoverflow-contact" target="_blank" href="https://stackoverflow.com/users/22302305/manas-r-makde"></a>
            <a id="linkedin-contact" target="_blank" href="https://www.linkedin.com/in/manas-makde/"></a>
            <a id="instagram-contact" target="_blank" href="https://www.instagram.com/manas_makde/"></a>
            <a id="email-contact" target="_blank" href="mailto:manasmakde@gmail.com"></a>
        </div>
        <div id="bottom-note">Scraping data for AI training is strictly prohibited. <a href="/terms#ai-data-scraping-policy" style="text-decoration:underline">View Terms</a></div>
    </footer>)
}
