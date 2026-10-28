/* Article pages: "Copy link" share button. */
(function () {
  'use strict';

  document.querySelectorAll('[data-copy-link]').forEach(function (button) {
    var status = document.querySelector('[data-copy-status]');
    var timer;
    button.addEventListener('click', function () {
      var url = window.location.href;
      var done = function () {
        status.textContent = 'Link copied';
        clearTimeout(timer);
        timer = setTimeout(function () { status.textContent = ''; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
  });
})();
