/**
 * Veer — site-wide chat widget.
 *
 * Two layers, always in this order:
 *   1. Deterministic full-text search over every post + the About page
 *      (assets/data/veer-index.json, generated at build time). Works in
 *      every browser, instantly, with no network call beyond that one
 *      static file.
 *   2. Where Chrome's built-in on-device AI is available
 *      ('LanguageModel' in self), the top-scoring excerpts are handed to
 *      it to synthesize a short written answer with inline citations.
 *      Anywhere else, step 2 is skipped and the matched posts are shown
 *      directly — same posture as the reverted web-search-grounding
 *      experiment documented on this blog: feature-detected, opt-in by
 *      capability, fails silent, never blocks the deterministic path.
 *
 * No backend, no API key, no data leaves the visitor's machine.
 */
(function () {
  'use strict';

  var launcher = document.getElementById('veer-launcher');
  var panel = document.getElementById('veer-panel');
  var closeBtn = document.getElementById('veer-close');
  var messagesEl = document.getElementById('veer-messages');
  var suggestionsEl = document.getElementById('veer-suggestions');
  var form = document.getElementById('veer-form');
  var input = document.getElementById('veer-input');
  var sendBtn = document.getElementById('veer-send');
  if (!launcher || !panel || !form || !input) return;

  var STOPWORDS = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'in', 'on', 'for',
    'and', 'or', 'it', 'this', 'that', 'with', 'as', 'at', 'by', 'from', 'how', 'what', 'why', 'when', 'who',
    'do', 'does', 'did', 'i', 'you', 'your', 'my', 'can', 'could', 'should', 'would', 'use', 'using', 'about', 'me'];

  var indexUrl = launcher.getAttribute('data-index-url');
  var siteRoot = indexUrl.replace(/\/assets\/data\/veer-index\.json$/, '');
  var indexPromise = null;
  var opened = false;
  var greeted = false;

  /* ---------------- Index loading + chunking ---------------- */

  function loadChunks() {
    if (!indexPromise) {
      indexPromise = fetch(indexUrl)
        .then(function (res) {
          if (!res.ok) throw new Error('veer index fetch failed: ' + res.status);
          return res.json();
        })
        .then(function (entries) { return buildChunks(entries); })
        .catch(function () { return []; });
    }
    return indexPromise;
  }

  // Paragraph/sentence-sized chunks so search & citations work at "this bit
  // of this post" granularity rather than matching whole (long) posts.
  function buildChunks(entries) {
    var out = [];
    entries.forEach(function (entry) {
      // A title/tags/excerpt chunk, weighted higher: catches subject-level
      // matches even when the query's wording differs from the body text.
      out.push({
        entry: entry,
        text: [entry.title, (entry.tags || []).join(' '), entry.excerpt].filter(Boolean).join('. '),
        weight: 2.5
      });
      var sentences = (entry.content || '').match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [];
      var buf = '';
      for (var i = 0; i < sentences.length; i++) {
        if (buf.length > 0 && (buf.length + sentences[i].length) > 480) {
          out.push({ entry: entry, text: buf.trim(), weight: 1 });
          buf = '';
        }
        buf += sentences[i];
      }
      if (buf.trim()) out.push({ entry: entry, text: buf.trim(), weight: 1 });
    });
    return out;
  }

  function tokenize(str) {
    var raw = (str.toLowerCase().match(/[a-z0-9][a-z0-9+#.\-]*/g) || []);
    return raw.filter(function (t) { return t.length > 1 && STOPWORDS.indexOf(t) === -1; });
  }

  function scoreChunks(chunks, query) {
    var terms = tokenize(query);
    if (!terms.length) return [];
    var scored = [];
    chunks.forEach(function (c) {
      var lower = c.text.toLowerCase();
      var score = 0;
      terms.forEach(function (t) {
        var count = lower.split(t).length - 1;
        if (count) score += count * c.weight;
      });
      if (score > 0) scored.push({ chunk: c, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  // Cap at 2 chunks per source post so a multi-post-relevant question
  // actually pulls from more than one article.
  function pickTop(scored, max) {
    var perEntry = {};
    var picked = [];
    for (var i = 0; i < scored.length && picked.length < max; i++) {
      var c = scored[i].chunk;
      var key = c.entry.url;
      perEntry[key] = (perEntry[key] || 0) + 1;
      if (perEntry[key] > 2) continue;
      picked.push(c);
    }
    return picked;
  }

  function distinctEntries(pickedChunks) {
    var seen = {};
    var out = [];
    pickedChunks.forEach(function (c) {
      if (!seen[c.entry.url]) { seen[c.entry.url] = true; out.push(c.entry); }
    });
    return out;
  }

  /* ---------------- On-device AI synthesis ---------------- */

  var aiChecked = false;
  var aiAvailable = false;

  function checkAi() {
    if (aiChecked) return Promise.resolve(aiAvailable);
    aiChecked = true;
    if (!('LanguageModel' in self)) { aiAvailable = false; return Promise.resolve(false); }
    return LanguageModel.availability()
      .then(function (a) { aiAvailable = a !== 'unavailable'; return aiAvailable; })
      .catch(function () { aiAvailable = false; return false; });
  }

  function synthesize(query, pickedChunks) {
    var context = pickedChunks.map(function (c, i) {
      return '[' + (i + 1) + '] ' + c.entry.title + ': ' + c.text;
    }).join('\n\n');

    var prompt =
      'You are "Veer", the chat assistant on a QA-engineering and test-automation blog. ' +
      'Answer the visitor\'s question using ONLY the excerpts below, citing them inline like [1]. ' +
      'If the excerpts do not actually answer the question, say so plainly instead of guessing. ' +
      'Answer in 2-4 sentences, plainly, no preamble.\n\n' +
      'Excerpts:\n' + context + '\n\nQuestion: ' + query;

    var session;
    return LanguageModel.create()
      .then(function (s) {
        session = s;
        return session.prompt(prompt);
      })
      .then(function (reply) {
        if (session && session.destroy) session.destroy();
        return (reply || '').trim() || null;
      })
      .catch(function () {
        if (session && session.destroy) session.destroy();
        return null; // model not downloaded, unsupported, or a runtime error — fail silent to the search results
      });
  }

  /* ---------------- Answering ---------------- */

  var IDENTITY_RE = /^(hi|hello|hey|yo)\b|who (are|is) (you|veer)|what (are|can) you( do)?/i;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderText(text) {
    return text.split(/\n+/).filter(Boolean).map(function (line) {
      return '<p>' + escapeHtml(line) + '</p>';
    }).join('');
  }

  function ask(query) {
    if (IDENTITY_RE.test(query.trim())) {
      addBotMessage(
        "I'm Veer — I search this blog's posts (and Veeresh's background) to answer questions about " +
        "QA engineering, test automation, and the topics covered here. Ask me about Playwright, Selenium, " +
        "flaky tests, CI/CD, or anything else on the blog."
      );
      return;
    }

    addTyping();
    loadChunks().then(function (chunks) {
      var scored = scoreChunks(chunks, query);
      if (!scored.length) {
        removeTyping();
        appendMessage(
          '<p>I couldn’t find anything on the blog matching that. Try different wording, or browse by ' +
          'tag on the <a href="' + siteRoot + '/blog/">blog index</a>.</p>',
          'bot'
        );
        return;
      }
      var picked = pickTop(scored, 5);
      var entries = distinctEntries(picked);

      return checkAi().then(function (ok) {
        if (!ok) {
          removeTyping();
          addSearchResults(entries);
          return;
        }
        return synthesize(query, picked).then(function (answer) {
          removeTyping();
          if (!answer) { addSearchResults(entries); return; }
          addBotMessage(answer, entries, true);
        });
      });
    }).catch(function () {
      removeTyping();
      addBotMessage("Something went wrong searching the blog. Please try again.", null, false, true);
    });
  }

  function addSearchResults(entries) {
    var html = '<p>Here’s what I found on the blog:</p><div class="veer-sources">' +
      entries.slice(0, 4).map(function (e) {
        return '<a class="veer-source-link" href="' + e.url + '">' + escapeHtml(e.title) + '</a>';
      }).join('') + '</div>';
    appendMessage(html, 'bot');
  }

  function addBotMessage(text, entries, aiUsed, isError) {
    var html = renderText(text);
    if (entries && entries.length) {
      html += '<div class="veer-sources"><div class="veer-sources-label">Sources</div>' +
        entries.map(function (e) {
          return '<a class="veer-source-link" href="' + e.url + '">' + escapeHtml(e.title) + '</a>';
        }).join('') + '</div>';
    }
    if (aiUsed) {
      html += '<div class="veer-badge"><i class="fas fa-microchip" aria-hidden="true"></i> Synthesized on-device from the linked posts</div>';
    }
    appendMessage(html, isError ? 'bot error' : 'bot');
  }

  function appendMessage(html, kind) {
    var div = document.createElement('div');
    div.className = 'veer-msg veer-msg--' + kind.split(' ')[0] + (kind.indexOf('error') !== -1 ? ' veer-msg--error' : '');
    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMessage(text) {
    var div = document.createElement('div');
    div.className = 'veer-msg veer-msg--user';
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  var typingEl = null;
  function addTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'veer-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function removeTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  /* ---------------- Panel open/close + form wiring ---------------- */

  function openPanel() {
    opened = true;
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('is-open'); });
    launcher.classList.add('is-open');
    launcher.classList.remove('has-pulse');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Close Veer chat');
    if (!greeted) {
      greeted = true;
      addBotMessage("Hey, I'm Veer — ask me anything about this blog's posts on QA, test automation, or Veeresh's background.");
    }
    input.focus();
    loadChunks(); // warm the index in the background as soon as it's opened
  }

  function closePanel() {
    opened = false;
    panel.classList.remove('is-open');
    launcher.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Open Veer chat');
    setTimeout(function () { if (!opened) panel.hidden = true; }, 220);
  }

  launcher.addEventListener('click', function () { opened ? closePanel() : openPanel(); });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && opened) closePanel();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    addUserMessage(q);
    input.value = '';
    sendBtn.disabled = true;
    ask(q);
    setTimeout(function () { sendBtn.disabled = false; }, 300);
  });

  if (suggestionsEl) {
    suggestionsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.veer-suggestion');
      if (!btn) return;
      if (!opened) openPanel();
      var q = btn.getAttribute('data-q');
      addUserMessage(q);
      ask(q);
      suggestionsEl.hidden = true;
    });
  }

  // A one-time gentle pulse so first-time visitors notice the launcher,
  // without being an intrusive auto-open (which the KB about "expert
  // confusion" this blog covers would rightly call a bad pattern).
  setTimeout(function () {
    try {
      if (!sessionStorage.getItem('veer-seen')) {
        launcher.classList.add('has-pulse');
        sessionStorage.setItem('veer-seen', '1');
      }
    } catch (e) {}
  }, 1500);
})();
