/**
 * Network constellation. One animated map per .network-canvas.
 * The homepage uses the full field. Articles use a quieter one in the header.
 */
(function () {
  var nodes = document.querySelectorAll(".network-canvas");
  if (!nodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  nodes.forEach(mount);

  function mount(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var particles = [];
    var mouse = { x: -1000, y: -1000 };
    var budget = Number(canvas.getAttribute("data-particles")) || 60;
    var connectionDistance = budget < 40 ? 110 : 160;
    var mouseRadius = 200;
    var animFrame;
    var running = false;
    var quiet = canvas.classList.contains("article-map");

    function isLightTheme() {
      return document.documentElement.getAttribute("data-theme") === "light";
    }
    function getCyan(opacity) {
      return isLightTheme()
        ? "rgba(8, 145, 178, " + opacity + ")"
        : "rgba(6, 182, 212, " + opacity + ")";
    }
    function getMouseCyan(opacity) {
      return isLightTheme()
        ? "rgba(6, 182, 212, " + opacity + ")"
        : "rgba(34, 211, 238, " + opacity + ")";
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height || (canvas.parentElement && canvas.parentElement.clientHeight) || 160));
    }

    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * (quiet ? 0.35 : 0.6);
      this.vy = (Math.random() - 0.5) * (quiet ? 0.35 : 0.6);
      this.radius = Math.random() * 2 + 0.8;
      this.opacity = Math.random() * 0.5 + 0.3;
    }

    function init() {
      resize();
      particles = [];
      var areaCount = Math.floor(canvas.width * canvas.height / 18000);
      var count = Math.max(10, Math.min(budget, areaCount || budget));
      for (var i = 0; i < count; i++) particles.push(new Particle());
    }

    function drawParticle(p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      var alpha = isLightTheme() ? Math.min(1, p.opacity + 0.25) : p.opacity;
      ctx.fillStyle = getCyan(alpha);
      ctx.fill();
    }

    function drawConnection(p1, p2, dist) {
      var alpha = (1 - dist / connectionDistance) * (isLightTheme() ? 0.35 : 0.25);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = getCyan(alpha);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    function update() {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) drawConnection(particles[i], particles[j], dist);
        }
      }
      if (!quiet) {
        for (var k = 0; k < particles.length; k++) {
          var dx2 = particles[k].x - mouse.x;
          var dy2 = particles[k].y - mouse.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < mouseRadius) {
            ctx.beginPath();
            ctx.moveTo(particles[k].x, particles[k].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = getMouseCyan((1 - dist2 / mouseRadius) * 0.4);
            ctx.lineWidth = 0.8;
            ctx.stroke();
            var angle = Math.atan2(dy2, dx2);
            particles[k].x += Math.cos(angle) * 0.3;
            particles[k].y += Math.sin(angle) * 0.3;
          }
        }
      }
      for (var m = 0; m < particles.length; m++) drawParticle(particles[m]);
    }

    function animate() {
      if (!running) return;
      update();
      draw();
      animFrame = requestAnimationFrame(animate);
    }

    function stop() {
      running = false;
      if (animFrame) cancelAnimationFrame(animFrame);
    }

    function start() {
      if (running) return;
      running = true;
      animate();
    }

    if (!quiet) {
      canvas.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      canvas.addEventListener("mouseleave", function () {
        mouse.x = -1000;
        mouse.y = -1000;
      });
    }

    window.addEventListener("resize", function () {
      resize();
      for (var i = 0; i < particles.length; i++) {
        particles[i].x = Math.min(particles[i].x, canvas.width);
        particles[i].y = Math.min(particles[i].y, canvas.height);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    window.addEventListener("beforeunload", stop);

    init();
    start();
  }
})();
