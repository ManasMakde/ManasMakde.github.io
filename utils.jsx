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