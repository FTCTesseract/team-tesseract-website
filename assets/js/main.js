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

  /* ---------------- 4D TESSERACT ---------------- */
  const canvas = document.getElementById("tesseract-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  let tmx = 0, tmy = 0;

  const verts = [];
  for (let i = 0; i < 16; i++)
    verts.push([
      (i & 1 ? 1 : -1),
      (i & 2 ? 1 : -1),
      (i & 4 ? 1 : -1),
      (i & 8 ? 1 : -1)
    ]);
  const edges = [];
  for (let i = 0; i < 16; i++)
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) diff += Math.abs(verts[i][k] - verts[j][k]);
      if (diff === 2) edges.push([i, j]);
    }

  const shellVerts = [];
  const shellSize = 1.85;
  for (let i = 0; i < 16; i++)
    shellVerts.push(verts[i].map((v) => v * shellSize));
  const shellEdges = edges.map(([a, b]) => [a, b]);

  const rot = { xy: 0, xz: 0, zw: 0.6, yw: 0 };

  function resize() {
    const parent = canvas.parentElement;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = parent.clientWidth;
    H = parent.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const R2 = (p) => {
    const a = Math.sin(p);
    const b = Math.cos(p);
    return [a, b];
  };

  function rotate4(v, t) {
    let x = v[0], y = v[1], z = v[2], w = v[3];
    let s, c;
    [s, c] = R2(t.xy);
    let x1 = c * x - s * y, y1 = s * x + c * y;
    x = x1; y = y1;
    [s, c] = R2(t.xz);
    x1 = c * x - s * z; z = s * x + c * z; x = x1;
    [s, c] = R2(t.yw);
    y1 = c * y - s * w; w = s * y + c * w; y = y1;
    [s, c] = R2(t.zw);
    const z1 = c * z - s * w, w1 = s * z + c * w;
    z = z1; w = w1;
    return [x, y, z, w];
  }

  const persp = 3.8;
  function project(v) {
    const s0 = persp / (persp - v[3]);
    const s = Math.min(3.2, Math.max(0.35, s0));
    return [v[0] * s, v[1] * s, v[2] * s, s];
  }

  function render(time) {
    if (reduced) return;
    ctx.clearRect(0, 0, W, H);
    const t = time / 1000;
    rot.xy = t * 0.32 + tmx * 0.6;
    rot.xz = t * 0.21 - tmy * 0.5;
    rot.zw = 0.7 + t * 0.14;
    rot.yw = t * 0.11;

    const cx = W / 2, cy = H / 2;
    const scale = Math.min(W, H) * 0.15;

    const bodies = [
      { verts, edges, col: [255, 255, 255], lw: 2.0, dim: 1.0 },
      { verts: shellVerts, edges: shellEdges, col: [200, 180, 255], lw: 2.5, dim: 1.0 }
    ];

    bodies.forEach((b) => {
      const pts = b.verts.map((v) => project(rotate4(v, rot)));
      const parts = [];
      b.edges.forEach(([i, j]) => {
        const a = pts[i], d = pts[j];
        const mid = (a[3] + d[3]) / 2;
        const alpha = Math.max(0.06, Math.min(0.85, (mid - 0.6) / 2.2));
        const depthZ = (a[2] + d[2]) / 2;
        parts.push({ a, d, alpha, depthZ });
      });
      parts.sort((p, q) => p.depthZ - q.depthZ);

      ctx.lineWidth = b.lw;
      parts.forEach((p) => {
        const [r, g, bl] = b.col;
        const fade = 0.35 + 0.65 * Math.max(0, Math.min(1, (p.depthZ + 1) / 2));
        ctx.strokeStyle = "rgba(" + r + "," + g + "," + bl + "," + (p.alpha * b.dim * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(cx + p.a[0] * scale, cy + p.a[1] * scale);
        ctx.lineTo(cx + p.d[0] * scale, cy + p.d[1] * scale);
        ctx.stroke();
      });

      pts.forEach((p) => {
        const [r, g, bl] = b.col;
        const alpha = Math.max(0.05, Math.min(0.9, (p[3] - 0.6) / 2.2)) * b.dim;
        const fade = 0.35 + 0.65 * Math.max(0, Math.min(1, (p[2] + 1) / 2));
        const rad = Math.max(0.9, 1.6 + p[3] * 0.8) * (b === bodies[1] ? 1.5 : 1);
        const g1 = ctx.createRadialGradient(cx + p[0] * scale, cy + p[1] * scale, 0, cx + p[0] * scale, cy + p[1] * scale, rad * 4);
        g1.addColorStop(0, "rgba(" + r + "," + g + "," + bl + "," + (alpha * fade) + ")");
        g1.addColorStop(1, "rgba(" + r + "," + g + "," + bl + ",0)");
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(cx + p[0] * scale, cy + p[1] * scale, rad * 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    const vignette = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, Math.max(W, H) * 0.75);
    vignette.addColorStop(0, "rgba(5,6,15,0)");
    vignette.addColorStop(1, "rgba(5,6,15,.75)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function animate() {
    render(performance.now());
    if (!reduced) requestAnimationFrame(animate);
  }
  animate();

  if (isFine && !reduced) {
    window.addEventListener("mousemove", (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  /* ---------------- nav & scroll ---------------- */
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
