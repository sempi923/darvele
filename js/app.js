/**
 * ============================================================================
 * DARVELÉ — Lógica Principal de la Tienda Pública (app.js)
 * Especialidad: Velas Decorativas en Figura & Configurador 4 Pasos
 * Arquitectura: Leonardo | Programación: Donatello | UI: Raphael | Copy: Michelangelo
 * ============================================================================
 */

(function () {
  "use strict";

  // Estado global de la tienda
  let allProducts = [];
  let activeCategory = "Todas";
  let searchQuery = "";
  let cart = [];
  let currentModalProduct = null;
  let currentModalSelectedColor = "";

  //Mapa de color seleccionado por tarjeta en el catálogo: { [productId]: "Rosa" }
  const cardSelectedColorMap = {};

  // Estado del configurador "Arma tu detalle en 4 pasos 💛"
  const builderState = {
    currentStep: 1,
    typeName: "Vela Figura Graduación",
    typeShort: "Vela Graduación",
    typePrice: 25000,
    customIdea: "",
    primaryColor: "Rosa",
    secondaryColor: "Dorado",
    boxName: "Caja Transparente con Cinta",
    boxPrice: 0,
    hasCard: true,
    cardPrice: 2000,
    cardRecipient: "",
    cardMessage: "",
    clientName: "",
    clientCity: ""
  };

  /* --------------------------------------------------------------------------
     INICIALIZACIÓN Y SINCRONIZACIÓN ENTRE PESTAÑAS
     -------------------------------------------------------------------------- */
  function refreshStoreFromStorage() {
    allProducts = getStoredProducts().filter((p) => p.activo !== false);
    renderCatalog();
  }

  document.addEventListener("DOMContentLoaded", () => {
    allProducts = getStoredProducts().filter((p) => p.activo !== false);
    loadCartFromStorage();
    renderCategoryPills();
    renderCatalog();
    updateCartUI();
    initHeaderAndSearch();
    initModalEvents();
    initBuilderSection();
    initCartEvents();
    initScrollAnimations();
    initFloatingWhatsApp();

    // Sincronización automática cuando cambia localStorage en admin.html u otra pestaña
    window.addEventListener("storage", (e) => {
      if (!e.key || e.key === STORAGE_KEY_PRODUCTS) {
        refreshStoreFromStorage();
      }
      if (!e.key || e.key === STORAGE_KEY_CART) {
        loadCartFromStorage();
        updateCartUI();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshStoreFromStorage();
      }
    });
  });

  /* --------------------------------------------------------------------------
     CATEGORÍAS Y CATÁLOGO CON COLORES DISPONIBLES
     -------------------------------------------------------------------------- */
  function renderCategoryPills() {
    const container = document.getElementById("categories-container");
    if (!container) return;

    container.innerHTML = DARVELE_CATEGORIES.map((cat) => {
      const isActive = cat === activeCategory ? "active" : "";
      return `<button type="button" class="category-pill ${isActive}" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`;
    }).join("");

    container.querySelectorAll(".category-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.getAttribute("data-category");
        renderCategoryPills();
        renderCatalog();
      });
    });
  }

  function getProductFigura(prod) {
    return prod.figura || prod.categoria || "Figura en cera";
  }

  function getProductIncluye(prod) {
    return prod.incluye || prod.duracion || "Caja, cinta y tarjeta personalizada";
  }

  function getProductColors(prod) {
    if (!prod || !Array.isArray(prod.colores)) return [];
    return prod.colores.filter((c) => typeof c === "string" && c.trim().length > 0);
  }

  function getFilteredProducts() {
    return allProducts.filter((prod) => {
      const matchesCategory =
        activeCategory === "Todas" ||
        prod.categoria === activeCategory ||
        (Array.isArray(prod.tags) && prod.tags.includes(activeCategory)) ||
        (activeCategory === "Personalizadas" && prod.personalizable);

      const q = searchQuery.trim().toLowerCase();
      const figuraText = getProductFigura(prod).toLowerCase();
      const incluyeText = getProductIncluye(prod).toLowerCase();
      const colorsText = getProductColors(prod).join(" ").toLowerCase();

      const matchesSearch =
        !q ||
        (prod.nombre && prod.nombre.toLowerCase().includes(q)) ||
        figuraText.includes(q) ||
        incluyeText.includes(q) ||
        colorsText.includes(q) ||
        (prod.categoria && prod.categoria.toLowerCase().includes(q)) ||
        (prod.descripcionCorta && prod.descripcionCorta.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }

  function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-catalog-box">
          <h3 class="serif" style="font-size:1.5rem; margin-bottom:0.5rem;">No encontramos figuras con ese filtro</h3>
          <p style="color:var(--text-dark-muted); margin-bottom:1.25rem;">Prueba buscando por graduación, pesebre, bautizo, cumpleaños o explora toda la colección.</p>
          <button type="button" class="btn btn-gold" id="reset-filters-btn">Ver toda la colección</button>
        </div>
      `;
      const resetBtn = document.getElementById("reset-filters-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          activeCategory = "Todas";
          searchQuery = "";
          const searchInput = document.getElementById("header-search");
          if (searchInput) searchInput.value = "";
          renderCategoryPills();
          renderCatalog();
        });
      }
      return;
    }

    grid.innerHTML = filtered
      .map((prod) => {
        const hasOffer = prod.precioOferta && Number(prod.precioOferta) < Number(prod.precio);
        const effectivePrice = hasOffer ? Number(prod.precioOferta) : Number(prod.precio);

        let badgeClass = "badge-new";
        let badgeText = prod.badge || "";
        if (hasOffer) {
          badgeText = "Oferta";
          badgeClass = "badge-sale";
        } else if (prod.destacado || badgeText.toLowerCase().includes("vendido")) {
          badgeText = badgeText || "Más vendido";
          badgeClass = "badge-featured";
        }

        const starsCount = Math.min(5, Math.max(1, Number(prod.estrellas) || 5));
        const starsHtml = "★".repeat(starsCount);
        const safeId = escapeHTML(prod.id);
        const safeNombre = escapeHTML(prod.nombre);
        const safeImagen = escapeHTML(prod.imagen);
        const safeIncluye = escapeHTML(getProductIncluye(prod));
        const safeDescCorta = escapeHTML(prod.descripcionCorta || "");
        const safeBadgeText = escapeHTML(badgeText);

        // Colores disponibles de la vela (debajo del precio)
        const prodColors = getProductColors(prod);
        if (prodColors.length > 0 && !cardSelectedColorMap[prod.id]) {
          cardSelectedColorMap[prod.id] = prodColors[0];
        }
        const selectedColor = cardSelectedColorMap[prod.id] || "";

        const colorsHtml =
          prodColors.length > 0
            ? `
              <div class="product-colors-wrap" data-color-group="${safeId}">
                <span class="product-colors-label">Colores disponibles: <strong data-color-label="${safeId}">${escapeHTML(selectedColor)}</strong></span>
                <div class="product-color-dots">
                  ${prodColors
                    .map((cName) => {
                      const hex = getCandleColorHex(cName);
                      const isSel = cName === selectedColor ? "selected" : "";
                      return `<button type="button" class="color-dot-btn ${isSel}" style="background-color:${hex};" data-card-color-pick="${safeId}" data-color-name="${escapeHTML(cName)}" title="${escapeHTML(cName)}" aria-label="Color ${escapeHTML(cName)}"></button>`;
                    })
                    .join("")}
                </div>
              </div>
            `
            : "";

        return `
          <article class="product-card fade-up visible" data-id="${safeId}">
            <div class="product-image-wrap" data-action="detail" data-id="${safeId}">
              <div class="product-badges">
                ${safeBadgeText ? `<span class="badge-tag ${badgeClass}">${safeBadgeText}</span>` : ""}
              </div>
              <img src="${safeImagen}" alt="${safeNombre} - DARVELÉ Velas Decorativas en Figura" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85'">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-aroma">Incluye: ${safeIncluye}</span>
                <span class="product-stars" aria-label="Calificación 5 de 5">${starsHtml}</span>
              </div>
              <h3 class="product-title" data-action="detail" data-id="${safeId}">${safeNombre}</h3>
              <p class="product-short-desc">${safeDescCorta}</p>
              <div class="product-price-row">
                <span class="price-current">${formatCOP(effectivePrice)}</span>
                ${hasOffer ? `<span class="price-old">${formatCOP(prod.precio)}</span>` : ""}
              </div>
              ${colorsHtml}
              <div class="product-actions">
                <button type="button" class="btn-card-detail" data-action="detail" data-id="${safeId}">Ver detalle</button>
                <button type="button" class="btn-card-add" data-action="quick-add" data-id="${safeId}">
                  <span>+ Agregar</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Eventos de selección de color en la tarjeta del producto
    grid.querySelectorAll("[data-card-color-pick]").forEach((dotBtn) => {
      dotBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const prodId = dotBtn.getAttribute("data-card-color-pick");
        const colorName = dotBtn.getAttribute("data-color-name");
        cardSelectedColorMap[prodId] = colorName;

        const group = grid.querySelector(`[data-color-group="${prodId}"]`);
        if (group) {
          group.querySelectorAll(".color-dot-btn").forEach((b) => b.classList.remove("selected"));
          dotBtn.classList.add("selected");
          const labelStrong = group.querySelector(`[data-color-label="${prodId}"]`);
          if (labelStrong) labelStrong.textContent = colorName;
        }
      });
    });

    // Eventos en tarjetas (Ver detalle y Agregar)
    grid.querySelectorAll("[data-action='detail']").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        openProductModal(id);
      });
    });

    grid.querySelectorAll("[data-action='quick-add']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const prod = allProducts.find((p) => String(p.id) === String(id));
        if (prod) {
          const chosenColor = cardSelectedColorMap[prod.id] || (getProductColors(prod)[0] || "");
          const colorNote = chosenColor ? `Color: ${chosenColor}` : null;
          addToCart(prod, 1, colorNote, chosenColor);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     HEADER, NAVEGACIÓN MÓVIL Y BUSCADOR
     -------------------------------------------------------------------------- */
  function initHeaderAndSearch() {
    const searchInput = document.getElementById("header-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderCatalog();
        const tiendaSection = document.getElementById("tienda");
        if (searchQuery.trim().length === 1 && tiendaSection) {
          tiendaSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    const mobileBtn = document.getElementById("mobile-menu-toggle");
    const mobileDrawer = document.getElementById("mobile-nav-drawer");
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener("click", () => {
        mobileDrawer.classList.toggle("open");
      });

      mobileDrawer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileDrawer.classList.remove("open");
        });
      });
    }
  }

  /* --------------------------------------------------------------------------
     MODAL DE DETALLE DE PRODUCTO (CON CIRCULITOS DE COLOR)
     -------------------------------------------------------------------------- */
  function openProductModal(productId) {
    const prod = allProducts.find((p) => String(p.id) === String(productId));
    if (!prod) return;

    currentModalProduct = prod;
    const modalBackdrop = document.getElementById("product-modal-backdrop");
    if (!modalBackdrop) return;

    const hasOffer = prod.precioOferta && Number(prod.precioOferta) < Number(prod.precio);
    const effectivePrice = hasOffer ? Number(prod.precioOferta) : Number(prod.precio);

    document.getElementById("modal-category").textContent = prod.categoria;
    document.getElementById("modal-title").textContent = prod.nombre;
    document.getElementById("modal-price").innerHTML = `
      <span class="price-current">${formatCOP(effectivePrice)}</span>
      ${hasOffer ? `<span class="price-old" style="margin-left:0.6rem;">${formatCOP(prod.precio)}</span>` : ""}
    `;
    document.getElementById("modal-description").textContent =
      prod.descripcionLarga || prod.descripcionCorta || "";

    const specFiguraEl = document.getElementById("modal-spec-figura");
    const specIncluyeEl = document.getElementById("modal-spec-incluye");
    const specAcabadoEl = document.getElementById("modal-spec-acabado");

    if (specFiguraEl) specFiguraEl.textContent = getProductFigura(prod);
    if (specIncluyeEl) specIncluyeEl.textContent = getProductIncluye(prod);
    if (specAcabadoEl) specAcabadoEl.textContent = prod.acabado || "Pintada a mano";

    // Renderizar circulitos de colores disponibles en el modal
    const modalColorsSection = document.getElementById("modal-colors-section");
    const modalColorsSwatches = document.getElementById("modal-colors-swatches");
    const modalColorNameEl = document.getElementById("modal-selected-color-name");
    const prodColors = getProductColors(prod);

    if (prodColors.length > 0 && modalColorsSection && modalColorsSwatches) {
      currentModalSelectedColor = cardSelectedColorMap[prod.id] || prodColors[0];
      modalColorsSection.style.display = "block";
      if (modalColorNameEl) modalColorNameEl.textContent = currentModalSelectedColor;

      modalColorsSwatches.innerHTML = prodColors
        .map((cName) => {
          const hex = getCandleColorHex(cName);
          const isSel = cName === currentModalSelectedColor ? "selected" : "";
          return `<button type="button" class="color-dot-btn ${isSel}" style="background-color:${hex};" data-modal-color="${escapeHTML(cName)}" title="${escapeHTML(cName)}" aria-label="Color ${escapeHTML(cName)}"></button>`;
        })
        .join("");

      modalColorsSwatches.querySelectorAll("[data-modal-color]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const chosen = btn.getAttribute("data-modal-color");
          currentModalSelectedColor = chosen;
          cardSelectedColorMap[prod.id] = chosen;
          if (modalColorNameEl) modalColorNameEl.textContent = chosen;
          modalColorsSwatches.querySelectorAll(".color-dot-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          renderCatalog();
        });
      });
    } else if (modalColorsSection) {
      currentModalSelectedColor = "";
      modalColorsSection.style.display = "none";
    }

    // Galería de imágenes
    const mainImg = document.getElementById("modal-main-image");
    const thumbsContainer = document.getElementById("modal-thumbnails");
    const gallery = Array.isArray(prod.galeria) && prod.galeria.length > 0 ? prod.galeria : [prod.imagen];

    mainImg.src = gallery[0];
    mainImg.alt = prod.nombre;

    thumbsContainer.innerHTML = gallery
      .map(
        (imgUrl, idx) => `
        <img src="${escapeHTML(imgUrl)}" alt="Vista ${idx + 1}" class="modal-thumb ${idx === 0 ? "active" : ""}" data-src="${escapeHTML(imgUrl)}">
      `
      )
      .join("");

    thumbsContainer.querySelectorAll(".modal-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImg.src = thumb.getAttribute("data-src");
        thumbsContainer.querySelectorAll(".modal-thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    // Resetear campos de personalización del modal
    document.getElementById("modal-box-color").value = "Caja Transparente con Cinta Dorada Champaña";
    document.getElementById("modal-card-message").value = "";
    document.getElementById("modal-dedication").value = "";
    document.getElementById("modal-qty-input").value = 1;

    modalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeProductModal() {
    const modalBackdrop = document.getElementById("product-modal-backdrop");
    if (modalBackdrop) {
      modalBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  function initModalEvents() {
    const modalBackdrop = document.getElementById("product-modal-backdrop");
    const closeBtn = document.getElementById("modal-close-btn");
    const qtyMinus = document.getElementById("modal-qty-minus");
    const qtyPlus = document.getElementById("modal-qty-plus");
    const qtyInput = document.getElementById("modal-qty-input");
    const addBtn = document.getElementById("modal-add-cart-btn");

    if (closeBtn) closeBtn.addEventListener("click", closeProductModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeProductModal();
      });
    }

    if (qtyMinus && qtyInput) {
      qtyMinus.addEventListener("click", () => {
        const val = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
        qtyInput.value = val;
      });
    }

    if (qtyPlus && qtyInput) {
      qtyPlus.addEventListener("click", () => {
        const val = Math.min(100, (parseInt(qtyInput.value, 10) || 1) + 1);
        qtyInput.value = val;
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (!currentModalProduct) return;
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        const boxColor = document.getElementById("modal-box-color").value;
        const cardMsg = document.getElementById("modal-card-message").value.trim();
        const dedication = document.getElementById("modal-dedication").value.trim();

        const customDetails = [];
        if (currentModalSelectedColor) customDetails.push(`Color: ${currentModalSelectedColor}`);
        if (boxColor) customDetails.push(`Empaque: ${boxColor}`);
        if (dedication) customDetails.push(`Personalización: "${dedication}"`);
        if (cardMsg) customDetails.push(`Tarjeta: "${cardMsg}"`);

        addToCart(currentModalProduct, qty, customDetails.join(" | "), currentModalSelectedColor);
        closeProductModal();
      });
    }
  }

  /* --------------------------------------------------------------------------
     SECCIÓN 7: CONFIGURADOR "ARMA TU DETALLE EN 4 PASOS 💛"
     -------------------------------------------------------------------------- */
  function initBuilderSection() {
    const form = document.getElementById("custom-builder-form");
    if (!form) return;

    const stepPanels = document.querySelectorAll("[data-step-panel]");
    const stepToggles = document.querySelectorAll("[data-step-toggle]");
    const stepTabs = document.querySelectorAll("[data-goto-step]");
    const nextStepBtns = document.querySelectorAll("[data-next-step]");
    const prevStepBtns = document.querySelectorAll("[data-prev-step]");
    const progressLabel = document.getElementById("builder-progress-label");
    const progressStepName = document.getElementById("builder-progress-step-name");
    const progressFill = document.getElementById("builder-progress-fill");

    const stepNames = {
      1: "1. Tipo de Vela",
      2: "2. Color de la Vela",
      3: "3. Empaque",
      4: "4. Tarjeta Personalizada"
    };

    function goToBuilderStep(stepNum) {
      const n = Math.min(4, Math.max(1, Number(stepNum) || 1));
      builderState.currentStep = n;

      stepPanels.forEach((panel) => {
        const pStep = Number(panel.getAttribute("data-step-panel"));
        panel.classList.toggle("open", pStep === n);
      });

      stepTabs.forEach((tab) => {
        const tStep = Number(tab.getAttribute("data-goto-step"));
        tab.classList.toggle("active", tStep === n);
      });

      if (progressLabel) progressLabel.textContent = `Paso ${n} de 4`;
      if (progressStepName) progressStepName.textContent = stepNames[n] || "";
      if (progressFill) progressFill.style.width = `${n * 25}%`;
    }

    stepToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetStep = Number(btn.getAttribute("data-step-toggle"));
        goToBuilderStep(targetStep);
      });
    });

    stepTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetStep = Number(tab.getAttribute("data-goto-step"));
        goToBuilderStep(targetStep);
      });
    });

    nextStepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = Number(btn.getAttribute("data-next-step"));
        goToBuilderStep(next);
      });
    });

    prevStepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const prev = Number(btn.getAttribute("data-prev-step"));
        goToBuilderStep(prev);
      });
    });

    // Renderizar los 15 colores oficiales en Paso 2 (Principal y Secundario)
    const primaryColorsContainer = document.getElementById("builder-primary-colors");
    const secondaryColorsContainer = document.getElementById("builder-secondary-colors");
    const clearSecBtn = document.getElementById("builder-clear-secondary-color");

    function renderBuilderColorSwatches() {
      if (primaryColorsContainer) {
        primaryColorsContainer.innerHTML = DARVELE_CANDLE_COLORS.map((c) => {
          const isSel = c.nombre === builderState.primaryColor ? "selected" : "";
          return `
            <button type="button" class="builder-swatch-btn ${isSel}" data-primary-color="${escapeHTML(c.nombre)}">
              <span class="builder-swatch-circle" style="background-color:${c.hex};"></span>
              <span>${escapeHTML(c.nombre)}</span>
            </button>
          `;
        }).join("");

        primaryColorsContainer.querySelectorAll("[data-primary-color]").forEach((btn) => {
          btn.addEventListener("click", () => {
            builderState.primaryColor = btn.getAttribute("data-primary-color");
            renderBuilderColorSwatches();
            updateBuilderDisplay();
          });
        });
      }

      if (secondaryColorsContainer) {
        secondaryColorsContainer.innerHTML = DARVELE_CANDLE_COLORS.map((c) => {
          const isSel = c.nombre === builderState.secondaryColor ? "selected" : "";
          return `
            <button type="button" class="builder-swatch-btn ${isSel}" data-secondary-color="${escapeHTML(c.nombre)}">
              <span class="builder-swatch-circle" style="background-color:${c.hex};"></span>
              <span>${escapeHTML(c.nombre)}</span>
            </button>
          `;
        }).join("");

        secondaryColorsContainer.querySelectorAll("[data-secondary-color]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const clicked = btn.getAttribute("data-secondary-color");
            builderState.secondaryColor = builderState.secondaryColor === clicked ? "" : clicked;
            renderBuilderColorSwatches();
            updateBuilderDisplay();
          });
        });
      }
    }

    if (clearSecBtn) {
      clearSecBtn.addEventListener("click", () => {
        builderState.secondaryColor = "";
        renderBuilderColorSwatches();
        updateBuilderDisplay();
      });
    }

    // Paso 1: Tarjetas de Tipo de Vela
    const typeCards = document.querySelectorAll("[data-builder-type]");
    const customIdeaWrap = document.getElementById("builder-custom-idea-wrap");
    const customIdeaInput = document.getElementById("builder-custom-idea");

    typeCards.forEach((card) => {
      card.addEventListener("click", () => {
        typeCards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        builderState.typeName = card.getAttribute("data-name");
        builderState.typeShort = card.getAttribute("data-short") || builderState.typeName;
        builderState.typePrice = Number(card.getAttribute("data-price")) || 25000;

        if (customIdeaWrap) {
          customIdeaWrap.style.display = builderState.typeName.toLowerCase().includes("personalizada")
            ? "block"
            : "none";
        }
        updateBuilderDisplay();
      });
    });

    if (customIdeaInput) {
      customIdeaInput.addEventListener("input", () => {
        builderState.customIdea = customIdeaInput.value.trim();
        updateBuilderDisplay();
      });
    }

    // Paso 3: Tarjetas de Empaque
    const boxCards = document.querySelectorAll("[data-builder-box]");
    boxCards.forEach((card) => {
      card.addEventListener("click", () => {
        boxCards.forEach((b) => b.classList.remove("selected"));
        card.classList.add("selected");
        builderState.boxName = card.getAttribute("data-name");
        builderState.boxPrice = Number(card.getAttribute("data-price")) || 0;
        updateBuilderDisplay();
      });
    });

    // Paso 4: Tarjeta Personalizada (Con tarjeta +$2.000 vs Sin tarjeta $0)
    const cardChoices = document.querySelectorAll("[data-card-option]");
    const cardFieldsWrap = document.getElementById("builder-card-fields-wrap");
    const cardRecipientInput = document.getElementById("builder-card-recipient");
    const cardMessageInput = document.getElementById("builder-card-message");
    const cardCharCount = document.getElementById("builder-card-char-count");
    const livePreviewText = document.getElementById("live-card-preview-text");

    cardChoices.forEach((btn) => {
      btn.addEventListener("click", () => {
        cardChoices.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const opt = btn.getAttribute("data-card-option");
        builderState.hasCard = opt === "yes";
        builderState.cardPrice = builderState.hasCard ? 2000 : 0;
        if (cardFieldsWrap) {
          cardFieldsWrap.style.display = builderState.hasCard ? "grid" : "none";
        }
        updateBuilderDisplay();
      });
    });

    function updateLiveCardPreview() {
      const rec = cardRecipientInput ? cardRecipientInput.value.trim() : "";
      const msg = cardMessageInput ? cardMessageInput.value.trim() : "";
      builderState.cardRecipient = rec;
      builderState.cardMessage = msg;

      if (cardCharCount && cardMessageInput) {
        cardCharCount.textContent = `${cardMessageInput.value.length} / 120`;
      }

      if (livePreviewText) {
        const displayRec = rec || "María";
        const displayMsg = msg || "Feliz graduación, estamos orgullosos de ti";
        livePreviewText.textContent = `"Para: ${displayRec} - ${displayMsg}"`;
      }
      updateBuilderDisplay();
    }

    if (cardRecipientInput) cardRecipientInput.addEventListener("input", updateLiveCardPreview);
    if (cardMessageInput) cardMessageInput.addEventListener("input", updateLiveCardPreview);

    function getCombinedColorText() {
      if (builderState.secondaryColor) {
        return `${builderState.primaryColor} + ${builderState.secondaryColor}`;
      }
      return builderState.primaryColor;
    }

    function getBuilderTotal() {
      return builderState.typePrice + builderState.boxPrice + (builderState.hasCard ? builderState.cardPrice : 0);
    }

    function updateBuilderDisplay() {
      const total = getBuilderTotal();
      const combinedColors = getCombinedColorText();

      // Mini resúmenes en cabeceras del acordeón
      const s1 = document.getElementById("step1-summary-pill");
      const s2 = document.getElementById("step2-summary-pill");
      const s3 = document.getElementById("step3-summary-pill");
      const s4 = document.getElementById("step4-summary-pill");

      if (s1) s1.textContent = `${builderState.typeName} — ${formatCOP(builderState.typePrice)}`;
      if (s2) s2.textContent = `Elegiste: ${combinedColors}`;
      if (s3) {
        const boxCostLabel = builderState.boxPrice > 0 ? `+${formatCOP(builderState.boxPrice)}` : "Incluido $0";
        s3.textContent = `${builderState.boxName} (${boxCostLabel})`;
      }
      if (s4) {
        s4.textContent = builderState.hasCard
          ? `Con tarjeta personalizada (+${formatCOP(builderState.cardPrice)})`
          : "Sin tarjeta ($0)";
      }

      const colorBanner = document.getElementById("builder-chosen-color-banner");
      if (colorBanner) {
        colorBanner.innerHTML = `Elegiste: <strong>${escapeHTML(combinedColors)}</strong>`;
      }

      const breakdownEl = document.getElementById("builder-live-breakdown");
      if (breakdownEl) {
        const boxPriceStr = builderState.boxPrice > 0 ? `+${formatCOP(builderState.boxPrice)}` : "$0";
        const cardStr = builderState.hasCard
          ? `Con tarjeta (+${formatCOP(builderState.cardPrice)})`
          : "Sin tarjeta ($0)";
        breakdownEl.innerHTML =
          `<strong>Tipo:</strong> ${escapeHTML(builderState.typeName)} (${formatCOP(builderState.typePrice)}) &nbsp;+&nbsp; ` +
          `<strong>Color:</strong> ${escapeHTML(combinedColors)} &nbsp;+&nbsp; ` +
          `<strong>Empaque:</strong> ${escapeHTML(builderState.boxName)} (${boxPriceStr}) &nbsp;+&nbsp; ` +
          `<strong>Tarjeta:</strong> ${cardStr}`;
      }

      const totalEl = document.getElementById("builder-total-display");
      if (totalEl) totalEl.textContent = formatCOP(total);
    }

    // Botón "+ Sumar al Carrito" desde el configurador
    const addBuilderToCartBtn = document.getElementById("builder-add-cart-btn");
    if (addBuilderToCartBtn) {
      addBuilderToCartBtn.addEventListener("click", () => {
        const total = getBuilderTotal();
        const combinedColors = getCombinedColorText();
        const customProduct = {
          id: "custom_" + Date.now(),
          nombre: builderState.typeName,
          precio: total,
          precioOferta: null,
          imagen: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85"
        };

        const cardNote = builderState.hasCard
          ? `Tarjeta: Sí — Para: ${builderState.cardRecipient || "Por definir"} — Mensaje: "${builderState.cardMessage || "Por definir"}"`
          : "Tarjeta: No";

        const details = [
          `Color: ${combinedColors}`,
          `Empaque: ${builderState.boxName}${builderState.boxPrice > 0 ? ` (+${formatCOP(builderState.boxPrice)})` : ""}`,
          builderState.customIdea ? `Idea: "${builderState.customIdea}"` : null,
          cardNote
        ]
          .filter(Boolean)
          .join(" | ");

        addToCart(customProduct, 1, details, combinedColors);
        openCartDrawer();
      });
    }

    // Submit final: "Pedir este detalle por WhatsApp"
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const clientNameInput = document.getElementById("builder-client-name");
      const clientCityInput = document.getElementById("builder-client-city");
      const clientName = clientNameInput ? clientNameInput.value.trim() : "";
      const clientCity = clientCityInput ? clientCityInput.value.trim() : "";

      if (!clientName || !clientCity) {
        goToBuilderStep(4);
        showToast("Por favor escribe tu Nombre y Ciudad en el Paso 4 para enviarte por WhatsApp ✨", "error");
        if (!clientName && clientNameInput) clientNameInput.focus();
        else if (clientCityInput) clientCityInput.focus();
        return;
      }

      const total = getBuilderTotal();
      const combinedColors = getCombinedColorText();
      const boxExtraLabel =
        builderState.boxPrice > 0 ? ` (+${formatCOP(builderState.boxPrice)})` : " ($0)";

      const cardLine = builderState.hasCard
        ? `Sí - Para: ${builderState.cardRecipient || "Por confirmar"} - Mensaje: ${builderState.cardMessage || "Por confirmar"}`
        : "No ($0)";

      const ideaLine = builderState.customIdea ? `\n- Idea personalizada: ${builderState.customIdea}` : "";

      const rawMessage =
        `Hola DARVELÉ ✨ Quiero armar mi detalle:\n` +
        `- Tipo: ${builderState.typeShort}${ideaLine}\n` +
        `- Color: ${combinedColors}\n` +
        `- Empaque: ${builderState.boxName}${boxExtraLabel}\n` +
        `- Tarjeta: ${cardLine}\n` +
        `Total: ${formatCOP(total)}\n` +
        `Nombre: ${clientName}\n` +
        `Ciudad: ${clientCity}`;

      const waUrl = `https://wa.me/${CONFIG_WHATSAPP}?text=${encodeURIComponent(rawMessage)}`;
      showToast("Abriendo WhatsApp con tu detalle configurado... 💛");
      window.open(waUrl, "_blank", "noopener,noreferrer");
    });

    renderBuilderColorSwatches();
    updateBuilderDisplay();
  }

  /* --------------------------------------------------------------------------
     CARRITO Y CHECKOUT A WHATSAPP (CON COLOR SELECCIONADO Y VALIDACIÓN)
     -------------------------------------------------------------------------- */
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) {
        cart = [];
        return;
      }
      // Filtrar defensivamente precios <= 0 o cantidades <= 0
      cart = parsed
        .filter((item) => item && typeof item === "object" && Number(item.precio) > 0 && Number(item.cantidad) > 0)
        .map((item) => ({
          ...item,
          precio: Math.max(1000, Number(item.precio) || 18000),
          cantidad: Math.min(500, Math.max(1, Math.floor(Number(item.cantidad) || 1)))
        }));
    } catch (e) {
      cart = [];
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error("Error guardando carrito:", e);
    }
  }

  function addToCart(product, quantity, customNote, selectedColor) {
    const safeQty = Math.min(500, Math.max(1, Math.floor(Number(quantity) || 1)));
    const hasOffer = product.precioOferta && Number(product.precioOferta) < Number(product.precio);
    const rawUnitPrice = hasOffer ? Number(product.precioOferta) : Number(product.precio);
    if (!rawUnitPrice || rawUnitPrice <= 0) {
      showToast("Este producto no tiene un precio válido para agregar al carrito", "error");
      return;
    }

    const colorStr = selectedColor ? String(selectedColor).trim() : "";
    const noteStr = customNote ? String(customNote).trim() : "";
    const cartKey = `${product.id}__${colorStr}__${noteStr}`;

    const displayName =
      colorStr && !product.nombre.includes("Color:")
        ? `${product.nombre} - Color: ${colorStr}`
        : product.nombre;

    const existing = cart.find((item) => item.cartKey === cartKey);
    if (existing) {
      existing.cantidad = Math.min(500, existing.cantidad + safeQty);
    } else {
      cart.push({
        cartKey,
        id: product.id,
        nombreBase: product.nombre,
        nombre: displayName,
        color: colorStr,
        precio: rawUnitPrice,
        imagen: product.imagen,
        cantidad: safeQty,
        personalizacion: noteStr
      });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(`¡${displayName} se sumó a tu carrito!`);
  }

  function updateCartItemQty(cartKey, delta) {
    const idx = cart.findIndex((item) => item.cartKey === cartKey);
    if (idx === -1) return;

    const nextQty = cart[idx].cantidad + (Number(delta) || 0);
    if (nextQty <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].cantidad = Math.min(500, nextQty);
    }
    saveCartToStorage();
    updateCartUI();
  }

  function removeCartItem(cartKey) {
    cart = cart.filter((item) => item.cartKey !== cartKey);
    saveCartToStorage();
    updateCartUI();
    showToast("Producto eliminado del carrito");
  }

  function getCartTotals() {
    const subtotal = cart.reduce((acc, item) => {
      const price = Math.max(0, Number(item.precio) || 0);
      const qty = Math.max(1, Math.floor(Number(item.cantidad) || 1));
      return acc + price * qty;
    }, 0);
    const totalCount = cart.reduce((acc, item) => acc + Math.max(1, Math.floor(Number(item.cantidad) || 1)), 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    const total = subtotal + shipping;
    return { subtotal, totalCount, shipping, total };
  }

  function updateCartUI() {
    const { subtotal, totalCount, shipping, total } = getCartTotals();

    const countBadge = document.getElementById("header-cart-count");
    const headerTotal = document.getElementById("header-cart-total");
    if (countBadge) countBadge.textContent = totalCount;
    if (headerTotal) headerTotal.textContent = formatCOP(subtotal);

    const shippingBanner = document.getElementById("cart-shipping-banner");
    if (shippingBanner) {
      if (subtotal === 0) {
        shippingBanner.innerHTML = `Envío <strong>GRATIS</strong> a toda Colombia en pedidos desde <strong>${formatCOP(FREE_SHIPPING_THRESHOLD)}</strong>`;
      } else if (subtotal < FREE_SHIPPING_THRESHOLD) {
        const missing = FREE_SHIPPING_THRESHOLD - subtotal;
        shippingBanner.innerHTML = `Te faltan <strong>${formatCOP(missing)}</strong> para tener <strong> ¡ENVÍO GRATIS!</strong> ✨`;
      } else {
        shippingBanner.innerHTML = `🎉 ¡Felicidades! Tu pedido tiene <strong>ENVÍO GRATIS</strong> a toda Colombia`;
      }
    }

    const itemsContainer = document.getElementById("cart-items-list");
    const checkoutWrapper = document.getElementById("cart-checkout-section");

    if (!itemsContainer) return;

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem;">
          <p class="serif" style="font-size:1.3rem; margin-bottom:0.5rem;">Tu carrito aún está vacío 🕯️</p>
          <p style="font-size:0.9rem; color:var(--text-dark-muted); margin-bottom:1.5rem;">Elige una vela decorativa en figura o arma tu detalle personalizado en 4 pasos.</p>
        </div>
      `;
      if (checkoutWrapper) checkoutWrapper.style.display = "none";
    } else {
      if (checkoutWrapper) checkoutWrapper.style.display = "block";
      itemsContainer.innerHTML = cart
        .map(
          (item) => `
          <div class="cart-item">
            <img src="${escapeHTML(item.imagen)}" alt="${escapeHTML(item.nombre)}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=300&q=80'">
            <div class="cart-item-details">
              <div class="cart-item-title">${escapeHTML(item.nombre)}</div>
              ${item.personalizacion ? `<div class="cart-item-custom">${escapeHTML(item.personalizacion)}</div>` : ""}
              <div class="cart-item-price">${formatCOP(item.precio * item.cantidad)}</div>
              <div class="cart-item-controls">
                <div class="cart-qty-box">
                  <button type="button" data-cart-minus="${escapeHTML(item.cartKey)}" aria-label="Disminuir">−</button>
                  <span>${Number(item.cantidad) || 1}</span>
                  <button type="button" data-cart-plus="${escapeHTML(item.cartKey)}" aria-label="Aumentar">+</button>
                </div>
                <button type="button" class="cart-remove-btn" data-cart-remove="${escapeHTML(item.cartKey)}">Eliminar</button>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      itemsContainer.querySelectorAll("[data-cart-minus]").forEach((btn) => {
        btn.addEventListener("click", () => updateCartItemQty(btn.getAttribute("data-cart-minus"), -1));
      });
      itemsContainer.querySelectorAll("[data-cart-plus]").forEach((btn) => {
        btn.addEventListener("click", () => updateCartItemQty(btn.getAttribute("data-cart-plus"), 1));
      });
      itemsContainer.querySelectorAll("[data-cart-remove]").forEach((btn) => {
        btn.addEventListener("click", () => removeCartItem(btn.getAttribute("data-cart-remove")));
      });
    }

    const subEl = document.getElementById("cart-subtotal-val");
    const shipEl = document.getElementById("cart-shipping-val");
    const totEl = document.getElementById("cart-total-val");
    const waBtnText = document.getElementById("whatsapp-order-btn-text");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    if (subEl) subEl.textContent = formatCOP(subtotal);
    if (shipEl) shipEl.textContent = subtotal === 0 ? "$0" : shipping === 0 ? "Gratis" : formatCOP(shipping);
    if (totEl) totEl.textContent = formatCOP(total);
    if (waBtnText) waBtnText.textContent = `Pedir por WhatsApp - ${formatCOP(total)}`;
    if (clearCartBtn) clearCartBtn.style.display = cart.length > 0 ? "inline-flex" : "none";
  }

  function openCartDrawer() {
    document.getElementById("cart-backdrop")?.classList.add("open");
    document.getElementById("cart-drawer")?.classList.add("open");
    document.body.classList.add("drawer-open");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    document.getElementById("cart-backdrop")?.classList.remove("open");
    document.getElementById("cart-drawer")?.classList.remove("open");
    document.body.classList.remove("drawer-open");
    document.body.style.overflow = "";
  }

  function initCartEvents() {
    document.getElementById("open-cart-btn")?.addEventListener("click", openCartDrawer);
    document.getElementById("close-cart-btn")?.addEventListener("click", closeCartDrawer);
    document.getElementById("cart-backdrop")?.addEventListener("click", closeCartDrawer);

    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        cart = [];
        saveCartToStorage();
        updateCartUI();
        showToast("Carrito vaciado correctamente");
      });
    }

    const requiredFields = [
      { id: "chk-nombre", errId: "err-chk-nombre" },
      { id: "chk-ciudad", errId: "err-chk-ciudad" },
      { id: "chk-direccion", errId: "err-chk-direccion" },
      { id: "chk-celular", errId: "err-chk-celular" }
    ];

    requiredFields.forEach(({ id, errId }) => {
      const inputEl = document.getElementById(id);
      const errEl = document.getElementById(errId);
      if (inputEl) {
        inputEl.addEventListener("input", () => {
          if (inputEl.value.trim()) {
            inputEl.classList.remove("input-error");
            errEl?.classList.remove("visible");
          }
        });
      }
    });

    function handleWhatsAppOrder() {
      if (cart.length === 0) {
        showToast("Agrega al menos un producto al carrito antes de pedir ✨", "error");
        return;
      }

      let firstInvalidField = null;

      requiredFields.forEach(({ id, errId }) => {
        const inputEl = document.getElementById(id);
        const errEl = document.getElementById(errId);
        if (!inputEl) return;

        const val = inputEl.value.trim();
        if (!val) {
          inputEl.classList.add("input-error");
          errEl?.classList.add("visible");
          if (!firstInvalidField) firstInvalidField = inputEl;
        } else {
          inputEl.classList.remove("input-error");
          errEl?.classList.remove("visible");
        }
      });

      if (firstInvalidField) {
        showToast("Por favor completa los datos de envío marcados en rojo", "error");
        firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => firstInvalidField.focus(), 300);
        return;
      }

      const nombre = document.getElementById("chk-nombre").value.trim();
      const ciudad = document.getElementById("chk-ciudad").value.trim();
      const direccion = document.getElementById("chk-direccion").value.trim();
      const celular = document.getElementById("chk-celular").value.trim();
      const esRegalo = document.getElementById("chk-regalo").value;
      const mensaje = document.getElementById("chk-mensaje").value.trim();

      const { subtotal, shipping, total } = getCartTotals();

      const itemsLines = cart
        .map((item) => {
          const baseName = item.nombreBase || item.nombre.replace(/\s*-\s*Color:.*$/, "");
          const detailsPart = item.personalizacion
            ? ` (${item.personalizacion})`
            : item.color
            ? ` (Color: ${item.color})`
            : "";
          return `- ${item.cantidad}x ${baseName}${detailsPart} - ${formatCOP(item.precio * item.cantidad)}`;
        })
        .join("\n");

      const shippingText = shipping === 0 ? "Gratis" : formatCOP(shipping);

      const rawMessage =
        `Hola DARVELÉ ✨ quiero hacer un pedido:\n` +
        `${itemsLines}\n` +
        `Subtotal: ${formatCOP(subtotal)}\n` +
        `Envío: ${shippingText}\n` +
        `Total: ${formatCOP(total)}\n` +
        `---\n` +
        `Nombre: ${nombre}\n` +
        `Ciudad: ${ciudad}\n` +
        `Dirección: ${direccion}\n` +
        `Celular: ${celular}\n` +
        `¿Es regalo?: ${esRegalo}\n` +
        `Mensaje tarjeta: ${mensaje || "Sin mensaje"}`;

      const waUrl = `https://wa.me/${CONFIG_WHATSAPP}?text=${encodeURIComponent(rawMessage)}`;
      showToast("Abriendo WhatsApp con tu pedido... ✨");
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    const orderBtn = document.getElementById("whatsapp-order-btn");
    if (orderBtn) {
      orderBtn.addEventListener("click", handleWhatsAppOrder);
    }

    const checkoutForm = document.getElementById("whatsapp-checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleWhatsAppOrder();
      });
    }
  }

  /* --------------------------------------------------------------------------
     ANIMACIONES SCROLL, ATAJOS DE TECLADO (ESC) & WHATSAPP FLOTANTE
     -------------------------------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      closeCartDrawer();
      document.getElementById("mobile-nav-drawer")?.classList.remove("open");
    }
  });

  function initScrollAnimations() {
    const elements = document.querySelectorAll(".fade-up");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initFloatingWhatsApp() {
    const floatBtn = document.getElementById("whatsapp-floating-btn");
    if (floatBtn) {
      const msg = encodeURIComponent("Hola DARVELÉ, quiero información");
      floatBtn.href = `https://wa.me/${CONFIG_WHATSAPP}?text=${msg}`;
    }
  }
})();
