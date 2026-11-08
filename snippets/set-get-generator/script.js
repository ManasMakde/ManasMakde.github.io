const FLOAT_TYPES=new Set(["float","double"]),CUSTOM_VALUE="custom",typeSelect=document.querySelector("#typeSelect"),customTypeInput=document.querySelector("#customTypeInput"),varInput=document.querySelector("#varInput"),commentsCheck=document.querySelector("#commentsCheck"),codeBlock=document.querySelector("#output");function onTypeSelectChange(){const isCustom=typeSelect.value===CUSTOM_VALUE;customTypeInput.style.display=isCustom?"":"none",render()}function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}function buildHTML(type,varName,showComments){const capVar=capitalize(varName),newVar="new"+capVar,oldVar="old"+capVar,isFloat=FLOAT_TYPES.has(type),typeSpan=`<span class="hljs-built_in">${type}</span>`,c=text=>showComments?`    <span class="hljs-comment">// ${text}</span>
`:"",inlineOld=showComments?` <span class="hljs-comment">/* ${oldVar} */</span>`:"",inlineNew=showComments?` <span class="hljs-comment">/* ${newVar} */</span>`:"",comparison=isFloat?`<span class="hljs-title">Mathf</span>.<span class="hljs-title">Approximately</span>(<span class="hljs-params">${newVar}, ${varName}</span>)`:`${newVar} == ${varName}`;return`<span class="hljs-keyword">public</span> <span class="hljs-keyword">event</span> Action&lt;${typeSpan}${inlineOld}, ${typeSpan}${inlineNew}&gt; On${capVar}Updated;

<span class="hljs-function"><span class="hljs-keyword">void</span> <span class="hljs-title">Set${capVar}</span>(<span class="hljs-params">${typeSpan} ${newVar}</span>)</span>
{
${c("Return if trying to assign the same value")}    <span class="hljs-keyword">if</span>(${comparison})
    {
        <span class="hljs-keyword">return</span>;
    }


${c("Store old value for broadcasting")}    <span class="hljs-keyword">var</span> ${oldVar} = ${varName}; ${showComments?`
`:""} ${showComments?`
`:""} 
${c("Assign new value")}    ${varName} = ${newVar};
    
    
${c("Broadcast")}    On${capVar}Updated?.Invoke(${oldVar}, ${newVar});
}

<span class="hljs-function">${typeSpan} <span class="hljs-title">Get${capVar}</span>()</span>
{
    <span class="hljs-keyword">return</span> ${varName};
}`}function render(){const type=typeSelect.value===CUSTOM_VALUE?customTypeInput.value.trim()||CUSTOM_VALUE:typeSelect.value,varName=varInput.value.trim()||"myVar",showComments=commentsCheck.checked;codeBlock.innerHTML=buildHTML(type,varName,showComments)}function main(){typeSelect.addEventListener("change",onTypeSelectChange),customTypeInput.addEventListener("input",render),varInput.addEventListener("input",render),commentsCheck.addEventListener("change",render),render()}main();
