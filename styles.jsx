export const STYLES = <style>{`
    /* Core */
    :root {
        --bg: #0f1115;
        --surface: #151820;
        --text: #e6e6e6;
        --muted: #a0a4ab;
        --border:rgb(68, 71, 81);
        --accent: #7dd3fc;
        --body-width: 680px;
        --project-gaps: 10px;
        --exp-item-margin: 1rem; 
    }
    body {
        font-family: system-ui, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.7;
        max-width: var(--body-width);
        margin: 0 auto;
        padding: 2rem 1.5rem 0 2rem;
    }
    a {
        color: var(--text);
    }
    a:hover {
        color: var(--accent);
    }
    section {
        margin-bottom: 3.5rem;
    }
    h2 {
        font-size: 1.45rem;
        color: var(--accent);
        font-weight: 500;
    }



    /* Header */
    header {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        column-gap: 16px;
        margin: 0 auto 2.75rem auto;
        width: fit-content;
    }
    #header-pfp{
        grid-row: 1 / span 2;
        width: 4.5rem;
        image-rendering: pixelated;
    }
    #header-name {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text);
        align-self: end;
    }
    #header-motto {
        font-size: 1.1rem;
        color: var(--accent);
    }



    /* Navigation */
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



    /* Introduction */
    .intro {
        margin-bottom: 3rem;
        font-size: 1.1rem;
        color: var(--text);
    }



    /* Highlights */
    .highlight-item {
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 1.1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    .highlight-card {
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 1.1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        min-height: 2.5rem;
        display: flex;
    }



    /* Projects */
    #projects {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
        gap: 16px;
    }
    .project-item {
        display: flex;
        flex-direction: column;
        aspect-ratio: 1 / 1;
        box-sizing: border-box;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        overflow: hidden;
    }
    .project-item img {
        flex: 1 1 0;
        min-height: 0;
        object-fit: cover;
        width: 100%;
    }
    .project-item a {
        height: 3rem;
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-content: center;
        cursor: pointer;
        font-weight: 500;
        text-decoration: none;
    }



    /* Experience */
    #experience {
        margin-bottom: 2rem;
    }
    .exp-item {
        position: relative;
        padding-left: 3rem;
        margin-bottom: var(--exp-item-margin);
        box-sizing: border-box;
    }
    .exp-circle {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        width: 0.85rem;
        height: 0.85rem;
        background: var(--accent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
    }
    .exp-line {
        position: absolute;
        left: 0.75rem;
        width: 3px;
        height: calc(100% + var(--exp-item-margin));
        background: var(--accent);
        transform: translateX(-50%);
    }
    .exp-item:first-child .exp-line {
        height: calc(50% + var(--exp-item-margin));
        top: 50%;
    }
    .exp-item:only-child .exp-line {
        display: none;
    }
    .exp-item:last-child .exp-line {
        height: 50%;
    }
    .exp-content {
        background: var(--surface);
        padding: 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--border);
        display: flex;
        align-items: center; 
        gap: 20px;
    }
    .exp-position {
        margin: 0;
    }
    .exp-duration {
        font-size: 0.9rem;
        color: var(--muted);
    }
    #resume {
        display: inline-flex;
        gap: 5px;
        margin-left:3rem;
        background: rgba(0,0,0,0);
        color: var(--muted);
        border: 0;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid var(--muted);
        border-radius: 6px;
        padding:0.5rem 0.75rem;
        flex-wrap: wrap;
        align-items: anchor-center;
        text-decoration: none;
    }
    #resume i {
        height: fit-content;
    }
    #resume:hover {
        color: var(--accent);
        border: 1px solid var(--accent);
    }

    

    /* Footer */
    footer {
        margin-top: 4.5rem;
        padding: 1rem 0 1rem 0;
        border-top: 2px solid var(--border);
        color: var(--muted);
        text-align: center;
    }
    footer a {
        color: var(--muted);
    }
    #contacts {
        display: flex;
        justify-content: center;
        column-gap: 2rem;
    }
    #contacts a {
        font-size: 2rem;
    }
    #invite-msg {
        font-size: 0.8rem;
        opacity: 0; 
    }
    #contacts:hover+#invite-msg {
        opacity: 1;
    }
    #bottom-note {
        margin-top: 1rem;
        font-size: 0.8rem;
    }

`}</style>
