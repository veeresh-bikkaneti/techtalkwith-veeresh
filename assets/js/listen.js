/* Listen Mode. Plays the Kokoro recording for this article.
   The browser speech engine is never used. The current word stays in view. */
(function () {
  var root = document.querySelector("[data-listen]");
  if (!root || root.dataset.bound) return;
  root.dataset.bound = "1";

  var slug = root.getAttribute("data-slug") || "";
  var base = root.getAttribute("data-base") || "";
  var article = root.closest("article") || document;
  var playBtn = root.querySelector("[data-listen-play]");
  var label = root.querySelector("[data-listen-label]");
  var playIcon = root.querySelector("[data-listen-icon]");
  var note = root.querySelector("[data-listen-note]");
  var live = root.querySelector("[data-listen-live]");
  var seek = root.querySelector("[data-listen-seek]");
  var time = root.querySelector("[data-listen-time]");
  var floatBtn = root.querySelector("[data-listen-float]");
  var floatLabel = root.querySelector("[data-listen-float-label]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var announced = false;

  var state = {
    status: "stopped",
    mode: "neural",
    accentPref: "auto",
    accent: "us",
    rate: 1,
    manifest: null,
    audioUrl: "",
    audio: null,
    marks: [],
    blocks: [],
    raf: 0,
    followEl: null,
    probing: null
  };

  function canPlay() {
    return typeof Audio === "function";
  }

  if (!canPlay() && floatBtn) floatBtn.hidden = true;

  function expandToken(token) {
    var t = String(token || "");
    t = t.replace(/\u2192/g, " to ").replace(/\u21d2/g, " implies ");
    t = t.replace(/[\u2014\u2013]/g, " ").replace(/\u2026/g, " ");
    t = t.replace(/&/g, " and ").replace(/&nbsp;/g, " ");
    t = t.replace(/\s&\s/g, " and ").replace(/&/g, " and ");
    t = t.replace(/(^|[^A-Za-z0-9])~(\d)/g, "$1about $2");
    t = t.replace(/(^|[^A-Za-z0-9])~(?![A-Za-z0-9])/g, "$1 about ");
    t = t.replace(/%/g, " percent ");
    t = t.replace(/https?:\/\/\S+/g, " ");
    t = t.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    return t ? t.split(/\s+/) : [];
  }

  function normalizeBlock(text) {
    return expandToken(text).join(" ");
  }

  function visibleText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll("pre, table, figure, script, style, ul, ol, .drawer-fig, .mermaid, .mermaid-container").forEach(function (node) {
      node.remove();
    });
    clone.querySelectorAll("code").forEach(function (node) {
      if (node.parentElement && node.parentElement.tagName === "PRE") node.remove();
    });
    return (clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function collectDomBlocks() {
    var skip = "pre, table, figure, script, style, .drawer-fig, .mermaid, .mermaid-container, .listen, .post-nav, .post-tags, .post-toc, aside";
    var nodes = article.querySelectorAll("h1.post-title, .post-content h2, .post-content h3, .post-content h4, .post-content p, .post-content li, .post-content blockquote");
    var blocks = [];
    nodes.forEach(function (el) {
      if (el.closest(skip)) return;
      if ((el.matches("li") || el.matches("blockquote")) && el.querySelector("p")) return;
      var text = visibleText(el);
      if (!normalizeBlock(text)) return;
      blocks.push({ el: el, text: text });
    });
    return blocks;
  }

  function clearMarks() {
    state.marks.forEach(function (mark) {
      mark.el.classList.remove("is-current");
    });
    state.blocks.forEach(function (block) {
      block.el.classList.remove("is-current");
    });
    var current = null;
    state.marks = [];
    state.blocks = [];
    article.querySelectorAll(".listen-w").forEach(function (span) {
      var parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    });
    return current;
  }

  function wrapWords(el) {
    var skip = "pre, table, figure, script, style, .drawer-fig, .listen";
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest(skip)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement("span");
        span.className = "listen-w";
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return Array.prototype.slice.call(el.querySelectorAll(".listen-w"));
  }

  function align(manifest) {
    clearMarks();
    var dom = collectDomBlocks();
    var used = {};
    (manifest.blocks || []).forEach(function (block) {
      var want = normalizeBlock(block.text);
      var match = null;
      for (var i = 0; i < dom.length; i++) {
        if (used[i]) continue;
        if (normalizeBlock(dom[i].text) === want) {
          match = dom[i];
          used[i] = true;
          break;
        }
      }
      if (!match) return;
      var spoken = [];
      (block.words || []).forEach(function (word) {
        var keys = expandToken(word.text);
        if (!keys.length) {
          if (spoken.length) spoken[spoken.length - 1].end = word.end;
          return;
        }
        keys.forEach(function (key, index) {
          spoken.push({
            key: key,
            start: index === 0 ? word.start : word.start,
            end: word.end
          });
        });
      });
      var spans = wrapWords(match.el);
      var cursor = 0;
      var ok = true;
      var tagged = [];
      spans.forEach(function (span) {
        var keys = expandToken(span.textContent);
        if (!keys.length || !ok) return;
        if (cursor + keys.length > spoken.length) {
          ok = false;
          return;
        }
        for (var k = 0; k < keys.length; k++) {
          if (spoken[cursor + k].key !== keys[k]) ok = false;
        }
        if (!ok) return;
        tagged.push({
          el: span,
          start: spoken[cursor].start,
          end: spoken[cursor + keys.length - 1].end,
          blockEl: match.el
        });
        cursor += keys.length;
      });
      if (!ok || cursor !== spoken.length) {
        tagged.forEach(function (mark) {
          var parent = mark.el.parentNode;
          if (!parent) return;
          parent.replaceChild(document.createTextNode(mark.el.textContent), mark.el);
          parent.normalize();
        });
        state.blocks.push({ el: match.el, start: block.start, end: block.end });
        return;
      }
      state.marks = state.marks.concat(tagged);
    });
  }

  function paint(seconds) {
    var current = null;
    for (var i = 0; i < state.marks.length; i++) {
      var mark = state.marks[i];
      var on = seconds >= mark.start && seconds < mark.end + 0.02;
      mark.el.classList.toggle("is-current", on);
      if (on) current = mark.el;
    }
    state.blocks.forEach(function (block) {
      var on = seconds >= block.start && seconds < block.end + 0.02;
      block.el.classList.toggle("is-current", on);
      if (on && !current) current = block.el;
    });
    if (current && current !== state.followEl) {
      state.followEl = current;
      if (!reduce) {
        var box = current.getBoundingClientRect();
        var topLimit = 110;
        var bottomLimit = window.innerHeight * 0.68;
        if (box.top < topLimit || box.bottom > bottomLimit) {
          var y = window.scrollY + box.top - window.innerHeight * 0.32;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }
    } else if (!current) {
      state.followEl = null;
    }
    if (state.manifest && seek && document.activeElement !== seek) {
      var dur = state.manifest.duration || 0;
      seek.value = dur ? String(Math.round((seconds / dur) * 1000)) : "0";
    }
    if (time) time.textContent = format(seconds);
  }

  function format(seconds) {
    seconds = Math.max(0, seconds || 0);
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function setStatus(status) {
    state.status = status;
    root.dataset.state = status;
    root.dataset.mode = state.mode;
    var playing = status === "playing";
    if (playBtn) playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (label) label.textContent = playing ? "Pause" : (status === "paused" ? "Resume" : "Listen");
    if (playIcon) playIcon.className = "fas " + (playing ? "fa-pause" : "fa-headphones") + " listen-icon";
    if (floatBtn) {
      floatBtn.hidden = status === "stopped" || !canPlay();
      floatBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      var icon = floatBtn.querySelector("i");
      if (icon) icon.className = "fas " + (playing ? "fa-pause" : "fa-play");
    }
    if (floatLabel) floatLabel.textContent = playing ? "Pause" : "Resume";
    if (announced && live) {
      live.textContent = playing ? "Playing" : (status === "paused" ? "Paused" : "Stopped");
    }
    if (status !== "stopped") announced = true;
  }

  function stopRaf() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function tick() {
    if (!state.audio || state.status !== "playing") return;
    paint(state.audio.currentTime || 0);
    state.raf = requestAnimationFrame(tick);
  }

  function voiceNote(found) {
    if (!found) return "The neural recording for this article is not on the site yet.";
    if (state.accentPref === "uk" && found.accent !== "uk") {
      return "The UK recording is not ready. Playing the US voice.";
    }
    if (state.accentPref === "us" && found.accent !== "us") {
      return "The US recording is not ready. Playing the UK voice.";
    }
    return found.accent === "uk" ? "Neural narration, UK voice." : "Neural narration, US voice.";
  }

  function manifestUrl(accent) {
    return base.replace(/\/$/, "") + "/audio/" + slug + "/" + accent + "/narration.json";
  }

  function probe() {
    var pref = state.accentPref;
    var order = pref === "uk" ? ["uk", "us"] : ["us", "uk"];
    state.probing = (async function () {
      for (var i = 0; i < order.length; i++) {
        try {
          var res = await fetch(manifestUrl(order[i]), { cache: "no-cache" });
          if (!res.ok) continue;
          var json = await res.json();
          if (!json || !json.blocks) continue;
          var audioUrl = new URL(json.audio || "narration.opus", res.url).href;
          return { manifest: json, accent: order[i], audioUrl: audioUrl };
        } catch (err) {
          /* try the other recorded accent */
        }
      }
      return null;
    })();
    return state.probing;
  }

  function stopAll() {
    stopRaf();
    if (state.audio) state.audio.pause();
    paint(-1);
    setStatus("stopped");
  }

  function ensureAudio(url) {
    if (!state.audio) {
      state.audio = new Audio();
      state.audio.preload = "auto";
      state.audio.setAttribute("data-listen-audio", "");
      root.appendChild(state.audio);
      state.audio.addEventListener("ended", function () {
        stopRaf();
        paint(-1);
        if (seek) seek.value = "0";
        setStatus("stopped");
        announced = true;
        if (live) live.textContent = "Stopped";
      });
    }
    if (state.audioUrl !== url) {
      state.audio.pause();
      state.audio.src = url;
      state.audioUrl = url;
      state.audio.currentTime = 0;
    }
    state.audio.playbackRate = state.rate;
  }

  async function playNeural() {
    var found = await probe();
    if (note) note.textContent = voiceNote(found);
    if (!found) {
      state.mode = "neural";
      setStatus("stopped");
      return;
    }
    state.mode = "neural";
    state.accent = found.accent;
    state.manifest = found.manifest;
    align(found.manifest);
    ensureAudio(found.audioUrl);
    if (seek) seek.disabled = false;
    setStatus("playing");
    try {
      await state.audio.play();
    } catch (err) {
      setStatus("stopped");
      if (note) note.textContent = "Playback was blocked. Press Listen again.";
      return;
    }
    stopRaf();
    state.raf = requestAnimationFrame(tick);
  }

  function toggle() {
    if (!state.audio && state.status !== "stopped") return;
    if (state.status === "playing" && state.audio) {
      state.audio.pause();
      stopRaf();
      setStatus("paused");
      return;
    }
    if (state.status === "paused" && state.audio) {
      state.audio.playbackRate = state.rate;
      state.audio.play();
      setStatus("playing");
      state.raf = requestAnimationFrame(tick);
      return;
    }
    playNeural();
  }

  function setAccent(pref) {
    var was = state.status === "playing";
    stopAll();
    state.accentPref = pref;
    try { localStorage.setItem("listen-accent", pref); } catch (err) {}
    root.querySelectorAll("[data-accent]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-accent") === pref ? "true" : "false");
    });
    state.manifest = null;
    state.audioUrl = "";
    if (was) playNeural();
  }

  function setRate(rate) {
    state.rate = rate;
    try { localStorage.setItem("listen-rate", String(rate)); } catch (err) {}
    root.querySelectorAll("[data-rate]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", Number(btn.getAttribute("data-rate")) === rate ? "true" : "false");
    });
    if (state.audio) state.audio.playbackRate = rate;
  }

  playBtn.addEventListener("click", toggle);
  if (floatBtn) floatBtn.addEventListener("click", toggle);
  root.querySelectorAll("[data-accent]").forEach(function (btn) {
    btn.addEventListener("click", function () { setAccent(btn.getAttribute("data-accent")); });
  });
  root.querySelectorAll("[data-rate]").forEach(function (btn) {
    btn.addEventListener("click", function () { setRate(Number(btn.getAttribute("data-rate"))); });
  });
  if (seek) {
    seek.addEventListener("input", function () {
      var fraction = Number(seek.value) / 1000;
      if (state.mode === "neural" && state.audio && state.manifest) {
        var next = fraction * (state.manifest.duration || 0);
        state.followEl = null;
        state.audio.currentTime = next;
        paint(next);
      }
    });
  }

  window.addEventListener("pagehide", stopAll);

  try {
    var savedAccent = localStorage.getItem("listen-accent");
    if (savedAccent === "auto" || savedAccent === "us" || savedAccent === "uk") state.accentPref = savedAccent;
    var savedRate = Number(localStorage.getItem("listen-rate"));
    if ([0.9, 1, 1.25, 1.5].indexOf(savedRate) !== -1) state.rate = savedRate;
  } catch (err) {}
  root.querySelectorAll("[data-accent]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", btn.getAttribute("data-accent") === state.accentPref ? "true" : "false");
  });
  root.querySelectorAll("[data-rate]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", Number(btn.getAttribute("data-rate")) === state.rate ? "true" : "false");
  });
  setStatus("stopped");
  probe().then(function (found) {
    if (note) note.textContent = voiceNote(found);
    if (playBtn) playBtn.disabled = false;
  });
})();
