/* Thoughts stay off email. The writing box is hidden until the drawn code matches.
   Saving keeps the note on this browser. Publishing opens GitHub, which requires a sign-in. */
(function () {
  var root = document.querySelector("[data-thoughts]");
  if (!root || root.dataset.bound) return;
  root.dataset.bound = "1";

  var form = root.querySelector("[data-thoughts-form]");
  var gate = root.querySelector("[data-thoughts-gate]");
  var fields = root.querySelector("[data-thoughts-fields]");
  var canvas = root.querySelector("[data-thoughts-canvas]");
  var codeInput = root.querySelector("[data-thoughts-code]");
  var msg = root.querySelector("[data-thoughts-msg]");
  var list = root.querySelector("[data-thoughts-list]");
  var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var expected = "";
  var misses = 0;
  var open = false;
  var storageKey = "thoughts:" + location.pathname;

  function mint() {
    var bytes = new Uint8Array(5);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    var code = "";
    for (var n = 0; n < bytes.length; n++) code += alphabet[bytes[n] % alphabet.length];
    return code;
  }

  function draw(code) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, w, h);
    for (var line = 0; line < 7; line++) {
      ctx.strokeStyle = "rgba(34, 211, 238, " + (0.2 + Math.random() * 0.35) + ")";
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
    ctx.textBaseline = "middle";
    ctx.font = "700 34px ui-sans-serif, sans-serif";
    for (var c = 0; c < code.length; c++) {
      ctx.save();
      ctx.translate(28 + c * 40, 38 + (Math.random() * 8 - 4));
      ctx.rotate((Math.random() - 0.5) * 0.45);
      ctx.fillStyle = Math.random() > 0.4 ? "#a5f3fc" : "#e2e8f0";
      ctx.fillText(code[c], 0, 0);
      ctx.restore();
    }
    for (var dot = 0; dot < 36; dot++) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }

  function refresh() {
    expected = mint();
    draw(expected);
    if (codeInput) codeInput.value = "";
  }

  function say(text) {
    if (msg) msg.textContent = text;
  }

  function readThoughts() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch (err) { return []; }
  }

  function render() {
    if (!list) return;
    list.replaceChildren();
    readThoughts().forEach(function (item) {
      var li = document.createElement("li");
      var who = document.createElement("strong");
      who.textContent = item.name || "Reader";
      var body = document.createElement("p");
      body.textContent = item.message || "";
      var publish = document.createElement("a");
      var title = root.getAttribute("data-title") || "a post";
      var page = root.getAttribute("data-page") || location.href;
      publish.href = "https://github.com/veeresh-bikkaneti/techtalkwith-veeresh/issues/new?title="
        + encodeURIComponent("Thought: " + title)
        + "&body=" + encodeURIComponent((item.message || "") + "\n\nFrom: " + (item.name || "Reader") + "\n" + page);
      publish.target = "_blank";
      publish.rel = "noopener noreferrer";
      publish.textContent = "Post this on GitHub";
      li.appendChild(who);
      li.appendChild(body);
      li.appendChild(publish);
      list.appendChild(li);
    });
  }

  function unlock() {
    var honey = form.querySelector("[name='_honey']");
    if (honey && honey.value) {
      gate.hidden = true;
      fields.hidden = true;
      return;
    }
    var typed = (codeInput.value || "").replace(/\s+/g, "").toUpperCase();
    if (typed !== expected) {
      misses += 1;
      refresh();
      say(misses >= 8 ? "Too many misses. Reload the page and try again." : "That does not match. A new code is on the canvas.");
      if (misses >= 8 && codeInput) codeInput.disabled = true;
      return;
    }
    open = true;
    gate.hidden = true;
    fields.hidden = false;
    var name = fields.querySelector("[name='name']");
    if (name) name.focus();
  }

  refresh();
  render();
  root.querySelector("[data-thoughts-refresh]").addEventListener("click", function () {
    if (misses >= 8) return;
    refresh();
    say("");
  });
  root.querySelector("[data-thoughts-unlock]").addEventListener("click", unlock);
  codeInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      unlock();
    }
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!open) {
      unlock();
      return;
    }
    var name = (fields.querySelector("[name='name']").value || "").trim();
    var message = (fields.querySelector("[name='message']").value || "").trim();
    if (!name || !message) return;
    var items = readThoughts();
    items.push({ name: name, message: message });
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (err) {}
    fields.querySelector("[name='message']").value = "";
    render();
    say("Saved on this browser. It was not emailed.");
  });
})();
