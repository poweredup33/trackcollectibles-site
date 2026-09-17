/* TrackCollectibles — landing page behavior
   1. Scroll-reveal animations (IntersectionObserver)
   2. Animated hero counters
   3. Waitlist form → Formspree (AJAX)
   4. Live date stamp (Market Wire)
   5. Board sparklines + ticking demo prices + live refresh clock
   6. Phone mockup parallax tilt
   7. Interactive scan demo
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
  var phoneTilt = phoneWrap && phoneWrap.querySelector(".phone");
  var hero = document.querySelector(".hero");
  if (phoneTilt && hero && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var cx = (e.clientX - r.left) / r.width - 0.5;
      var cy = (e.clientY - r.top) / r.height - 0.5;
      phoneTilt.style.transform = "perspective(900px) rotateY(" + (cx * 9).toFixed(2) + "deg) rotateX(" + (-cy * 9).toFixed(2) + "deg)";
    });
    hero.addEventListener("mouseleave", function () {
      phoneTilt.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }

  /* ── 7. Interactive scan demo ── */
  (function () {
    var phone = document.querySelector(".phone");
    var listEl = document.querySelector("[data-ps-list]");
    var totalEl = document.querySelector("[data-portfolio]");
    if (!phone || !listEl || !totalEl) return;

    var items = [
      { n: "Batman #232", g: "CGC 9.8 · Comics", v: 1240, c: "▲ 2.1%", up: true, col: "#5DCAA5" },
      { n: "Charizard VMAX", g: "PSA 10 · Cards", v: 890, c: "▲ 4.8%", up: true, col: "#CB9A33" },
      { n: "Morgan Dollar 1881-S", g: "MS65 · Coins", v: 420, c: "▼ 0.6%", up: false, col: "#9A9EAC" },
      { n: "Amazing Fantasy #15", g: "Raw · Comics", v: 3200, c: "▲ 3.4%", up: true, col: "#F09595" },
      { n: "Optimus Prime", g: "Raw · boxed · Toys", v: 660, c: "▲ 1.5%", up: true, col: "#C9962F" },
      { n: "Revolver LP", g: "Raw · VG+ · Vinyl", v: 310, c: "▲ 1.2%", up: true, col: "#8F9BD1" }
    ];
    var addedEl = document.querySelector("[data-ps-added]");
    var subEl = document.querySelector("[data-ps-sub]");
    var capEl = document.querySelector("[data-scan-cap]");
    var stripEl = document.querySelector("[data-scan-strip]");
    var resEl = document.querySelector("[data-scan-result]");
    var emptyEl = document.querySelector("[data-ps-empty]");
    var statusEl = document.querySelector("[data-scan-status]");
    var fab = document.querySelector("[data-scan-fab]");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".scan-chip"));
    var total = 0, count = 0, busy = false, added = {};

    function money(n) { return "$" + Math.round(n).toLocaleString(); }
    function say(t) { if (statusEl) statusEl.textContent = t; }

    function countAnim(from, to) {
      if (reduceMotion) { totalEl.textContent = money(to); return; }
      var start = null, dur = 700;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        totalEl.textContent = money(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step); else totalEl.textContent = money(to);
      }
      requestAnimationFrame(step);
    }

    function addRow(it) {
      if (emptyEl) emptyEl.style.display = "none";
      var row = document.createElement("div");
      row.className = "ps-row justadded";
      row.innerHTML =
        '<div class="ps-thumb"><i style="background:' + it.col + '"></i></div>' +
        '<div class="ps-rinfo"><div class="ps-rt">' + it.n + '</div><div class="ps-rg">' + it.g + '</div></div>' +
        '<div class="ps-rv"><div class="ps-rp">' + money(it.v) + '</div><div class="ps-rc ' + (it.up ? "up" : "dn") + '">' + it.c + '</div></div>';
      listEl.insertBefore(row, listEl.firstChild);
      var rows = listEl.querySelectorAll(".ps-row");
      while (rows.length > 4) { rows[rows.length - 1].parentNode.removeChild(rows[rows.length - 1]); rows = listEl.querySelectorAll(".ps-row"); }
      setTimeout(function () { row.classList.remove("justadded"); }, 600);
    }

    function commit(i) {
      var it = items[i], from = total;
      added[i] = true; count++; total = from + it.v;
      addRow(it); countAnim(from, total);
      if (chips[i]) chips[i].disabled = true;
      if (subEl) subEl.textContent = count + (count === 1 ? " item · tracked live" : " items · tracked live");
      if (addedEl && !reduceMotion) {
        addedEl.textContent = "+" + money(it.v) + "  ";
        setTimeout(function () { addedEl.textContent = ""; }, 1700);
      }
      chips.forEach(function (c) { c.classList.remove("busy"); });
      busy = false;
      say(it.n + " valued at " + money(it.v) + " — " + money(total) + " total. Try another.");
    }

    function scan(i) {
      if (busy) return;
      if (added[i]) { say("That one's already in the demo portfolio — try another."); return; }
      busy = true;
      chips.forEach(function (c) { c.classList.add("busy"); });
      if (stripEl) stripEl.style.background = items[i].col;
      if (resEl) { resEl.classList.remove("show"); resEl.innerHTML = ""; }
      if (reduceMotion) { commit(i); return; }
      say("Scanning " + items[i].n + "…");
      phone.classList.add("scanning");
      if (capEl) { capEl.className = "scan-cap"; capEl.textContent = "Scanning…"; }
      setTimeout(function () { if (capEl) capEl.textContent = "Identifying…"; }, 950);
      setTimeout(function () {
        if (capEl) { capEl.className = "scan-cap ok"; capEl.textContent = "Identified ✓"; }
        if (resEl) {
          resEl.innerHTML = '<div class="rt">' + items[i].n + '</div><div class="rg">' + items[i].g + '</div><div class="rp">' + money(items[i].v) + '</div>';
          resEl.classList.add("show");
        }
      }, 1500);
      setTimeout(function () { phone.classList.remove("scanning"); commit(i); }, 2350);
    }

    function nextIndex() { for (var i = 0; i < items.length; i++) { if (!added[i]) return i; } return -1; }
    function reset() {
      added = {}; total = 0; count = 0;
      var rows = listEl.querySelectorAll(".ps-row");
      Array.prototype.forEach.call(rows, function (r) { r.parentNode.removeChild(r); });
      if (emptyEl) emptyEl.style.display = "";
      totalEl.textContent = "$0";
      if (subEl) subEl.textContent = "Scan an item to begin";
      chips.forEach(function (c) { c.disabled = false; });
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () { scan(parseInt(c.getAttribute("data-scan"), 10)); });
    });
    if (fab) fab.addEventListener("click", function () {
      if (busy) return;
      var i = nextIndex();
      if (i < 0) { reset(); i = 0; }
      scan(i);
    });

    if (reduceMotion) {
      [0, 1, 3].forEach(function (i) { commit(i); });
      say("Interactive demo — tap an item to add it to the portfolio.");
    } else {
      setTimeout(function () { if (!busy && !added[0]) scan(0); }, 1400);
    }
  })();

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
