/* TrackCollectibles — landing page behavior
   1. Scroll-reveal animations (IntersectionObserver)
   2. Animated hero counters
   3. Waitlist form → Formspree (AJAX)
*/
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Scroll reveal ── */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var batchIndex = 0;
    var lastTime = 0;
    var io = new IntersectionObserver(function (entries) {
      var now = performance.now();
      if (now - lastTime > 200) batchIndex = 0; // new batch → reset stagger
      lastTime = now;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(batchIndex++ * 70, 420) + "ms";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ── 2. Hero counters ── */
  var counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target || reduceMotion) { el.textContent = target; return; }
    var dur = 900, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── 3. Waitlist form ── */
  var form = document.getElementById("waitlist-form");
  if (!form) return;
  var statusEl = form.querySelector(".form-success");
  var button = form.querySelector("button[type=submit]");
  var FALLBACK = "Something went wrong — please try again, or email awardwinninggear@gmail.com and we'll add you by hand.";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.style.color = "";

    // Not wired up yet? Be honest instead of pretending.
    if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
      statusEl.textContent = "The waitlist opens very soon — meanwhile, email awardwinninggear@gmail.com and we'll add you by hand.";
      return;
    }

    var data = new FormData(form);
    button.disabled = true;
    button.textContent = "Joining…";

    fetch(form.action, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    }).then(function (res) {
      if (res.ok) {
        form.querySelector(".form-row").style.display = "none";
        form.querySelector(".form-note").style.display = "none";
        statusEl.textContent = "You're on the list! We'll email you the moment we launch. 🎉";
      } else {
        statusEl.style.color = "#E07A5F";
        statusEl.textContent = FALLBACK;
        button.disabled = false;
        button.textContent = "Get early access";
      }
    }).catch(function () {
      statusEl.style.color = "#E07A5F";
      statusEl.textContent = FALLBACK;
      button.disabled = false;
      button.textContent = "Get early access";
    });
  });
})();
