const SPRITE_SHEET_MAKER_DOWNLOADS = 1400

export const SpriteSheetMakerHighlight = () => {
    return (<div className="highlight-card">
        <b>⭐ My blender plugin <a href="https://extensions.blender.org/add-ons/sprite-sheet-maker/">Sprite Sheet Maker</a> crossed <span id="plugin-download-count">{SPRITE_SHEET_MAKER_DOWNLOADS}</span>+ downloads!</b>
    </div>)
}
export const StackOverflowHighlight = () => {
    return (<div className="highlight-card">
        <b>✅ My <a href="https://stackoverflow.com/a/78506441/22302305">solution</a> on stackoverflow got accepted!</b>
    </div>)
}
export const HostMdxHighlight = () => {
    return (<div className="highlight-card">
        <b>📦 Published my own npx cli tool <a href="https://www.npmjs.com/package/host-mdx">host-mdx</a> on npm!</b>
    </div>)
}
