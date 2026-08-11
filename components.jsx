import fs from "fs";
import path from "path";


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
        <img id="site-logo" alt="logo" src={"/static/logo.png"} />
        <div id="site-title">{"Manas R. Makde"}</div>
        <div id="site-motto">{"Let's keep it dead simple!"}</div>
    </a>)
}
export const NavBar = ({ }) => {
    return (<nav id="navigation-bar">
        <a href="https://sourcesnippet.com/" target="_blank">Blog</a>
        {/* <a href="/blog">Blog</a> */}
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
            <a id="buymeacoffee" target="_blank" href="https://buymeacoffee.com/manas_makde"></a>
        </div>
        <div id="bottom-note">Scraping data for AI training is strictly prohibited. <a href="/terms#ai-data-scraping-policy" style="text-decoration:underline">View Terms</a></div>
    </footer>)
}
