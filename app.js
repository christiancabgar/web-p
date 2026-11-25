(() => {
  const SUPPORTED_LANGS = ["ca", "es", "en"];
  const VALID_TABS = ["presentacio", "serveis", "galeria"];

  const state = {
    lang: localStorage.getItem("portfolio_lang") || "ca",
    tab: "presentacio",
    selectedEventId: null,
    data: null,
  };

  if (!SUPPORTED_LANGS.includes(state.lang)) {
    state.lang = "ca";
  }

  // Sincronización inicial con el hash de la URL (#presentacio, #serveis, #galeria)
  function getTabFromHash() {
    const hash = window.location.hash.replace("#", "").trim();
    return VALID_TABS.includes(hash) ? hash : "presentacio";
  }

  function setActiveTab(tabId, updateHash = true) {
    if (!VALID_TABS.includes(tabId)) return;
    state.tab = tabId;

    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `panel-${tabId}`);
    });

    if (updateHash && window.location.hash !== `#${tabId}`) {
      history.replaceState(null, "", `#${tabId}`);
    }
  }

  async function loadLanguageData(lang) {
    const banner = document.getElementById("status-banner");
    try {
      const response = await fetch(`data/${lang}.json`, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      state.data = await response.json();
      state.lang = lang;
      localStorage.setItem("portfolio_lang", lang);
      document.documentElement.lang = lang;
      banner.classList.add("hidden");
      renderAll();
    } catch (error) {
      console.error("Error carregant dades:", error);
      banner.textContent =
        "No s'han pogut carregar les dades. Si estàs en local, obre el projecte amb un servidor local (Live Server o python3 -m http.server).";
      banner.classList.remove("hidden");
    }
  }

  function renderAll() {
    const d = state.data;
    if (!d) return;

    // Título de la pestaña del navegador
    document.title = `${d.artist.name} | ${d.artist.subtitle}`;

    // Pestañas y selector de idioma
    document.getElementById("tab-btn-presentacio").textContent = d.nav.presentation;
    document.getElementById("tab-btn-serveis").textContent = d.nav.services;
    document.getElementById("tab-btn-galeria").textContent = d.nav.gallery;

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });

    renderPresentation(d.presentation);
    renderServices(d.services, d.contact);
    renderGallery(d.gallery);
    renderFooter(d.artist, d.contact);
  }

  function renderPresentation(pres) {
    document.getElementById("bio-eyebrow").textContent = pres.eyebrow;
    document.getElementById("bio-title").textContent = pres.title;

    const imgEl = document.getElementById("bio-image");
    const fallbackEl = document.getElementById("bio-image-fallback");
    fallbackEl.querySelector("span").textContent = pres.photoPlaceholder;

    if (pres.photoUrl) {
      imgEl.src = pres.photoUrl;
      imgEl.alt = pres.photoAlt || pres.title;
      imgEl.onload = () => {
        imgEl.classList.add("loaded");
        fallbackEl.style.display = "none";
      };
      imgEl.onerror = () => {
        imgEl.classList.remove("loaded");
        fallbackEl.style.display = "flex";
      };
    } else {
      imgEl.classList.remove("loaded");
      fallbackEl.style.display = "flex";
    }

    const specList = document.getElementById("bio-specialties");
    specList.innerHTML = "";
    pres.specialties.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      specList.appendChild(li);
    });

    const paragraphsContainer = document.getElementById("bio-paragraphs");
    paragraphsContainer.innerHTML = "";
    pres.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      paragraphsContainer.appendChild(p);
    });
  }

  function renderServices(services, contact) {
    document.getElementById("services-eyebrow").textContent = services.eyebrow;
    document.getElementById("services-title").textContent = services.title;
    document.getElementById("services-intro").textContent = services.intro;
    document.getElementById("services-footnote").textContent = services.footnote;

    const events = services.events || [];
    if (!events.length) return;

    if (!state.selectedEventId || !events.some((e) => e.id === state.selectedEventId)) {
      state.selectedEventId = events[0].id;
    }

    const selectorContainer = document.getElementById("event-selector");
    selectorContainer.innerHTML = "";

    events.forEach((ev) => {
      const btn = document.createElement("button");
      btn.className = "event-pill";
      btn.role = "tab";
      btn.textContent = ev.name;
      const isSelected = ev.id === state.selectedEventId;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
      btn.addEventListener("click", () => {
        state.selectedEventId = ev.id;
        renderServices(services, contact);
      });
      selectorContainer.appendChild(btn);
    });

    const activeEvent = events.find((e) => e.id === state.selectedEventId);
    document.getElementById("event-context-title").textContent = activeEvent.name;
    document.getElementById("event-context-desc").textContent = activeEvent.description;

    const packsGrid = document.getElementById("packs-grid");
    packsGrid.innerHTML = "";

    activeEvent.packs.forEach((pack) => {
      const card = document.createElement("article");
      card.className = `pack-card${pack.featured ? " featured" : ""}`;

      const featuresHtml = pack.features.map((feat) => `<li>${escapeHtml(feat)}</li>`).join("");
      const messageText = encodeURIComponent(
        `${services.inquiryPrefix} ${activeEvent.name} (${pack.name})`
      );
      const whatsappHref = `https://wa.me/${contact.whatsappNumber}?text=${messageText}`;

      card.innerHTML = `
        <span class="pack-tier-tag">${escapeHtml(pack.tierLabel)}</span>
        <h3 class="pack-name">${escapeHtml(pack.name)}</h3>
        <div class="pack-price">${escapeHtml(pack.price)}</div>
        <p class="pack-summary">${escapeHtml(pack.summary)}</p>
        <ul class="pack-features">${featuresHtml}</ul>
        <a href="${whatsappHref}" target="_blank" rel="noopener noreferrer" class="pack-cta">
          ${escapeHtml(services.ctaLabel)}
        </a>
      `;

      packsGrid.appendChild(card);
    });
  }

  function renderGallery(gallery) {
    document.getElementById("gallery-eyebrow").textContent = gallery.eyebrow;
    document.getElementById("gallery-title").textContent = gallery.title;
    document.getElementById("gallery-intro").textContent = gallery.intro;

    const grid = document.getElementById("gallery-grid");
    grid.innerHTML = "";

    gallery.videos.forEach((video) => {
      const article = document.createElement("article");
      article.className = "video-card";

      article.innerHTML = `
        <div class="video-wrapper">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}"
            title="${escapeHtml(video.title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
        <div class="video-meta">
          <span class="video-tag">${escapeHtml(video.tag)}</span>
          <h3 class="video-title">${escapeHtml(video.title)}</h3>
          <p class="video-desc">${escapeHtml(video.description)}</p>
        </div>
      `;

      grid.appendChild(article);
    });
  }

  function renderFooter(artist, contact) {
    document.getElementById("footer-title").textContent = contact.title;
    document.getElementById("footer-subtitle").textContent = contact.subtitle;

    const waLink = document.getElementById("link-whatsapp");
    waLink.href = `https://wa.me/${contact.whatsappNumber}`;
    document.getElementById("label-whatsapp").textContent = contact.whatsappLabel;

    const igLink = document.getElementById("link-instagram");
    igLink.href = contact.instagramUrl;
    document.getElementById("label-instagram").textContent = contact.instagramLabel;

    const mailLink = document.getElementById("link-email");
    mailLink.href = `mailto:${contact.email}`;
    document.getElementById("label-email").textContent = contact.email;

    const year = new Date().getFullYear();
    document.getElementById("footer-copy").textContent = `© ${year} ${artist.name}. ${contact.rights}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  // Event listeners de navegación e idiomas
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetLang = btn.dataset.lang;
      if (targetLang !== state.lang) {
        loadLanguageData(targetLang);
      }
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveTab(getTabFromHash(), false);
  });

  // Inicialización
  setActiveTab(getTabFromHash(), false);
  loadLanguageData(state.lang);
})();