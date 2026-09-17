/* TrackCollectibles — landing page behavior
   1. Scroll-reveal animations (IntersectionObserver)
   2. Animated hero counters
   3. Waitlist form → Formspree (AJAX)
   4. Live date stamp (Market Wire)
   5. Board sparklines + ticking demo prices + live refresh clock
   6. Phone mockup parallax tilt
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

  /* ── 4. Live date stamp ── */
  (function () {
    var d = new Date();
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var stamp = months[d.getMonth()] + " " + d.getFullYear();
    document.querySelectorAll("[data-livedate]").forEach(function (el) { el.textContent = stamp; });
  })();

  /* ── 5a. Sparklines on the demo board ── */
  function makeSparkPoints(dir) {
    // build a gently trending series with light jitter
    var n = 11, pts = [], w = 120, h = 26, i, y;
    var base = dir === "down" ? 6 : 20;             // start low for up-trend, high for down
    var slope = dir === "down" ? (16 / (n - 1)) : (-16 / (n - 1));
    for (i = 0; i < n; i++) {
      y = base + slope * i + (Math.random() * 5 - 2.5);
      y = Math.max(2, Math.min(h - 2, y));
      pts.push((i * (w / (n - 1))).toFixed(1) + "," + y.toFixed(1));
    }
    return pts.join(" ");
  }
  document.querySelectorAll('.spark[data-spark]').forEach(function (cell) {
    var dir = cell.getAttribute("data-spark");
    var color = dir === "down" ? "#F09595" : "#5DCAA5";
    var svg = '<svg width="120" height="26" viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true">' +
      '<polyline fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" points="' +
      makeSparkPoints(dir) + '"/></svg>';
    cell.innerHTML = svg;
  });

  /* ── 5b. Ticking demo prices + row flash ── */
  var board = document.querySelector("[data-board]");
  if (board && !reduceMotion) {
    var rows = Array.prototype.slice.call(board.querySelectorAll("tbody tr"));
    setInterval(function () {
      var row = rows[Math.floor(Math.random() * rows.length)];
      var pxEl = row.querySelector("[data-px]");
      var chgEl = row.querySelector("[data-chg]");
      if (!pxEl) return;
      var base = parseFloat(pxEl.getAttribute("data-px"));
      var drift = (Math.random() * 0.04 - 0.015);          // -1.5%..+2.5%
      var next = Math.max(1, Math.round(base * (1 + drift)));
      pxEl.setAttribute("data-px", next);
      pxEl.textContent = "$" + next.toLocaleString();
      if (chgEl) {
        var up = drift >= 0;
        var pct = Math.abs(drift * 100).toFixed(1);
        chgEl.textContent = (up ? "▲ " : "▼ ") + pct + "%";
        chgEl.className = "r " + (up ? "up" : "dn");
        chgEl.setAttribute("data-chg", "");
      }
      row.classList.add("flash");
      setTimeout(function () { row.classList.remove("flash"); }, 600);
    }, 2600);
  }

  /* ── 5c. Live refresh clock ── */
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var tickClock = function () {
      var d = new Date();
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      clock.textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    };
    tickClock();
    if (!reduceMotion) setInterval(tickClock, 1000);
  }

  /* ── 6. Phone mockup parallax tilt ── */
  var phoneWrap = document.querySelector(".phone-wrap");
  var phone = phoneWrap && phoneWrap.querySelector(".phone");
  var hero = document.querySelector(".hero");
  if (phone && hero && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var cx = (e.clientX - r.left) / r.width - 0.5;
      var cy = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform = "perspective(900px) rotateY(" + (cx * 9).toFixed(2) + "deg) rotateX(" + (-cy * 9).toFixed(2) + "deg)";
    });
    hero.addEventListener("mouseleave", function () {
      phone.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }

  /* ── 3. Waitlist form ── */
  var form = document.getElementById("waitlist-form");
  if (!form) return;
  var statusEl = form.querySelector(".form-success");
  var button = form.querySelector("button[type=submit]");
  var FALLBACK = "Something went wrong — please try again, or email support@trackcollectibles.com and we'll add you by hand.";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.style.color = "";

    // Not wired up yet? Be honest instead of pretending.
    if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
      statusEl.textContent = "The waitlist opens very soon — meanwhile, email support@trackcollectibles.com and we'll add you by hand.";
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
