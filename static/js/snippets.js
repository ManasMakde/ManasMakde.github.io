// Methods
function changeTab(element, index) {

    // Make sure index is a number
    index = parseInt(index)
    if (isNaN(index)) {
        return;
    }


    // Get content contains all code blocks
    let content = element?.parentNode?.parentNode;


    // Hide old code block
    let activeTab = content?.querySelector(".codetabs-active");
    activeTab?.classList?.remove("codetabs-active");


    // Activate new code block
    let preElement = element.parentNode.parentNode.querySelectorAll("pre");
    preElement?.[index]?.classList?.add("codetabs-active");
}

function changeTabByButton(element, index) {

    // Change tab based on index
    changeTab(element, index);


    // Remove old selected from button
    let selectedBtn = element?.parentNode?.querySelector(".codetabs-selected");
    selectedBtn?.classList?.remove("codetabs-selected");


    // Add selected to new button
    element.classList.add("codetabs-selected");
}

function copyCode(element) {
    // Get content contains all code blocks
    let content = element?.parentNode;
    let codeElement = content?.querySelector(".codetabs-active code");

    navigator.clipboard.writeText(codeElement?.innerText?.trim() ?? "");
}