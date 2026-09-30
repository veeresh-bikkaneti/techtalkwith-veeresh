(function () {
  var roots = document.querySelectorAll("[data-drawers]");
  if (!roots.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  roots.forEach(function (root) {
    var goButtons = Array.prototype.slice.call(root.querySelectorAll("[data-go]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-panel]"));
    var count = 0;
    panels.forEach(function (panel) {
      count = Math.max(count, Number(panel.getAttribute("data-panel")) + 1);
    });
    if (!count) count = goButtons.length;
    if (!count) return;

    var index = 0;
    var timer = null;
    var paused = true;
    var interval = Number(root.getAttribute("data-interval") || 2600);
    var playBtn = root.querySelector("[data-play]");
    var note = root.querySelector("[data-note-slot]");

    function markedOn(el) {
      var marked = el.getAttribute("data-on");
      if (!marked) return null;
      return marked.split(/\s+/).indexOf(String(index)) !== -1;
    }

    function apply(next) {
      index = (next + count) % count;

      panels.forEach(function (panel) {
        var on = Number(panel.getAttribute("data-panel")) === index;
        panel.hidden = !on;
        panel.classList.toggle("is-on", on);
      });

      root.querySelectorAll("[data-on]").forEach(function (el) {
        if (el.hasAttribute("data-go")) return;
        el.classList.toggle("is-on", markedOn(el));
      });

      goButtons.forEach(function (btn) {
        var on = btn.hasAttribute("data-on")
          ? markedOn(btn)
          : Number(btn.getAttribute("data-go")) === index;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", Number(btn.getAttribute("data-go")) === index ? "true" : "false");
      });

      if (note) {
        var source = root.querySelector('[data-go="' + index + '"]');
        var text = source && source.getAttribute("data-note");
        if (!text) {
          var panel = root.querySelector('[data-panel="' + index + '"]');
          text = panel && panel.getAttribute("data-note");
        }
        if (text) note.textContent = text;
      }
    }

    function stop() {
      paused = true;
      if (timer) window.clearInterval(timer);
      timer = null;
      if (playBtn) {
        playBtn.textContent = "Play";
        playBtn.setAttribute("aria-pressed", "false");
      }
    }

    function start() {
      if (reduced || count < 2) return;
      paused = false;
      if (playBtn) {
        playBtn.textContent = "Pause";
        playBtn.setAttribute("aria-pressed", "true");
      }
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () {
        apply(index + 1);
      }, interval);
    }

    goButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        stop();
        apply(Number(btn.getAttribute("data-go")));
      });
    });

    var nextBtn = root.querySelector("[data-next]");
    var prevBtn = root.querySelector("[data-prev]");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        stop();
        apply(index + 1);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        stop();
        apply(index - 1);
      });
    }
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        if (paused) start();
        else stop();
      });
    }

    apply(0);
    if (root.getAttribute("data-drawers") === "cycle" && !reduced) start();
  });
})();
