const translations = {
  en: {
    headline: "Point your camera. Tell the story. We'll tune your price.",
    subhead: "For real operators with real photos. Upload past jobs, and WorkAI helps you quote the next one with confidence.",
    cta: "Enter My Work Hub",
    freeReports: "Get free smart reports for your first 3 jobs when you add photos + a quick description.",
    sampleReport: "Sample Smart Report",
    noRace: "Not a race to the bottom. A climb to your real value.",
    hubTitle: "Hey boss, time to share your wins.",
    hubDesc: "Upload photos or a short walk-around video, tell us what you charged, and we’ll turn it into a Smart Report to guide your next quote.",
    chooseMode: "Choose how you want to capture this job:",
    snapshotMode: "Snapshot Job (fits in one frame)",
    walkMode: "Walkaround Job (full scope with context)",
    mediaLabel: "Upload photo or video:",
    priceLabel: "What did you charge for this job? (USD)",
    descLabel: "In one paragraph, describe what you did and how long it took. Talk like you're explaining it to another pro.",
    submitJob: "Generate My Smart Report",
    recentJobs: "Recent jobs you've logged"
  },
  es: {
    headline: "Apunta tu cámara. Cuenta la historia. Nosotros ajustamos tu precio.",
    subhead: "Para operadores reales con fotos reales. Sube trabajos anteriores y WorkAI te ayuda a cotizar el siguiente con confianza.",
    cta: "Entrar a Mi Panel",
    freeReports: "Obtén reportes inteligentes gratis para tus primeros 3 trabajos cuando agregues fotos + una breve descripción.",
    sampleReport: "Reporte Inteligente de Ejemplo",
    noRace: "No es una carrera hacia abajo. Es subir hacia tu verdadero valor.",
    hubTitle: "Jefe, es hora de mostrar tus trabajos.",
    hubDesc: "Sube fotos o un video corto del recorrido, dinos cuánto cobraste, y lo convertimos en un Reporte Inteligente para tu próxima cotización.",
    chooseMode: "Elige cómo capturar este trabajo:",
    snapshotMode: "Trabajo Corto (cabe en una foto)",
    walkMode: "Trabajo Completo (recorrido con contexto)",
    mediaLabel: "Sube foto o video:",
    priceLabel: "¿Cuánto cobraste por este trabajo? (USD)",
    descLabel: "En un párrafo describe qué hiciste y cuánto tiempo tomó. Háblale como a otro profesional.",
    submitJob: "Generar mi Reporte Inteligente",
    recentJobs: "Trabajos recientes que has registrado"
  }
};

function applyLang(lang) {
  const dict = translations[lang] || translations.en;
  document.querySelectorAll("[data-i18n-key]").forEach(el => {
    const key = el.getAttribute("data-i18n-key");
    if (dict[key]) el.textContent = dict[key];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".lang-toggle button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const lang = btn.getAttribute("data-lang");
      applyLang(lang);
    });
  });

  applyLang("en");
});
