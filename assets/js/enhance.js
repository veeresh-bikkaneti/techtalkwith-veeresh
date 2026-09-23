/**
 * Progressive enhancements — the site works without this file.
 *  - Posts: reading progress bar, table of contents with scroll-spy,
 *           heading anchor links, copy buttons on code blocks.
 *  - Blog index: search + topic filter (state kept in the URL: ?tag=…&q=…).
 */
(function () {
  'use strict';

  /* ---------------- Post pages ---------------- */
  var content = document.querySelector('.post-content');
  if (content) {
    var layout = document.querySelector('.post-layout');

    // Reading progress
    document.documentElement.classList.add('has-progress');
    var bar = document.querySelector('.read-progress');
    var ticking = false;
    function updateProgress() {
      var rect = content.getBoundingClientRect();
      var total = rect.height - window.innerHeight * 0.6;
      var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      if (bar) bar.style.setProperty('--progress', p.toFixed(4));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();

    // Heading ids + anchors
    var used = {};
    function slugify(t) {
      var s = t.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 64) || 'section';
      var base = s, i = 2;
      while (used[s] || document.getElementById(s)) { s = base + '-' + i++; }
      used[s] = true;
      return s;
    }
    var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3'));
    headings.forEach(function (h) {
      h.dataset.tocText = h.textContent.trim();
      if (!h.id) h.id = slugify(h.textContent);
      else used[h.id] = true;
      var a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', 'Link to this section');
      a.textContent = '#';
      h.appendChild(a);
    });

    // Table of contents (only when there is enough structure to navigate)
    var toc = document.querySelector('.post-toc');
    var h2s = headings.filter(function (h) { return h.tagName === 'H2'; });
    if (toc && layout && h2s.length >= 3) {
      var list = toc.querySelector('.post-toc-list');
      var links = [];
      headings.forEach(function (h) {
        var li = document.createElement('li');
        li.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
        if (h.tagName === 'H3' && headings.length > 24) return; // keep long posts scannable
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.dataset.tocText;
        li.appendChild(a);
        list.appendChild(li);
        links.push({ h: h, a: a });
      });
      toc.hidden = false;
      layout.classList.add('has-toc');

      if ('IntersectionObserver' in window) {
        var current = null;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var hit = links.filter(function (l) { return l.h === e.target; })[0];
              if (hit && hit !== current) {
                if (current) current.a.classList.remove('is-current');
                hit.a.classList.add('is-current');
                current = hit;
              }
            }
          });
        }, { rootMargin: '0px 0px -70% 0px' });
        links.forEach(function (l) { io.observe(l.h); });
      }
    }

    // Copy buttons on code blocks
    if (navigator.clipboard) {
      content.querySelectorAll('pre').forEach(function (pre) {
        if (pre.closest('.mermaid-container') || !pre.querySelector('code') || pre.querySelector('code.language-mermaid')) return;
        var wrap = document.createElement('div');
        wrap.className = 'code-wrap';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.addEventListener('click', function () {
          navigator.clipboard.writeText(pre.innerText.replace(/\n$/, '')).then(function () {
            btn.textContent = 'Copied';
            btn.classList.add('copied');
            setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1600);
          });
        });
        wrap.appendChild(btn);
      });
    }
  }

  /* ---------------- Blog index: search + filter ---------------- */
  var grid = document.getElementById('posts-grid');
  var search = document.getElementById('post-search');
  if (grid && search) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.post-card'));
    var chipsWrap = document.querySelector('.tag-filter');
    var countEl = document.getElementById('results-count');
    var empty = document.getElementById('empty-state');
    var params = new URLSearchParams(location.search);
    var state = { tag: (params.get('tag') || '').toLowerCase(), q: params.get('q') || '' };
    search.value = state.q;

    // A tag coming from a post page may not be one of the top chips — add it.
    if (state.tag && !chipsWrap.querySelector('[data-tag="' + CSS.escape(state.tag) + '"]')) {
      var extra = document.createElement('button');
      extra.type = 'button';
      extra.className = 'chip';
      extra.dataset.tag = state.tag;
      extra.textContent = state.tag;
      chipsWrap.insertBefore(extra, chipsWrap.children[1] || null);
    }

    function apply(pushUrl) {
      var q = state.q.trim().toLowerCase();
      var terms = q ? q.split(/\s+/) : [];
      var shown = 0;
      cards.forEach(function (c) {
        var tags = c.dataset.tags || '';
        var text = c.dataset.search || '';
        var ok = (!state.tag || tags.indexOf('|' + state.tag + '|') !== -1) &&
                 terms.every(function (t) { return text.indexOf(t) !== -1; });
        c.hidden = !ok;
        if (ok) {
          shown++;
          c.classList.remove('reveal-hidden');
          c.classList.add('reveal-visible');
        }
      });
      chipsWrap.querySelectorAll('.chip').forEach(function (b) {
        var on = (b.dataset.tag || '') === state.tag;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var filtered = state.tag || q;
      countEl.textContent = filtered ? shown + ' of ' + cards.length + ' posts' : '';
      empty.hidden = shown !== 0;
      if (pushUrl) {
        var p = new URLSearchParams();
        if (state.tag) p.set('tag', state.tag);
        if (state.q.trim()) p.set('q', state.q.trim());
        var qs = p.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      }
    }

    chipsWrap.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.tag = (b.dataset.tag === state.tag) ? '' : (b.dataset.tag || '');
      apply(true);
    });
    var t;
    search.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = search.value; apply(true); }, 120);
    });
    document.getElementById('clear-filters').addEventListener('click', function () {
      state.tag = ''; state.q = ''; search.value = ''; apply(true); search.focus();
    });
    apply(false);
  }
})();
