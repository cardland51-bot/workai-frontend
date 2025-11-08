const API_BASE = "http://localhost:10000"; // change to your Render backend URL

document.addEventListener("DOMContentLoaded", () => {
  const modeButtons = document.querySelectorAll(".mode-btn");
  const scopeInput = document.getElementById("scopeType");
  const form = document.getElementById("jobForm");
  const resultEl = document.getElementById("result");
  const jobsList = document.getElementById("jobsList");

  if (modeButtons.length) {
    modeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        scopeInput.value = btn.dataset.mode;
      });
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      resultEl.textContent = "Processing your job...";

      const formData = new FormData(form);

      try {
        const res = await fetch(`${API_BASE}/api/jobs/upload`, {
          method: "POST",
          body: formData
        });

        if (!res.ok) {
          throw new Error("Upload failed");
        }

        const data = await res.json();
        resultEl.innerHTML = `
          <div><strong>Smart Report:</strong></div>
          <div>Suggested band: $${data.aiLow} - $${data.aiHigh}</div>
          <div>Upsell potential: ${data.upsellPotential}%</div>
          <div>Notes: ${data.notes}</div>
        `;

        loadJobs();
        form.reset();
      } catch (err) {
        console.error(err);
        resultEl.textContent = "Something went wrong. Try again.";
      }
    });
  }

  async function loadJobs() {
    if (!jobsList) return;
    jobsList.innerHTML = "";
    try {
      const res = await fetch(`${API_BASE}/api/jobs/list`);
      if (!res.ok) return;

      const jobs = await res.json();
      if (!jobs.length) {
        jobsList.innerHTML = "<div>No jobs logged yet.</div>";
        return;
      }

      jobs.slice(-5).reverse().forEach(job => {
        const div = document.createElement("div");
        div.className = "job-card";
        div.innerHTML = `
          <div>
            <strong>$${job.price}</strong> • ${job.scopeType} • ${job.description.slice(0, 60)}...
          </div>
          <div>
            Band: $${job.aiLow} - $${job.aiHigh} • Upsell: ${job.upsellPotential}%
          </div>
        `;
        jobsList.appendChild(div);
      });

    } catch (e) {
      console.error(e);
    }
  }

  loadJobs();
});
