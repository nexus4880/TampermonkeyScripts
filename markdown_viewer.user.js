// Original script from https://github.com/saravanabalagi/markdown_viewer/blob/master/markdown_viewer.user.js ran through ChatGPT to make it dark mode 

// ==UserScript==
// @name         Markdown Viewer Dark Mode Friendly
// @author       Saravanabalagi Ramachandran + ChatGPT
// @version      0.2
// @description  Renders readme files in markdown with dark mode support
// @include      file:///*.md
// @require      http://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.0/showdown.min.js
// ==/UserScript==

document.head.insertAdjacentHTML(
  'beforeend', 
  '<link href="https://unpkg.com/primer/build/build.css" rel="stylesheet">'
);

// Add dark mode styles
const darkModeCSS = `
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #0d1117 !important;
      color: #c9d1d9 !important;
    }
    .Box {
      background-color: #161b22 !important;
      border-color: #30363d !important;
    }
    .Box-header, .Box-body {
      background-color: #161b22 !important;
    }
    a {
      color: #58a6ff !important;
    }
    pre, code {
      background-color: #0d1117 !important;
      color: #c9d1d9 !important;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      color: #c9d1d9 !important;
    }
  }
`;
const styleNode = document.createElement('style');
styleNode.textContent = darkModeCSS;
document.head.appendChild(styleNode);

let converter = new showdown.Converter();
converter.setFlavor('github');

let bodyNode = document.getElementsByTagName("body")[0];
let markdownPre = document.getElementsByTagName('pre')[0];

let markdownParentNode = document.createElement("div");
markdownParentNode.innerHTML = `
<div class="container" style="padding:24px">
  <div id="readme" class="Box Box--condensed instapaper_body md js-code-block-container">
      <div class="Box-header d-flex flex-items-center flex-justify-between px-2">
        <h3 class="Box-title pr-3">
          <span class="octicon octicon-clippy"></span>
          <svg class="octicon octicon-book" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M3 5h4v1H3V5zm0 3h4V7H3v1zm0 2h4V9H3v1zm11-5h-4v1h4V5zm0 2h-4v1h4V7zm0 2h-4v1h4V9zm2-6v9c0 .55-.45 1-1 1H9.5l-1 1-1-1H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h5.5l1 1 1-1H15c.55 0 1 .45 1 1zm-8 .5L7.5 3H2v9h6V3.5zm7-.5H9.5l-.5.5V12h6V3z"></path></svg>
          <span class="Box-title-span"></span>
        </h3>
      </div>
      <div class="Box-body">
          <article class="markdown-body entry-content p-5" itemprop="text">
          </article>
      </div>
  </div>
</div>
`;

let markdownNode = markdownParentNode.getElementsByClassName("markdown-body")[0];
let titleNode = markdownParentNode.getElementsByClassName("Box-title-span")[0];
let documentTitle = document.location.href;
let documentTitleTokens = documentTitle.split("/");
let filename = documentTitleTokens[documentTitleTokens.length - 1];
titleNode.innerHTML = filename;

let html = converter.makeHtml(markdownPre.innerHTML);
markdownNode.innerHTML = html;

bodyNode.appendChild(markdownParentNode);
bodyNode.removeChild(markdownPre);
