export function HTMLSkeleton({ title = "", description = "", children, ExtendHead = <></> }) {    // The "Boilerplate" html, Useful for cross device compatibility
    return (<>
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                <meta name="description" content={description}></meta>
                {ExtendHead}
            </head>
            <body>
                {children}
            </body>
        </html>
    </>)
}
export const Project = ({ imgSrc, text, link }) => {
    return (<div className="project-item">
        <img src={imgSrc} />
        <a href={link} target="_blank">{text}</a>
    </div>)
}
export const Experience = ({ position, company, duration, logo }) => {
    return (<div className="exp-item">

        <span className="exp-circle"></span>
        <span className="exp-line"></span>

        <div className="exp-content">
            <img className="exp-logo" height="70" width="70" src={logo} />
            <div className="exp-info">
                <h3 className="exp-position">{position}</h3>
                <div className="exp-company">{company}</div>
                <div className="exp-duration">{duration}</div>
            </div>
        </div>
    </div>);
}
export const Contact = ({ className, link }) => {
    return (<a href={link}>
        <i className={className}></i>
    </a>)
}