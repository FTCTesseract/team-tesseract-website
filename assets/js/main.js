(function () {
  "use strict";

  const isFine = window.matchMedia("(pointer:fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- preloader ---------------- */
  const preloader = document.getElementById("preloader");
  const boot = () => {
    document.body.classList.add("loaded");
    setTimeout(() => preloader.classList.add("done"), 700);
    setTimeout(() => preloader.remove(), 1600);
  };
  if (reduced) boot();
  else {
    window.addEventListener("load", boot);
    setTimeout(boot, 3200);
  }

  /* ---------------- custom cursor ---------------- */
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  let mx = -100, my = -100, rx = -100, ry = -100;
  if (isFine && !reduced) {
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a, button, .g-thumb").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });
  }

  /* ---------------- navigate & scroll ---------------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("scrollProgress");
  const toTop = document.getElementById("toTop");
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const sectionIds = ["about", "team", "seasons", "robot", "outreach", "press", "sponsors"];
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = en.target.id;
          navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  burger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    burger.classList.toggle("open", open);
    document.body.classList.toggle("no-scroll", open);
  });
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      burger.classList.remove("open");
      document.body.classList.remove("no-scroll");
    })
  );

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    });
  });

  /* ---------------- reveal ---------------- */
  const reveals = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  reveals.forEach((el, i) => {
    if (el.closest(".team-grid")) el.setAttribute("data-stagger", String(i % 3));
    io.observe(el);
  });

  /* ---------------- counters ---------------- */
  const counters = document.querySelectorAll("[data-count]");
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1600;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => cio.observe(c));

  /* ---------------- magnetic buttons ---------------- */
  if (isFine && !reduced) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.18 + "px)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const strength = 6;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateX(" + -py * strength + "deg) rotateY(" + px * strength + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------------- robot gallery ---------------- */
  const gMainImg = document.querySelector("#gMain img");
  const gThumbs = document.querySelectorAll(".g-thumb");
  gThumbs.forEach((t) => {
    t.addEventListener("click", () => {
      gThumbs.forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
      gMainImg.src = t.dataset.src;
    });
  });

  /* ---------------- shine sweep on buttons ---------------- */
  document.querySelectorAll(".btn").forEach((btn) => {
    const shine = document.createElement("span");
    shine.className = "shine";
    btn.appendChild(shine);
  });
})();
