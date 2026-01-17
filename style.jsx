export const STYLES = <style>{`
    /* Core */
    :root {
    --bg: #0f1115;
    --surface: #151820;
    --text: #e6e6e6;
    --muted: #a0a4ab;
    --border:rgb(68, 71, 81);
    --accent: #7dd3fc;
    }
    
    * {
    box-sizing: border-box;
    }

    body {
    margin: 0;
    font-family: "Inter", system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    }
    

    /* Header */
    header {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        column-gap: 16px;
        align-items: center;
        text-align: center;
        margin: 0 auto 2.75rem auto;
        width: fit-content;
    }

    #header-pfp{
        grid-row: 1 / span 2; /* THIS makes the image take both lines */
        width: 70px;
    }

    #header-name {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text);
        text-align: left;
        align-self: end;
    }

    #header-motto {
        font-size: 1.1rem;
        color: var(--muted);
        text-align: left;
        vertical-align: top;
        align-self: self-start;
    }


    nav {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2.75rem;
    border-top: 2px solid var(--border);
    border-bottom: 2px solid var(--border);
    padding: 0.5rem 0;
    }

    nav a {
    color: var(--text);
    text-decoration: none;
    font-weight: 500;
    }

    nav a:hover {
    color: var(--accent);
    }

    .intro {
    margin-bottom: 3rem;
    font-size: 1.1rem;
    color: var(--text);
    }

    section {
    margin-bottom: 3.5rem;
    }

    section h2 {
    font-size: 1.45rem;
    margin-bottom: 1.2rem;
    color: var(--accent);
    font-weight: 500;
    }

    .highlight-item {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1.1rem 1.2rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    }

    ul {
    padding-left: 1.2rem;
    }

    li {
    margin-bottom: 0.85rem;
    color: var(--text);
    }

















    .highlights-grid {
    display: grid;
    gap: 1rem;
}

.highlight-card {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.highlight-card img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
}

.highlight-text h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--text);
}

.highlight-text p {
    margin: 0.25rem 0 0 0;
    font-size: 0.95rem;
    color: var(--muted);
}

`}</style>
