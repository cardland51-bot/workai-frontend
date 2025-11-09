// assets/js/main.js

const API_BASE = "https://workai-backend.onrender.com";

// DOM hooks
const openCameraBtn = document.getElementById("openCameraBtn");
const jobMediaInput = document.getElementById("jobMediaInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const thumbStrip = document.getElementById("thumbStrip");
const cardsStrip = document.getElementById("cardsStrip");
const deckCountEl = document.getElementById("deckCount");
const overlay = document.getElementById("cardOverlay");
const overlayClose = document.getElementById("overlayClose");
const overlayContent = document.getElementById("overlayContent");

// Simple in-memory deck
let deck = [];
let activeIndex = -1;
let lastSelectedFile = null;

// --- Capture: open camera / library ---

if (openCameraBtn && jobMediaInput) {
  openCameraBtn.addEventListener("click", () => {
    jobMediaInput.click();
  });

  jobMediaInput.addEventListener("change", () => {
    if (!jobMediaInput.files || !jobMediaInput.files.length) return;

    const file = jobMediaInput.files[0];
    lastSelectedFile = file;

    if (thumbStrip) {
      thumbStrip.innerHTML = "";
      const url = URL.createObjectURL(file);
      const isVideo = file.type && file.type.startsWith("video/");
      const el = document.createElement(isVideo ? "video" : "img");
      el.src = url;
      el.className = "thumb";
      if (isVideo) {
        el.muted = true;
        el.playsInline = true;
      }
      thumbStrip.appendChild(el);
    }
  });
}

// --- Analyze: send to backend, build Smart Card ---

if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async () => {
    if (!lastSelectedFile) {
      alert("Start with a job photo or short clip first.");
      return;
    }

    analyzeBtn.disabled = true;
    const originalLabel = analyzeBtn.textContent;
    analyzeBtn.textContent = "Building…";

    try {
      const fd = new FormData();
      fd.append("media", lastSelectedFile);

      // Optional: send light context so backend isn't blind.
      fd.append("description", "Captured via WorkAI Hub v1");
      fd.append("scopeType", "snapshot");

      const res = await fetch(`${API_BASE}/api/jobs/upload`, {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        const text = await safeRead(res);
        console.error("Upload failed", res.status, text);
        throw new Error("Band request failed");
      }

      const job = await res.json();
      const card = mapJobToCard(job);

      deck.push(card);
      activeIndex = deck.length - 1;
      renderDeck();
      clearCaptureThumb();
    } catch (err) {
      console.error(err);
      alert("Something glitched on the smart band. Check backend / try again.");
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = originalLabel;
    }
  });
}

// --- Load existing jobs on entry (if backend supports it) ---

(async function loadExistingJobs() {
  if (!cardsStrip) return;
  try {
    const res = await fetch(`${API_BASE}/api/jobs/list`);
    if (!res.ok) return;

    const jobs = await res.json();
    if (!Array.isArray(jobs)) return;

    deck = jobs.map(mapJobToCard);
    if (deck.length) {
      activeIndex = deck.length - 1;
      renderDeck();
    } else {
      updateDeckCount();
    }
  } catch (e) {
    console.warn("Could not load existing jobs", e);
  }
})();

// --- Map backend job → internal card shape ---

function mapJobToCard(job) {
  const bandLow = numberOrNull(job.aiLow ?? job.bandLow);
  const bandHigh = numberOrNull(job.aiHigh ?? job.bandHigh);
  const price = numberOrNull(job.price);
  const upsell = job.upsellPotential;
  const notes = job.notes || job.summary || "Band generated. Tune this lane as you go.";
  const id = job.id || job._id || shortId();
  const created = job.createdAt || new Date().toISOString();

  return {
    id,
    created,
    photoUrl: job.previewUrl || null, // if you later return a URL
    bandLow,
    bandHigh,
    price,
    upsell,
    notes,
    scopeType: job.scopeType || "snapshot",
    description: job.description || "Job capture"
  };
}

// --- Render deck as stacked cards ---

function renderDeck() {
  if (!cardsStrip) return;
  cardsStrip.innerHTML = "";

  if (!deck.length) {
    updateDeckCount();
    return;
  }

  if (activeIndex < 0 || activeIndex >= deck.length) {
    activeIndex = deck.length - 1;
  }

  deck.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "job-card";

    if (index === activeIndex) {
      el.classList.add("active");
    } else if (index === activeIndex - 1) {
      el.classList.add("left");
    } else if (index === activeIndex + 1) {
      el.classList.add("right");
    }

    el.innerHTML = buildCardInner(card);
    el.addEventListener("click", () => openOverlay(card));

    cardsStrip.appendChild(el);
  });

  updateDeckCount();
}

// --- Card inner HTML ---

function buildCardInner(card) {
  const bandText =
    card.bandLow != null && card.bandHigh != null
      ? `$${card.bandLow} – $${card.bandHigh}`
      : "Band pending";

  const priceLine =
    card.price != null
      ? `$${card.price}`
      : "—";

  const upsellLine =
    typeof card.upsell === "number"
      ? `${card.upsell}%`
      : "lane opens as we learn";

  return `
    <div class="job-head">
      <div>
        <div class="job-label">WorkAI job card</div>
        <div class="job-id">#${card.id}</div>
      </div>
      <div class="job-band">${bandText}</div>
    </div>
    <div class="job-meta">
      <span>${card.scopeType}</span>
      <span>${trimDesc(card.description)}</span>
      <span>Quoted: ${priceLine}</span>
      <span>Upsell: ${upsellLine}</span>
    </div>
    <div class="job-note">
      ${escapeHtml(card.notes)}
    </div>
    <div class="job-actions">
      <div class="tag-btn">View full ticket</div>
      <div class="tag-btn">Copy summary</div>
    </div>
  `;
}

// --- Overlay (fullscreen ticket) ---

function openOverlay(card) {
  if (!overlay || !overlayContent) return;

  const bandText =
    card.bandLow != null && card.bandHigh != null
      ? `$${card.bandLow} – $${card.bandHigh}`
      : "Band not available";

  const priceText =
    card.price != null
      ? `$${card.price}`
      : "Not provided";

  const upsellLine =
    typeof card.upsell === "number"
      ? `${card.upsell}%`
      : "As you tune this lane, we’ll surface signals.";

  overlayContent.innerHTML = `
    <div class="overlay-title">Job ticket · #${card.id}</div>
    <div class="overlay-note">Use this as your field ticket baseline. Adjust details before sending.</div>
    <div class="overlay-note"><strong>Scope:</strong> ${escapeHtml(card.scopeType)}</div>
    <div class="overlay-note"><strong>Description:</strong> ${escapeHtml(card.description)}</div>
    <div class="overlay-note"><strong>Suggested band:</strong> ${bandText}</div>
    <div class="overlay-note"><strong>Your quoted / anchor:</strong> ${priceText}</div>
    <div class="overlay-note"><strong>Upsell lane:</strong> ${upsellLine}</div>
    <div class="overlay-note"><strong>Notes:</strong> ${escapeHtml(card.notes)}</div>
    <div class="overlay-note" style="margin-top:4px;">
      Coming soon: attach photos, client, route, and payment link directly to this ticket.
    </div>
  `;

  overlay.classList.add("active");
}

if (overlayClose && overlay) {
  overlayClose.addEventListener("click", () => {
    overlay.classList.remove("active");
  });
}

if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
    }
  });
}

// --- Helpers ---

function updateDeckCount() {
  if (!deckCountEl) return;
  const n = deck.length;
  deckCountEl.textContent = n === 1 ? "1 card" : `${n} cards`;
}

function clearCaptureThumb() {
  if (thumbStrip) thumbStrip.innerHTML = "";
  if (jobMediaInput) jobMediaInput.value = "";
  lastSelectedFile = null;
}

async function safeRead(res) {
  try {
    return await res.text();
  } catch (e) {
    return "";
  }
}

function numberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function trimDesc(text) {
  if (!text) return "";
  const t = String(text).trim();
  if (t.length <= 40) return t;
  return t.slice(0, 37) + "...";
}

function shortId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
