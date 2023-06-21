// ==UserScript==
// @name         MangaDex Condensed
// @namespace    suckerfree
// @version      8
// @description  Condense MangaDex for the whitespace impaired.
// @author       Nalin, u/stonksonlydown
// @match        https://mangadex.org/*
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

  // Store this so when we change pages, we can disconnect it.
  let current_page_observer = undefined;
  let previous_pathname = location.pathname;

  ///////////////////////////////////////////////////////////////////////////////
  function pageFollows() {
    function style() {
      // Thin out the container padding.
      addGlobalStyle('.chapter-feed__container {gap: 0.35rem !important; padding: 0.5rem !important; margin-bottom: 0.5rem !important; grid-template-areas: "title title" "divider divider" "art list" !important;}');

      // Remove bolding of the chapter titles.
      // Adjust the font size of the series name.
      addGlobalStyle('.chapter-grid > div:first-child > a {font-weight: normal !important; font-size: 0.85rem !important;}');

      // Adjust the font size for the series name.
      addGlobalStyle('.chapter-feed__title {font-size: 0.85rem !important;}');

      // Alter the grid spacing to give more room for the chapter name.
      addGlobalStyle('.chapter-grid {grid-template-columns:minmax(0,8fr) minmax(0,4fr) minmax(0,2fr) minmax(0,3fr) !important;}');

      // When a chapter is read, gray out the chapter name.
      addGlobalStyle('.chapter.read {color:#b9b9b9 !important;}');
    }

    function observer() {
      const apply_js_cb = function(mutationsList, observer) {
        observer.disconnect();

        let containers = document.getElementsByClassName('chapter-feed__container');
        for (const container of containers) {
          let title = container.getElementsByClassName('chapter-feed__title')[0];
          let cover = container.getElementsByClassName('chapter-feed__cover')[0];
          let chapters = container.getElementsByClassName('chapter-feed__chapters')[0];

          if (title && cover && chapters) {
            const hide = function() {
              cover.style.display = "none";
              chapters.style.gridColumn = "span 2 / span 2";
            };
            const show = function() {
              cover.style.display = "grid";
              chapters.style.gridColumn = "span 1 / span 1";
            };

            // Abort if we've already processed this title.
            // Our observer can get called multiple times.
            if (title.classList.contains('condensed-parsed'))
              return;

            /// Mouse leaves title.  Hide the cover and span the chapters across the whole grid row.
            title.addEventListener('mouseleave', hide);

            // Mouse over title.  Show the cover and move the chapters over to the next column.
            title.addEventListener('mouseenter', show);

            // Set up default state (cover hidden).
            hide();

            // Put the chapter name in the anchor's title so popups work.
            for (const chapter of chapters.querySelectorAll('.chapter')) {
              const title = chapter.querySelector('.chapter-grid > div:first-child > a');
              if (title !== undefined)
                title.title = title.text.trim();
            }

            // Mark that we've processed this title.
            title.classList.add('condensed-parsed');
          }
        }

        try {
          observer.observe(page_container, {attributes: false, childList: true, subtree: true});
        } catch (error) {}
      };

      try {
        const page_container = document.getElementsByClassName('container mb-4')[0].parentElement;
        const chapter_observer = new MutationObserver(apply_js_cb);
        chapter_observer.observe(page_container, {attributes: false, childList: true, subtree: true});
        current_page_observer = chapter_observer;
      } catch (error) {}
    }

    style();
    observer();
  }


  ///////////////////////////////////////////////////////////////////////////////
  function pageTitle() {
    function style() {
      // Give the chapter title a little more room.
      addGlobalStyle('.chapter-grid {grid-template-areas:"title title upload-info upload-info stats" !important;}');
    }

    function observer() {
      const apply_js_cb = function(mutationsList, observer) {
        // Put the chapter name in the anchor's title so popups work.
        const chapters = document.querySelectorAll('.chapter');
        for (const chapter of chapters) {
          const title = chapter.querySelector('.chapter-grid > div:first-child > a');
          if (title !== undefined)
            title.title = title.text.trim();
        }
      };

      try {
        const page_container = document.getElementsByClassName('manga-container')[0].parentElement;
        const chapter_observer = new MutationObserver(apply_js_cb);
        chapter_observer.observe(page_container, {attributes: false, childList: true, subtree: false});
        current_page_observer = chapter_observer;
      } catch (error) {}
    }

    style();
    observer();
  }

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // This is our loader.
  debugger;
  const bootstrap_loader = function(mutationsList, observer) {
    observer.disconnect();

    const page_transfer_loader = function(mutationsList, observer) {
      observer.disconnect();

      if (current_page_observer !== undefined && previous_pathname !== location.pathname) {
        current_page_observer.disconnect();
        current_page_observer = undefined;
        previous_pathname = location.pathname;
      }

      // Choose the style function to apply.
      //debugger;
      let pageFunction = undefined;
      if (/\/titles\/feed/.test(location.pathname))
        pageFunction = pageFollows;
      else if (/\/titles\/latest/.test(location.pathname))
        pageFunction = pageFollows;
      else if (/\/my\/history/.test(location.pathname))
        pageFunction = pageFollows;
      else if (/\/title\//.test(location.pathname))
        pageFunction = pageTitle;

      if (pageFunction !== undefined)
        pageFunction();

      observer.observe(content_container, {attributes: false, childList: true, subtree: true});
    };

    const content_container = document.querySelector('#__layout > div:first-child > div:nth-child(2) > div:nth-child(2)');
    const content_observer = new MutationObserver(page_transfer_loader);
    content_observer.observe(content_container, {attributes: false, childList: true, subtree: true});
  };

  // This is the first bootstrap loader.
  // This will catch the main page being loaded.
  // At this point, we switch over to our page transfer loader which will detect page changes.
  window.onload = (event) => {
    const load_observer = new MutationObserver(bootstrap_loader);
    load_observer.observe(document.body, {attributes: false, childList: true, subtree: false});
  };
})();