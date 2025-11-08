const API_BASE = "https://workai-backend.onrender.com";

const captureBtn = document.getElementById("captureJobBtn");
const mediaInput = document.getElementById("mediaInput");
const thumbStrip = document.getElementById("thumbStrip");
const priceInput = document.getElementById("priceInput");
const descInput = document.getElementById("descInput");
const scopeType = document.getElementById("scopeType");
const smartReportBtn = document.getElementById("smartReportBtn");
const smartReport = document.getElementById("smartReport");
const jobsList = document.getElementById("jobsList");

// Open camera / picker
if (captureBtn && mediaInput) {
  captureBtn.addEventListener("click", () => mediaInput.click());

  mediaInput.addEventListener("change", () => {
    thumbStrip.innerHTML = "";
    Array.from(mediaInput.files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const el = document.createElement(
        file.type.startsWith("video/") ? "video" : "img"
      );
      el.src = url;
      el.className = "thumb";
      if (el.tagName === "VIDEO") {
        el.muted = true;
        el.playsInline = true;
      }
      thumbStrip.appendChild(el);
    });
  });
}

// Submit to backend
if (smartReportBtn) {
  smartReportBtn.addEventListener("click", async () => {
    smartReport.style.display = "none";
    smartReport.innerHTML = "";

    if (!mediaInput.files.length) {
      alert("Snap or select at least one photo/video first.");
      return;
    }
    const price = priceInput.value.trim();
    const description = descInput.value.trim();
    if (!price || !description) {
      alert("Add what you charged and a quick description.");
      return;
    }

    const fd = new FormData();
    fd.append("media", mediaInput.files[0]); // first file = lead asset
    fd.append("price", price);
    fd.append("description", description);
    fd.append("scopeType", scopeType.value || "snapshot");

    smartReportBtn.disabled = true;
    smartReportBtn.textContent = "Thinking...";

    try {
      const res = await fetch(`${API_BASE}/api/jobs/upload`, {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const job = await res.json();

      // Show screenshot-safe Smart Report
      smartReport.innerHTML = `
        <div><strong>Band:</strong> $${job.aiLow} – $${job.aiHigh}</div>
        <div><strong>Upsell signal:</strong> ${job.upsellPotential}%</div>
        <div><strong>Read:</strong> ${job.notes}</div>
      `;
      smartReport.style.display = "block";

      // Prepend to recent jobs
      if (jobsList) {
        const item = document.createElement("div");
        item.className = "job-item";
        item.innerHTML = `
          <div><strong>$${job.price}</strong> • ${job.scopeType}</div>
          <div>${job.description}</div>
          <div>Band: $${job.aiLow}–$${job.aiHigh} · Upsell: ${job.upsellPotential}%</div>
        `;
        jobsList.prepend(item);
      }
    } catch (err) {
      console.error(err);
      alert("Something glitched. Try again.");
    } finally {
      smartReportBtn.disabled = false;
      smartReportBtn.textContent = "Get Smart Report";
    }
  });
}

// Load existing jobs on page load (optional but nice)
(async () => {
  if (!jobsList) return;
  try {
    const res = await fetch(`${API_BASE}/api/jobs/list`);
    if (!res.ok) return;
    const jobs = await res.json();
    jobs.slice().reverse().forEach((job) => {
      const item = document.createElement("div");
      item.className = "job-item";
      item.innerHTML = `
        <div><strong>$${job.price}</strong> • ${job.scopeType}</div>
        <div>${job.description}</div>
        <div>Band: $${job.aiLow}–$${job.aiHigh} · Upsell: ${job.upsellPotential}%</div>
      `;
      jobsList.appendChild(item);
    });
  } catch (e) {
    console.error(e);
  }
})();
