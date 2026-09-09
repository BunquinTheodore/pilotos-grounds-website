// Renders the Events (portfolio.html) gallery from Firestore, then hands off
// to main.js's filter/lightbox logic once the real items are in the DOM.

const CATEGORY_LABEL = { cart: "Pilotos Grounds Cart", interior: "Afterhours", food: "Afterhours Food" };

function renderItem(photo) {
  const el = document.createElement("div");
  el.className = "gallery-item";
  el.setAttribute("data-cat", photo.category);
  el.setAttribute("data-full", photo.imageUrl);
  const img = document.createElement("img");
  img.src = photo.thumbUrl;
  img.alt = photo.caption || CATEGORY_LABEL[photo.category] || "Pilotos Grounds event photo";
  el.appendChild(img);
  const cap = document.createElement("span");
  cap.className = "cap";
  cap.textContent = photo.caption || CATEGORY_LABEL[photo.category] || "";
  el.appendChild(cap);
  return el;
}

async function loadGallery() {
  const grid = document.querySelector("[data-gallery]");
  if (!grid) return;
  try {
    // Dynamic imports so a broken/placeholder Firebase config (which throws
    // at module-evaluation time, e.g. getFirestore() on an unconfigured app)
    // lands in this try/catch instead of failing before loadGallery ever
    // runs — otherwise the grid stays stuck on "Loading events…" forever.
    const [{ db }, { collection, query, orderBy, getDocs }] = await Promise.all([
      import("./firebase-config.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);
    const q = query(collection(db, "photos"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    grid.innerHTML = "";
    if (snap.empty) {
      grid.innerHTML = '<p class="gallery-loading" style="grid-column:1/-1;text-align:center;padding:60px 0;opacity:.6">No event photos yet — check back soon.</p>';
      return;
    }
    snap.forEach(function (doc) {
      var el = renderItem(doc.data());
      // These photos arrive after main.js's one-shot GSAP ".stagger" reveal
      // already ran (or is about to, on window 'load') and would otherwise
      // never get animated in, leaving them stuck at the CSS default
      // opacity:0 — so make them visible immediately instead of relying on
      // that reveal to catch elements that didn't exist yet when it fired.
      el.style.opacity = 1;
      el.style.transform = "none";
      grid.appendChild(el);
    });
  } catch (err) {
    grid.innerHTML = '<p class="gallery-loading" style="grid-column:1/-1;text-align:center;padding:60px 0;opacity:.6">Photos are temporarily unavailable.</p>';
    console.error("Events gallery failed to load:", err);
  } finally {
    if (typeof window.PG_initGallery === "function") window.PG_initGallery();
  }
}

// Module scripts execute after the document has been parsed (same timing as
// `defer`), so the gallery grid already exists — no need to wait for
// DOMContentLoaded, which sidesteps a listener-registered-too-late race.
loadGallery();
