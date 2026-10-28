/* Case studies page: "Read more" expanders and the sticky index that follows your scroll. */
(function () {
  'use strict';

  document.querySelectorAll('[data-read-more]').forEach(function (button) {
    var panel = document.getElementById(button.getAttribute('aria-controls'));
    var label = button.querySelector('[data-read-more-label]');
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      label.textContent = open ? 'Read less' : 'Read more';
    });
  });

  var links = Array.prototype.slice.call(document.querySelectorAll('[data-case-link]'));
  var entries = links.map(function (link) { return document.querySelector(link.getAttribute('href')); });
  if (!links.length) return;

  function setActive(i) {
    links.forEach(function (link, j) {
      link.classList.toggle('is-active', i === j);
      if (i === j) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var active = 0;
      entries.forEach(function (el, i) { if (el && el.getBoundingClientRect().top < 160) active = i; });
      setActive(active);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
