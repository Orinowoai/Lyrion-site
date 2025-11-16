// Global scroll-triggered fade-in animations
(function() {
  'use strict';

  // Intersection Observer for fade-in effects
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Optionally unobserve after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements on page load
  function observeElements() {
    const elementsToObserve = document.querySelectorAll('.panel, .tile, .card, .product-card, .post-card');
    elementsToObserve.forEach(el => {
      observer.observe(el);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
  } else {
    observeElements();
  }

  // Re-observe when new content is added (e.g., pagination)
  window.observeNewElements = observeElements;
})();
