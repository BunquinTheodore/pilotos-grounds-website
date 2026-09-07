/* ==========================================================================
   PILOTOS GROUNDS — site engine
   Preloader, smooth scroll (Lenis), scroll choreography (GSAP/ScrollTrigger),
   custom cursor, nav, gallery lightbox, contact form.
   Everything here degrades gracefully under prefers-reduced-motion or if a
   CDN script fails to load — the content and nav must always work.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------------------------------------------------------------
     Preloader — skip almost instantly on repeat visits this session
  --------------------------------------------------------------------- */
  function initPreloader() {
    var pre = document.getElementById("preloader");
    if (!pre) return;
    var seen = sessionStorage.getItem("pg_intro_seen");
    var hide = function () {
      pre.classList.add("is-hidden");
      sessionStorage.setItem("pg_intro_seen", "1");
      document.body.classList.remove("is-loading");
      window.dispatchEvent(new CustomEvent("pg:revealed"));
    };
    if (seen || reduceMotion) {
      pre.style.transition = "none";
      requestAnimationFrame(hide);
      return;
    }
    document.body.classList.add("is-loading");
    var minDelay = 1300;
    var start = Date.now();
    window.addEventListener("load", function () {
      var elapsed = Date.now() - start;
      setTimeout(hide, Math.max(0, minDelay - elapsed));
    });
    // hard fallback in case 'load' never fires cleanly
    setTimeout(hide, 3200);
  }

  /* ---------------------------------------------------------------------
     Custom cursor — desktop / fine-pointer only
  --------------------------------------------------------------------- */
  function initCursor() {
    // Native custom cursor (a coffee-cup icon) — zero-lag since it's the
    // real OS pointer, not a JS-tracked element. Skipped on touch devices
    // automatically since there's no pointer to swap there.
    if (reduceMotion || !window.matchMedia("(pointer:fine)").matches) return;
    document.documentElement.classList.add("has-custom-cursor");
  }

  /* ---------------------------------------------------------------------
     Smooth scroll (Lenis) wired to ScrollTrigger's ticker
  --------------------------------------------------------------------- */
  function initSmoothScroll() {
    if (reduceMotion || !hasLenis) return null;
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    document.documentElement.classList.add("has-lenis");
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger && ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
    return lenis;
  }

  /* ---------------------------------------------------------------------
     Nav: scroll state + mobile toggle + active link
  --------------------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".site-nav");
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!nav) return;

    nav.classList.add("glass");

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("is-open");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("is-open"); });
      });
    }

    var here = document.body.getAttribute("data-page");
    document.querySelectorAll(".nav-links a[data-page], .mobile-tabbar a[data-page]").forEach(function (a) {
      if (a.getAttribute("data-page") === here) a.classList.add("is-active");
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || !window.matchMedia("(pointer:fine)").matches) return;
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      var strength = 22;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (mx / r.width) * strength + "px," + (my / r.height) * strength + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll choreography
  --------------------------------------------------------------------- */
  function initScrollFX() {
    if (!hasGSAP) {
      // graceful fallback: just reveal everything statically
      document.querySelectorAll(".reveal, .reveal-fade, .reveal-scale").forEach(function (el) {
        el.style.opacity = 1; el.style.transform = "none";
      });
      document.querySelectorAll(".stagger > *").forEach(function (el) {
        el.style.opacity = 1; el.style.transform = "none";
      });
      document.querySelectorAll(".hero h1 .line span").forEach(function (el) {
        el.style.transform = "none";
      });
      document.querySelectorAll(".hero-eyebrow, .hero-sub").forEach(function (el) {
        el.style.opacity = 1; el.style.transform = "none";
      });
      return;
    }

    var revealEase = "power3.out";

    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: revealEase,
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
    gsap.utils.toArray(".reveal-fade").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, duration: 1.1, ease: revealEase,
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });
    gsap.utils.toArray(".reveal-scale").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, scale: 1, duration: 1, ease: revealEase,
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
    gsap.utils.toArray(".stagger").forEach(function (group) {
      gsap.to(group.children, {
        opacity: 1, y: 0, duration: .9, ease: revealEase, stagger: 0.12,
        scrollTrigger: { trigger: group, start: "top 85%" }
      });
    });

    // hero line reveal
    gsap.utils.toArray(".hero h1 .line span").forEach(function (el, i) {
      gsap.to(el, { y: "0%", duration: 1.1, ease: "power4.out", delay: .15 + i * 0.08 });
    });
    if (document.querySelector(".hero-eyebrow, .hero-sub")) {
      gsap.to(".hero-eyebrow, .hero-sub", { opacity: 1, y: 0, duration: 1, delay: .5, ease: revealEase });
    }

    // hero parallax
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.3;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // number count-up
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var noGroup = el.hasAttribute("data-no-group");
      var obj = { val: 0 };
      gsap.to(obj, {
        val: end, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: function () {
          var v = Math.round(obj.val);
          el.textContent = noGroup ? String(v) : v.toLocaleString();
        }
      });
    });

    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------------------------------
     Draggable, auto-scrolling story ticker (Brief History rows)
     Always animating sideways on its own; a user can grab it and fling
     it fast in either direction without ever stopping page scroll.
  --------------------------------------------------------------------- */
  function initTimelineTicker() {
    document.querySelectorAll(".timeline-row").forEach(function (row) {
      var dir = row.getAttribute("data-dir") === "rtl" ? 1 : -1;
      var speed = reduceMotion ? 0 : 0.5;
      var half = 0;
      var dragging = false, startX = 0, startScroll = 0, lastX = 0, velocity = 0;

      function measure() { half = row.scrollWidth / 2; }
      measure();
      window.addEventListener("resize", measure);

      function wrap() {
        if (half <= 0) return;
        if (row.scrollLeft <= 0) row.scrollLeft += half;
        else if (row.scrollLeft >= half) row.scrollLeft -= half;
      }

      function raf() {
        if (!dragging) {
          if (Math.abs(velocity) > 0.05) {
            row.scrollLeft += velocity;
            velocity *= 0.94;
          } else {
            velocity = 0;
            row.scrollLeft += speed * dir;
          }
          wrap();
        }
        requestAnimationFrame(raf);
      }

      row.addEventListener("pointerdown", function (e) {
        dragging = true; velocity = 0;
        startX = lastX = e.clientX;
        startScroll = row.scrollLeft;
        row.classList.add("is-dragging");
        row.setPointerCapture(e.pointerId);
      });
      row.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        row.scrollLeft = startScroll - dx;
        velocity = lastX - e.clientX;
        lastX = e.clientX;
        wrap();
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        row.classList.remove("is-dragging");
      }
      row.addEventListener("pointerup", release);
      row.addEventListener("pointerleave", release);
      row.addEventListener("pointercancel", release);

      requestAnimationFrame(raf);
    });
  }

  /* ---------------------------------------------------------------------
     Portfolio filter + lightbox
  --------------------------------------------------------------------- */
  function initGallery() {
    var grids = document.querySelectorAll("[data-gallery]");
    if (!grids.length) return;

    var filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var f = btn.getAttribute("data-filter");
        grids.forEach(function (grid) {
          grid.querySelectorAll(".gallery-item").forEach(function (item) {
            var match = f === "all" || item.getAttribute("data-cat") === f;
            item.style.display = match ? "" : "none";
          });
        });
        if (hasScrollTrigger) ScrollTrigger.refresh();
      });
    });

    var items = [];
    grids.forEach(function (grid) {
      items = items.concat(Array.prototype.slice.call(grid.querySelectorAll(".gallery-item")));
    });
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var lbImg = lb.querySelector("img");
    var idx = 0;

    function show() {
      var item = items[idx];
      lbImg.src = item.getAttribute("data-full");
      lbImg.alt = item.querySelector("img") ? item.querySelector("img").alt : "";
    }
    function open(i) {
      idx = i;
      show();
      lb.classList.add("is-open");
    }
    function close() { lb.classList.remove("is-open"); }
    function step(dir) {
      idx = (idx + dir + items.length) % items.length;
      show();
    }

    items.forEach(function (item, i) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      if (!item.hasAttribute("aria-label")) {
        var img = item.querySelector("img");
        item.setAttribute("aria-label", "View larger photo" + (img && img.alt ? ": " + img.alt : ""));
      }
      item.addEventListener("click", function () { open(i); });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  /* ---------------------------------------------------------------------
     Contact / quote form — Formspree (no backend). Update the endpoint
     below with the client's real Formspree form ID before launch.
  --------------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var endpoint = form.getAttribute("action");
    var usesFormspree = endpoint && endpoint.indexOf("formspree.io") !== -1;

    form.addEventListener("submit", function (e) {
      if (!usesFormspree) return; // fall back to default mailto/native submit
      e.preventDefault();
      status.textContent = "Sending your request...";
      status.removeAttribute("data-state");
      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) {
          status.textContent = "Thank you! Your request has been sent — we'll get back to you shortly.";
          status.setAttribute("data-state", "ok");
          form.reset();
        } else {
          throw new Error("bad response");
        }
      }).catch(function () {
        status.textContent = "Something went wrong. Please email us directly at pilotosph@gmail.com.";
        status.setAttribute("data-state", "err");
      });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
  --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initPreloader();
    initCursor();
    initNav();
    initMagnetic();
    initGallery();
    initForm();
    initTimelineTicker();
    initSmoothScroll();
    // give layout a tick to settle (images/fonts) before measuring scroll triggers
    window.addEventListener("load", function () {
      setTimeout(initScrollFX, 50);
    });
  });
})();
