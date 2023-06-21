// ==UserScript==
// @name         MangaDex Condensed
// @namespace    suckerfree
// @version      1.2
// @description  Condense MangaDex for the whitespace impaired.
// @author       Nalin, u/stonksonlydown
// @match        https://mangadex.org/titles/feed
// @icon         https://www.google.com/s2/favicons?domain=mangadex.org
// @grant        none
// ==/UserScript==

// Based on a script written by u/stonksonlydown.
// https://www.reddit.com/r/mangadex/comments/ogn4al/simple_tampermonkey_script_to_condense_followed/

(function() {
  // Adds a style to the <head> tags.
  function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
  }

  // Remove bolding of the chapter titles.
  addGlobalStyle('.chapter-list__title {font-weight: normal !important;}');

  // Slightly reduce the font size of the series name.
  addGlobalStyle('.chapter-feed__title span {font-size: 0.9rem !important;}');

})();

const apply_js_cb = function(mutationsList, observer) {
  observer.disconnect();
  console.log('Applying JS.');

  let containers = document.getElementsByClassName('chapter-feed__container');
  for (const container of containers) {
    let title = container.getElementsByClassName('chapter-feed__title')[0];
    let cover = container.getElementsByClassName('chapter-feed__cover')[0];
    let chapters = container.getElementsByClassName('chapter-feed__chapters')[0];

    if (title && cover && chapters) {
      container.style.display = "block";
      container.style.gap = "0.5rem";
      title.style.paddingBottom = "0.5em";
      cover.style.display = "none";
      chapters.style.paddingTop = "0.5em";

      title.addEventListener('mouseenter', e => {
        container.style.display = "grid";
        title.style.paddingBottom = "0";
        cover.style.display = "block";
        chapters.style.paddingTop = "0";
      });
      title.addEventListener('mouseleave', e => {
        container.style.display = "block";
        title.style.paddingBottom = "0.5em";
        cover.style.display = "none";
        chapters.style.paddingTop = "0.5em";
      });
    }
  }
};

window.onload = (event) => {
  const loading_cb = function(mutationsList, observer) {
    observer.disconnect();

    const page_container = document.getElementsByClassName('container mb-4 wide')[0].parentElement;
    const chapter_observer = new MutationObserver(apply_js_cb);
    chapter_observer.observe(page_container, {attributes: false, childList: true, subtree: true});
  };

  const load_observer = new MutationObserver(loading_cb);
  load_observer.observe(document.body, {attributes: false, childList: true, subtree: false});
};
