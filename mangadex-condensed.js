// ==UserScript==
// @name         MangaDex Condensed
// @namespace    suckerfree
// @license      MIT
// @version      11
// @description  Condense MangaDex for the whitespace impaired.
// @author       Nalin, u/stonksonlydown
// @match        https://mangadex.org/*
// @icon         https://www.google.com/s2/favicons?domain=mangadex.org
//
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

// Based on a script written by u/stonksonlydown.
// https://www.reddit.com/r/mangadex/comments/ogn4al/simple_tampermonkey_script_to_condense_followed/

(function() {
  // Configure GM_config.
  GM_config.init(
  {
    'id': 'MangaDexCondensed',
    'fields': {
      'CoverMode': {
        'label': 'Popup Cover When Hovered On',
        'type': 'select',
        'options': ['Container', 'Title + Cover', 'Title', 'Cover', 'Never'],
        'default': 'Cover'
      },
      'CoverSmallPreview': {
        'label': 'Always Show Small Cover',
        'type': 'checkbox',
        'default': true
      }
    },
    'events': {
      'open': function() {
        let s = GM_config.frame.style;
        s.inset = '100px auto auto calc(50% - 500px/2)';
        s.width = '500px';
        s.height = '200px';
      },
      'save': function() { location.reload(); },
      'reset': function() { location.reload(); }
    },
    'css': '#MangaDexCondensed_header { margin-bottom: 15px !important; }'
  });

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
      let coverSmallPreview = GM_config.get('CoverSmallPreview');

      // Thin out the container padding.
      addGlobalStyle('.chapter-feed__container {gap: 0.35rem !important; padding: 0.5rem !important; margin-bottom: 0.5rem !important;}');

      // Adjust the location of the cover image.
      if (coverSmallPreview) {
        addGlobalStyle('.chapter-feed__container {grid-template-columns: 50px minmax(0,1fr) !important;}');
        addGlobalStyle('.chapter-feed__cover {width: 42px !important; height: 60px !important; max-height: initial !important; padding-bottom: 0px !important;}');
      }
      else {
        addGlobalStyle('.chapter-feed__container {grid-template-areas: "title title" "divider divider" "art list" !important;}');
      }

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
      const apply_js_cb = async function(mutationsList, observer) {
        if (observer !== undefined)
          observer.disconnect();

        let containers = document.getElementsByClassName('chapter-feed__container');
        for (const container of containers) {
          let title = container.getElementsByClassName('chapter-feed__title')[0];
          let cover = container.getElementsByClassName('chapter-feed__cover')[0];
          let chapters = container.getElementsByClassName('chapter-feed__chapters')[0];

          if (title && cover && chapters) {
            // Abort if we've already processed this title.
            // Our observer can get called multiple times.
            if (title.classList.contains('condensed-parsed'))
              return;

            let count = 0;
            let coverMode = GM_config.get('CoverMode');
            let coverSmallPreview = GM_config.get('CoverSmallPreview');
            let hideTimeout = 0;

            // If we are popping the cover out, add some grace for the hide.
            if (!coverSmallPreview) {
              if (coverMode === 'Title + Cover') hideTimeout = 100;
              if (coverMode === 'Container') hideTimeout = 50;
            }

            const hide = function(e, t = hideTimeout) {
              setTimeout(function() {
                if (--count <= 0) {
                  count = 0;
                  if (coverSmallPreview) {
                    cover.style = "";
                    container.style = "";
                  }
                  else {
                    cover.style.display = "none";
                    chapters.style.gridColumn = "span 2 / span 2";
                  }
                }
              }, t);
            };
            const show = function() {
              ++count;
              if (coverSmallPreview) {
                cover.style = "width: 140px !important; height: 196px !important;";
                container.style = "grid-template-columns: 140px minmax(0,1fr) !important;"
              }
              else {
                cover.style.display = "grid";
                chapters.style.gridColumn = "span 1 / span 1";
              }
            };

            // Controls our method of showing covers.
            // Mouse enters: Show the cover and move the chapters over to the next column.
            // Mouse leaves: Hide the cover and span the chapters across the whole grid row.
            if (coverMode === 'Container') {
              container.addEventListener('mouseleave', hide);
              container.addEventListener('mouseenter', show);
            }
            if (coverMode === "Title" || coverMode == "Title + Cover") {
              title.addEventListener('mouseleave', hide);
              title.addEventListener('mouseenter', show);
            }
            if (coverMode === "Cover" || coverMode == "Title + Cover") {
              cover.addEventListener('mouseleave', hide);
              cover.addEventListener('mouseenter', show);
            }

            // Set up default state (cover hidden).
            if (!coverSmallPreview) {
              hide(undefined, 0);
            }

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
        //debugger;
        const page_container = document.getElementsByClassName('container mb-4')[0].parentElement;
        const chapter_observer = new MutationObserver(apply_js_cb);
        chapter_observer.observe(page_container, {attributes: false, childList: true, subtree: true});
        current_page_observer = chapter_observer;

        apply_js_cb();
      } catch (error) {}
    }

    function addConfig() {
      //debugger;
      let controls = document.getElementsByClassName('controls')[0];
      if (controls === undefined || controls.getElementsByClassName('condensed-settings').length !== 0)
        return;

      let findDataAttribute = function(e) {
        for (const attribute of e.attributes) {
          if (attribute.name.startsWith('data-'))
            return attribute.name;
          return null;
        }
      }

      // Settings gear icon uses the CC0 (public domain) license.
      // https://www.svgrepo.com/svg/201666/settings-gear

      let divData = findDataAttribute(controls.firstElementChild);
      let svgData = findDataAttribute(controls.firstElementChild.firstElementChild);

      let config = document.createElement('div');
      let icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      let path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      path1.setAttribute('stroke', 'currentColor');
      path1.setAttribute('stroke-width', '2');
      path1.setAttribute(svgData, '');
      path1.setAttribute('d', `M491.584,192.579l-55.918-6.914c-0.919-2.351-1.884-4.682-2.892-6.993l34.648-44.428
        c7.227-9.267,6.412-22.464-1.899-30.773l-57.028-56.996c-8.308-8.304-21.502-9.114-30.763-1.893L333.32,79.216
        c-2.312-1.008-4.644-1.974-6.994-2.894l-6.915-55.904c-1.443-11.66-11.348-20.415-23.097-20.415h-80.637
        c-11.748,0-21.656,8.755-23.097,20.416l-6.914,55.904c-2.349,0.919-4.681,1.884-6.988,2.89l-44.415-34.642
        c-9.261-7.222-22.458-6.414-30.768,1.894l-57.021,57.009c-8.31,8.307-9.123,21.506-1.896,30.771l34.644,44.417
        c-1.012,2.312-1.978,4.647-2.9,7.002l-55.906,6.914C8.757,194.022,0,203.927,0,215.676v80.64c0,11.75,8.758,21.658,20.421,23.097
        l55.901,6.903c0.919,2.352,1.884,4.686,2.894,6.994l-34.641,44.417c-7.224,9.264-6.411,22.46,1.894,30.767l57.021,57.031
        c8.307,8.31,21.507,9.121,30.773,1.896l44.417-34.648c2.306,1.007,4.638,1.974,6.987,2.891l6.914,55.921
        c1.441,11.66,11.348,20.416,23.097,20.416h80.637c11.748,0,21.655-8.755,23.097-20.416l6.915-55.92
        c2.351-0.92,4.682-1.885,6.993-2.892l44.425,34.65c9.266,7.225,22.463,6.414,30.771-1.898l57.015-57.031
        c8.307-8.308,9.117-21.504,1.893-30.768l-34.641-44.409c1.012-2.313,1.978-4.647,2.898-7.002l55.901-6.903
        c11.661-1.44,20.421-11.348,20.421-23.097v-80.64C512,203.927,503.243,194.022,491.584,192.579z M465.455,275.74l-49.864,6.158
        c-9.151,1.131-16.772,7.556-19.431,16.386c-2.813,9.337-6.56,18.387-11.138,26.903c-4.367,8.124-3.525,18.063,2.147,25.335
        l30.898,39.613l-27.924,27.932l-39.621-30.905c-7.269-5.668-17.202-6.513-25.327-2.15c-8.513,4.572-17.565,8.319-26.905,11.134
        c-8.827,2.661-15.25,10.279-16.381,19.427l-6.169,49.883h-39.492l-6.167-49.883c-1.131-9.146-7.551-16.763-16.375-19.425
        c-9.367-2.825-18.417-6.571-26.899-11.132c-8.122-4.369-18.061-3.527-25.336,2.147l-39.615,30.902L93.929,390.13l30.897-39.618
        c5.671-7.273,6.513-17.206,2.147-25.328c-4.568-8.501-8.315-17.554-11.137-26.911c-2.662-8.825-10.282-15.247-19.43-16.376
        l-49.861-6.156v-39.492l49.866-6.167c9.146-1.131,16.763-7.551,19.423-16.375c2.824-9.356,6.572-18.406,11.143-26.9
        c4.374-8.124,3.533-18.067-2.143-25.342l-30.903-39.62l27.924-27.918l39.62,30.902c7.273,5.672,17.209,6.513,25.335,2.146
        c8.493-4.565,17.541-8.31,26.896-11.132c8.825-2.662,15.247-10.279,16.378-19.427l6.166-49.867h39.494l6.169,49.869
        c1.133,9.148,7.557,16.767,16.384,19.427c9.328,2.811,18.379,6.557,26.902,11.135c8.122,4.364,18.055,3.522,25.325-2.149
        l39.616-30.894l27.927,27.912l-30.897,39.618c-5.666,7.267-6.513,17.191-2.158,25.311c4.58,8.54,8.328,17.599,11.138,26.923
        c2.661,8.825,10.279,15.248,19.427,16.381l49.878,6.169V275.74z`);

      path2.setAttribute('stroke', 'currentColor');
      path2.setAttribute('stroke-width', '2');
      path2.setAttribute(svgData, '');
      path2.setAttribute('d', `M255.997,155.153c-55.606,0-100.845,45.244-100.845,100.856c0,55.603,45.239,100.839,100.845,100.839
        c55.609,0,100.852-45.236,100.852-100.839C356.849,200.397,311.606,155.153,255.997,155.153z M255.997,310.303
        c-29.941,0-54.3-24.356-54.3-54.294c0-29.947,24.359-54.311,54.3-54.311c29.944,0,54.306,24.363,54.306,54.311
        C310.303,285.947,285.941,310.303,255.997,310.303z`);

      icon.classList.add('text-icon-black', "dark:text-icon-white", 'text-false', 'icon');
      icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      icon.setAttribute('width', '24');
      icon.setAttribute('height', '24');
      icon.setAttribute('viewBox', '0 0 512 512');
      icon.setAttribute('fill', 'currentColor');
      icon.setAttribute(svgData, '');
      icon.setAttribute(divData, '');
      icon.append(path1);
      icon.append(path2);

      config.classList.add('item', 'condensed-settings');
      config.setAttribute(divData, '');
      config.addEventListener('click', function() { GM_config.open(); });
      config.append(icon);

      controls.append(config);
    }

    // Avoid adding tons of duplicate styles.
    if (current_page_observer === undefined) {
      style();
    }

    observer();
    addConfig();
  }


  ///////////////////////////////////////////////////////////////////////////////
  function pageTitle() {
    function style() {
      // Give the chapter title a little more room.
      addGlobalStyle('.chapter-grid {grid-template-areas:"title title upload-info upload-info stats" !important;}');

      // When a chapter is read, gray out the chapter name.
      addGlobalStyle('.read {color:#b9b9b9 !important;}');
    }

    function observer() {
      const apply_js_cb = function(mutationsList, observer) {

        const chapters = document.querySelectorAll('.chapter');
        for (const chapter of chapters) {
          /*
          // Put the chapter name in the anchor's title so popups work.
          const title = chapter.querySelector('.chapter-grid > div:first-child > a');
          if (title !== undefined)
            title.title = title.text.trim();
          */

          // Put the "read" class on chapter group titles so we can gray out the group text.
          const read = chapter.classList.contains('read');
          if (read) {
            // Check if we are in a group.  We can test this by going to the parent and checking if we have a sibling (the title).
            const is_group = chapter.parentElement.previousElementSibling !== null;
            if (is_group) {
              chapter.parentElement.parentElement.classList.add('read');
            }
          }
        }
      };

      try {
        //debugger;
        const page_container = document.getElementsByClassName('flex gap-6 items-start mb-6')[0];
        const chapter_observer = new MutationObserver(apply_js_cb);
        chapter_observer.observe(page_container, {attributes: false, childList: true, subtree: true});
        current_page_observer = chapter_observer;
      } catch (error) {}
    }

    if (current_page_observer === undefined) {
      style();
      observer();
    }
  }

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // This is our loader.
  //debugger;
  const bootstrap_loader = function(mutationsList, observer) {
    observer.disconnect();

    // Detects page changes.
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
