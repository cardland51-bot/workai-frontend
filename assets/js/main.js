const API_BASE = "https://workai-backend.onrender.com";

// --- DOM HOOKS ---
const captureBtn = document.getElementById("captureJobBtn");
const mediaInput = document.getElementById("mediaInput");
const thumbStrip = document.getElementById("thumbStrip");
const priceInput = document.getElementById("priceInput");
const descInput = document.getElementById("descInput");
const scopeType = document.getElementById("scopeType");
const smartReportBtn = document.getElementById("smartReportBtn");
const smartReport = document.getElementById("smartReport");
const jobsList = document.getElementById("jobsList");

// --- 1. SEED FROM LANDING (sessionStorage) ---
(function seedFromLanding() {
  if (!thumbStrip) return;
  try {
    const listRaw = sessionStorage.getItem("workai-initial-media-list");
    const single = sessionStorage.getItem("workai-initial-media");
    const urls = listRaw ? JSON.parse(listRaw) : (single ? [single] : []);
    if (!urls || !urls.length) return;

    thumbStrip.innerHTML = "";
    urls.forEach((src) => {
      const isVideo = src.startsWith("data:video");
      const el = document.createElement(isVideo ? "video" : "img");
      el.src = src;
      el.className = "thumb";
      if (isVideo) {
        el.muted = true;
        el.playsInline = true;
      }
      thumbStrip.appendChild(el);
    });
  } catch (e) {
    console.warn("No initial media from landing.", e);
  }
})();

// --- 2. CAPTURE / PICK MEDIA IN HUB ---
if (captureBtn && mediaInput) {
  captureBtn.addEventListener("click", () => mediaInput.click());

  mediaInput.addEventListener("change", () => {
    if (!thumbStrip) return;
    thumbStrip.innerHTML = "";
    Array.from(mediaInput.files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      const el = document.createElement(isVideo ? "video" : "img");
      el.src = url;
      el.className = "thumb";
      if (isVideo) {
        el.muted = true;
        el.playsInline = true;
      }
      thumbStrip.appendChild(el);
    });
  });
}

// --- 3. SEND TO BACKEND FOR REAL BAND ---
if (smartReportBtn) {
  smartReportBtn.addEventListener("click", async () => {
    if (!mediaInput.files.length) {
      alert("Add at least one photo or short video of the job first.");
      return;
    }
    const price = (priceInput?.value || "").trim();
    const description = (descInput?.value || "").trim();
    const scope = (scopeType?.value || "snapshot").trim();

    if (!price || !description) {
      alert("Add what you charged and a quick description so we’re not guessing.");
      return;
    }

    const fd = new FormData();
    fd.append("media", mediaInput.files[0]); // first file = main handle
    fd.append("price", price);
    fd.append("description", description);
    fd.append("scopeType", scope);

    smartReportBtn.disabled = true;
    smartReportBtn.textContent = "Thinking…";

    if (smartReport) {
      smartReport.style.display = "none";
      smartReport.innerHTML = "";
    }

    try {
      const res = await fetch(`${API_BASE}/api/jobs/upload`, {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        console.error("Upload failed:", res.status, await res.text().catch(() => ""));
        throw new Error("Upload failed");
      }

      const job = await res.json();

      // Expect backend to give us:
      // price, scopeType, description,
      // aiLow, aiHigh, upsellPotential, notes,
      // materialsSummary, laborSummary (optional)
      const aiLow = job.aiLow ?? job.bandLow ?? "";
      const aiHigh = job.aiHigh ?? job.bandHigh ?? "";
      const upsell = job.upsellPotential ?? "";
      const notes = job.notes ?? "Field note not available.";
      const mat = job.materialsSummary ?? "";
      const labor = job.laborSummary ?? "";

      if (smartReport) {
        smartReport.innerHTML = `
          <div class="report-label">Smart report</div>
          <div><strong>Band:</strong> ${
            aiLow && aiHigh ? `$${aiLow} – $${aiHigh}` : "Pending / not returned"
          }</div>
          ${
            mat
              ? `<div><strong>Materials (est):</strong> ${mat}</div>`
              : ""
          }
          ${
            labor
              ? `<div><strong>Time / crew (est):</strong> ${labor}</div>`
              : ""
          }
          ${
            upsell !== ""
              ? `<div><strong>Upsell lane (signal only):</strong> ${upsell}%</div>`
              : ""
          }
          <div><strong>Read:</strong> ${notes}</div>
        `;
        smartReport.style.display = "flex";
      }

      // Append to jobs list
      if (jobsList) {
        const item = document.createElement("div");
        item.className = "job-item";
        item.innerHTML = `
          <div><strong>$${job.price ?? price}</strong> • ${job.scopeType ?? scope}</div>
          <div>${job.description ?? description}</div>
          <div>
            <span class="label">Band:</span>
            ${
              aiLow && aiHigh
                ? `$${aiLow}–$${aiHigh}`
                : "n/a"
            }
          </div>
        `;
        jobsList.prepend(item);
      }
    } catch (err) {
      console.error(err);
      alert("Something glitched on the band. Check backend URL / logs and try again.");
    } finally {
      smartReportBtn.disabled = false;
      smartReportBtn.textContent = "Get Smart Band & field note ↗";
    }
  });
}

// --- 4. LOAD EXISTING JOBS ON ENTRY (optional) ---
(async function loadJobs() {
  if (!jobsList) return;
  try {
    const res = await fetch(`${API_BASE}/api/jobs/list`);
    if (!res.ok) return;
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return;

    jobs.slice().reverse().forEach((job) => {
      const aiLow = job.aiLow ?? job.bandLow;
      const aiHigh = job.aiHigh ?? job.bandHigh;
      const item = document.createElement("div");
      item.className = "job-item";
      item.innerHTML = `
        <div><strong>$${job.price ?? "—"}</strong> • ${job.scopeType ?? "snapshot"}</div>
        <div>${job.description ?? ""}</div>
        <div>
          <span class="label">Band:</span>
          ${
            aiLow && aiHigh
              ? `$${aiLow}–$${aiHigh}`
              : "pending"
          }
        </div>
      `;
      jobsList.appendChild(item);
    });
  } catch (e) {
    console.warn("Could not load existing jobs", e);
  }
})();
