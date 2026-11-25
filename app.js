const VALID_TABS = ["presentacio", "serveis", "galeria"];
const VALID_LANGS = ["ca", "es"];

let siteData = null;
let currentLang = "ca";
let activeModifier = "violi";
let activeVideoCategory = "all";

const ICONS = {
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`
};

async function loadLanguage(lang) {
  const targetLang = VALID_LANGS.includes(lang) ? lang : "ca";
  const banner = document.getElementById("load-error");

  try {
    const response = await fetch(`data/${targetLang}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    siteData = await response.json();

    currentLang = targetLang;
    activeVideoCategory = "all";
    document.documentElement.lang = targetLang;
    localStorage.setItem("portfolio_lang", targetLang);
    banner.hidden = true;

    updateLangButtons();
    renderHeader();
    renderPresentacio();
    renderServeis();
    renderGaleria();
    renderFooter();
  } catch (err) {
    banner.hidden = false;
    banner.textContent =
      "No s'han pogut carregar les dades / No se han podido cargar los datos. Obre el projecte amb un servidor local (Live Server o python3 -m http.server).";
    console.error(err);
  }
}

function updateLangButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.dataset.lang === currentLang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function setupLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.lang;
      if (selected !== currentLang) {
        loadLanguage(selected);
      }
    });
  });
}

function renderHeader() {
  const { meta, nav } = siteData;
  document.title = `${meta.artistName} — ${meta.tagline}`;
  document.getElementById("artist-tagline").textContent = meta.tagline;
  document.getElementById("artist-name").textContent = meta.artistName;
  document.getElementById("artist-location").textContent = meta.location;

  document.getElementById("tab-presentacio").textContent = nav.presentacio;
  document.getElementById("tab-serveis").textContent = nav.serveis;
  document.getElementById("tab-galeria").textContent = nav.galeria;
}

function renderPresentacio() {
  const { presentacio } = siteData;
  document.getElementById("pres-headline").textContent = presentacio.headline;

  const paragraphsEl = document.getElementById("pres-paragraphs");
  paragraphsEl.innerHTML = presentacio.paragraphs
    .map((text) => `<p>${text}</p>`)
    .join("");

  const pillarsEl = document.getElementById("pres-pillars");
  pillarsEl.innerHTML = presentacio.pillars
    .map(
      (pillar) => `
      <article class="pillar-card">
        <h3>${pillar.title}</h3>
        <p>${pillar.text}</p>
      </article>`
    )
    .join("");

  const cvEl = document.getElementById("pres-cv");
  cvEl.innerHTML = presentacio.cvSections
    .map(
      (sec) => `
      <article class="cv-card">
        <h3>${sec.heading}</h3>
        <ul>${sec.items.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>`
    )
    .join("");

  document.getElementById("pres-cta-text").textContent = presentacio.cta.text;
  document.getElementById("pres-cta-btn").textContent = presentacio.cta.buttonLabel;
}

function renderServeis() {
  const { serveis } = siteData;
  document.getElementById("serv-title").textContent = serveis.title;
  document.getElementById("serv-subtitle").textContent = serveis.subtitle;
  document.getElementById("serv-modifier-label").textContent = serveis.modifierLabel;
  document.getElementById("serv-disclaimer").textContent = serveis.disclaimer;

  const pillsEl = document.getElementById("serv-modifiers");
  pillsEl.innerHTML = serveis.modifiers
    .map(
      (mod) => `
      <button
        type="button"
        class="modifier-btn ${mod.id === activeModifier ? "active" : ""}"
        data-modifier="${mod.id}">
        ${mod.label}
      </button>`
    )
    .join("");

  pillsEl.querySelectorAll(".modifier-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeModifier = btn.dataset.modifier;
      renderServeis();
    });
  });

  const currentModObj = serveis.modifiers.find((m) => m.id === activeModifier);
  document.getElementById("serv-modifier-note").textContent = currentModObj
    ? currentModObj.note
    : "";

  const eventsEl = document.getElementById("serv-events");
  eventsEl.innerHTML = serveis.events
    .map((ev) => {
      const rate = ev.pricing[activeModifier];
      return `
      <article class="event-card">
        <div>
          <span class="event-badge">${ev.badge}</span>
          <h3>${ev.title}</h3>
          <p class="event-desc">${ev.description}</p>
          <ul class="event-includes">
            ${ev.includes.map((inc) => `<li>${inc}</li>`).join("")}
          </ul>
        </div>
        <div class="price-box">
          <span class="price-amount">${rate.price}</span>
          <span class="price-detail">${rate.detail}</span>
        </div>
      </article>`;
    })
    .join("");
}

function renderGaleria() {
  const { galeria } = siteData;
  document.getElementById("gal-title").textContent = galeria.title;
  document.getElementById("gal-subtitle").textContent = galeria.subtitle;

  const categories = ["all", ...new Set(galeria.videos.map((v) => v.category))];
  const filtersEl = document.getElementById("gal-filters");

  filtersEl.innerHTML = categories
    .map((cat) => {
      const label = cat === "all" ? galeria.allLabel : cat;
      return `
        <button
          type="button"
          class="modifier-btn ${cat === activeVideoCategory ? "active" : ""}"
          data-cat="${cat}">
          ${label}
        </button>`;
    })
    .join("");

  filtersEl.querySelectorAll(".modifier-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeVideoCategory = btn.dataset.cat;
      renderGaleria();
    });
  });

  const filteredVideos =
    activeVideoCategory === "all"
      ? galeria.videos
      : galeria.videos.filter((v) => v.category === activeVideoCategory);

  const videosEl = document.getElementById("gal-videos");
  videosEl.innerHTML = filteredVideos
    .map(
      (vid) => `
      <article class="video-card">
        <div class="video-wrapper">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${vid.youtubeId}"
            title="${vid.title}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
        <div class="video-info">
          <span class="video-cat">${vid.category}</span>
          <h3>${vid.title}</h3>
          <p>${vid.description}</p>
        </div>
      </article>`
    )
    .join("");
}

function renderFooter() {
  const { footer } = siteData;
  document.getElementById("footer-title").textContent = footer.title;
  document.getElementById("footer-subtitle").textContent = footer.subtitle;
  document.getElementById("footer-copy").textContent = footer.copyright;

  const linksEl = document.getElementById("footer-links");
  linksEl.innerHTML = footer.links
    .map(
      (link) => `
      <a class="contact-card" href="${link.url}" target="_blank" rel="noopener noreferrer">
        ${ICONS[link.type] || ""}
        <span class="contact-meta">
          <span class="contact-label">${link.label}</span>
          <span class="contact-value">${link.display}</span>
        </span>
      </a>`
    )
    .join("");
}

function activateTab(tabName, updateHash = true) {
  const target = VALID_TABS.includes(tabName) ? tabName : "presentacio";

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const isSelected = btn.dataset.tab === target;
    btn.classList.toggle("active", isSelected);
    btn.setAttribute("aria-selected", String(isSelected));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const isMatch = panel.id === `panel-${target}`;
    panel.classList.toggle("active", isMatch);
    panel.hidden = !isMatch;
  });

  if (updateHash) {
    history.replaceState(null, "", `#${target}`);
  }
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab, true));
  });

  window.addEventListener("hashchange", () => {
    const hashTab = window.location.hash.replace("#", "");
    if (VALID_TABS.includes(hashTab)) {
      activateTab(hashTab, false);
    }
  });

  const initialHash = window.location.hash.replace("#", "");
  activateTab(initialHash, false);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("portfolio_lang") || "ca";
  setupTabs();
  setupLangSwitcher();
  loadLanguage(savedLang);
});