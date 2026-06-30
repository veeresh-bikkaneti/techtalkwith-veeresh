/**
 * Scroll Reveal — Base44-style fade-in animations
 * Elements with data-reveal attribute animate in on scroll
 */
(function() {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  // Add reveal-hidden class to all elements (CSS handles initial state)
  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.add('reveal-hidden');
  }

  function reveal() {
    var windowHeight = window.innerHeight;
    var allRevealed = true;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.classList.contains('reveal-hidden')) {
        var rect = el.getBoundingClientRect();
        if (rect.top < windowHeight - 60) {
          el.classList.remove('reveal-hidden');
          el.classList.add('reveal-visible');
        } else {
          allRevealed = false;
        }
      }
    }
    // Disconnect scroll listener when all elements are revealed
    if (allRevealed) {
      window.removeEventListener('scroll', reveal);
    }
  }

  // Run on load and scroll
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });
})();
