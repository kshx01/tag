/* Homepage behaviour: "What we do" tabs, case study carousel, contact form placeholder. */
(function () {
  'use strict';

  // Tabs (WAI-ARIA tabs pattern: click or arrow keys to switch).
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });

  // Case study carousel.
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-carousel-track]');
    var cards = track.children;
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var counter = root.querySelector('[data-carousel-counter]');
    var index = 0;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function update() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      var step = cards[0].getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-step * index) + 'px)';
      prev.disabled = index === 0;
      next.disabled = index >= cards.length - 1;
      counter.textContent = pad(index + 1) + ' / ' + pad(cards.length);
    }
    prev.addEventListener('click', function () { index = Math.max(0, index - 1); update(); });
    next.addEventListener('click', function () { index = Math.min(cards.length - 1, index + 1); update(); });
    window.addEventListener('resize', update);
    update();
  });

  // Contact form: not connected to a backend yet (see README).
  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (form.getAttribute('action')) return; // a real endpoint has been configured
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');
      status.hidden = false;
      status.textContent = 'Thank you. This form is not connected yet — please email us in the meantime.';
    });
  });
})();
