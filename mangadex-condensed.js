// ==UserScript==
// @name         MangaDex Condensed
// @namespace    suckerfree
// @version      1.1
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

  // Reduce the padding around the update group.
  addGlobalStyle('div.v-application div.pa-4 {padding: 4px 8px !important;}');

  // Slightly reduce the font size of the chapter name.
  addGlobalStyle('div.pa-4 h6.text-body-1 {font-size: 0.9rem !important;}');

  // Remove the manga image.
  // TODO: Find a way to bring back on mouseover of the series name.
  addGlobalStyle('div.pa-4 div.outer {display: none !important;}');

  // Condense the whitespace around the separator line between the series name and the chapter updates.
  addGlobalStyle('div.pa-4 div.mt-3 {margin: 4px !important; margin-top: 0px !important;}');

  // Fix the column width of the chapter updates so the update time doesn't wrap to the next line.
  addGlobalStyle('div.pa-4 .d-flex .col-lg-4 {flex: 0 0 30% !important; max-width: 30% !important;}');
  addGlobalStyle('div.pa-4 .d-flex .pa-3 {padding: 0px !important;}');
})();
