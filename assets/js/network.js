/**
 * Network Constellation — Animated interconnected strings
 * Represents precision, interconnected quality, and relentless pursuit of excellence
 */
(function() {
  var canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouse = { x: -1000, y: -1000 };
  var PARTICLE_COUNT = 60;
  var CONNECTION_DISTANCE = 160;
  var MOUSE_RADIUS = 200;
  var animFrame;

  // Theme-aware colors
  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }
  function getCyan(opacity) {
    return isLightTheme()
      ? 'rgba(8, 145, 178, ' + opacity + ')'   // darker cyan on light bg
      : 'rgba(6, 182, 212, ' + opacity + ')';  // bright cyan on dark bg
  }
  function getMouseCyan(opacity) {
    return isLightTheme()
      ? 'rgba(6, 182, 212, ' + opacity + ')'    // deeper cyan on light bg
      : 'rgba(34, 211, 238, ' + opacity + ')';  // bright cyan on dark bg
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = (canvas.parentElement && canvas.parentElement.clientHeight) || canvas.offsetHeight || window.innerHeight;
  }

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.radius = Math.random() * 2 + 0.8;
    this.opacity = Math.random() * 0.5 + 0.3;
  }

  function init() {
    resize();
    particles = [];
    var count = Math.min(PARTICLE_COUNT, Math.floor(canvas.width * canvas.height / 18000));
    for (var i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    // Boost opacity in light mode for better visibility
    var alpha = isLightTheme() ? Math.min(1, p.opacity + 0.25) : p.opacity;
    ctx.fillStyle = getCyan(alpha);
    ctx.fill();
  }

  function drawConnection(p1, p2, dist) {
    var alpha = (1 - dist / CONNECTION_DISTANCE) * (isLightTheme() ? 0.35 : 0.25);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = getCyan(alpha);
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function drawMouseConnections(p, dist) {
    var alpha = (1 - dist / MOUSE_RADIUS) * 0.4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = getMouseCyan(alpha);
    ctx.lineWidth = 0.8;
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

    // Draw connections between particles
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DISTANCE) {
          drawConnection(particles[i], particles[j], dist);
        }
      }
    }

    // Draw mouse connections
    for (var k = 0; k < particles.length; k++) {
      var dx2 = particles[k].x - mouse.x;
      var dy2 = particles[k].y - mouse.y;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (dist2 < MOUSE_RADIUS) {
        drawMouseConnections(particles[k], dist2);
        // Push particles away from mouse slightly
        var angle = Math.atan2(dy2, dx2);
        particles[k].x += Math.cos(angle) * 0.3;
        particles[k].y += Math.sin(angle) * 0.3;
      }
    }

    // Draw particles
    for (var m = 0; m < particles.length; m++) {
      drawParticle(particles[m]);
    }
  }

  function animate() {
    update();
    draw();
    animFrame = requestAnimationFrame(animate);
  }

  // Event listeners
  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', function() {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener('resize', function() {
    resize();
    // Re-clamp particles
    for (var i = 0; i < particles.length; i++) {
      particles[i].x = Math.min(particles[i].x, canvas.width);
      particles[i].y = Math.min(particles[i].y, canvas.height);
    }
  });

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    resize();
    return;
  }

  init();
  animate();
})();
