// To-Set
const FLOAT_TYPES = new Set(["float", "double"]);
const CUSTOM_VALUE = "custom";


// Elements
const typeSelect = document.querySelector("#typeSelect");
const customTypeInput = document.querySelector("#customTypeInput");
const varInput = document.querySelector("#varInput");
const commentsCheck = document.querySelector("#commentsCheck");
const codeBlock = document.querySelector("#output");


// Methods
function onTypeSelectChange() {
    const isCustom = typeSelect.value === CUSTOM_VALUE;
    customTypeInput.style.display = isCustom ? "" : "none";
    render();
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function buildHTML(type, varName, showComments) {
    const capVar = capitalize(varName);
    const newVar = "new" + capVar;
    const oldVar = "old" + capVar;
    const isFloat = FLOAT_TYPES.has(type);
    const typeSpan = `<span class="hljs-built_in">${type}</span>`;
    const c = (text) => showComments ? `    <span class="hljs-comment">// ${text}</span>\n` : "";
    const inlineOld = showComments ? ` <span class="hljs-comment">/* ${oldVar} */</span>` : "";
    const inlineNew = showComments ? ` <span class="hljs-comment">/* ${newVar} */</span>` : "";
    const comparison = isFloat
        ? `<span class="hljs-title">Mathf</span>.<span class="hljs-title">Approximately</span>(<span class="hljs-params">${newVar}, ${varName}</span>)`
        : `${newVar} == ${varName}`;

    return `<span class="hljs-keyword">public</span> <span class="hljs-keyword">event</span> Action&lt;${typeSpan}${inlineOld}, ${typeSpan}${inlineNew}&gt; On${capVar}Updated;\n` +
        `\n` +
        `<span class="hljs-function"><span class="hljs-keyword">void</span> <span class="hljs-title">Set${capVar}</span>(<span class="hljs-params">${typeSpan} ${newVar}</span>)</span>\n` +
        `{\n` +
        `${c("Return if trying to assign the same value")}    <span class="hljs-keyword">if</span>(${comparison})\n` +
        `    {\n` +
        `        <span class="hljs-keyword">return</span>;\n` +
        `    }\n` +
        `\n` +
        `\n` +
        `${c("Store old value for broadcasting")}    <span class="hljs-keyword">var</span> ${oldVar} = ${varName};` +
        ` ${showComments ? "\n" : ""}` +
        ` ${showComments ? "\n" : ""}` +
        ` \n` +
        `${c("Assign new value")}    ${varName} = ${newVar};\n` +
        `    \n` +
        `    \n` +
        `${c("Broadcast")}    On${capVar}Updated?.Invoke(${oldVar}, ${newVar});\n` +
        `}\n` +
        `\n` +
        `<span class="hljs-function">${typeSpan} <span class="hljs-title">Get${capVar}</span>()</span>\n` +
        `{\n` +
        `    <span class="hljs-keyword">return</span> ${varName};\n` +
        `}`;
}
function render() {
    const type = typeSelect.value === CUSTOM_VALUE ? customTypeInput.value.trim() || CUSTOM_VALUE: typeSelect.value;
    const varName = varInput.value.trim() || "myVar";
    const showComments = commentsCheck.checked;
    codeBlock.innerHTML = buildHTML(type, varName, showComments);
}
function main() {
    // Bind Events
    typeSelect.addEventListener("change", onTypeSelectChange);
    customTypeInput.addEventListener("input", render);
    varInput.addEventListener("input", render);
    commentsCheck.addEventListener("change", render);

    render();
}

main();