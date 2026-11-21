/**
 * ============================================================================
 * DARVELÉ — Lógica Principal de la Tienda Pública (app.js)
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

  // Estado del constructor "Arma tu detalle"
  const builderState = {
    candleName: "Vela Lavanda Relajante (220g)",
    candlePrice: 45000,
    boxName: "Caja Rígida Marfil & Lazo Dorado",
    boxPrice: 18000,
    recipient: "",
    message: ""
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

    // Sincronizar también al regresar a la pestaña de la tienda
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshStoreFromStorage();
      }
    });
  });

  /* --------------------------------------------------------------------------
     CATEGORÍAS Y CATÁLOGO
     -------------------------------------------------------------------------- */
  function renderCategoryPills() {
    const container = document.getElementById("categories-container");
    if (!container) return;

    container.innerHTML = DARVELE_CATEGORIES.map((cat) => {
      const isActive = cat === activeCategory ? "active" : "";
      return `<button type="button" class="category-pill ${isActive}" data-category="${cat}">${cat}</button>`;
    }).join("");

    container.querySelectorAll(".category-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.getAttribute("data-category");
        renderCategoryPills();
        renderCatalog();
      });
    });
  }

  function getFilteredProducts() {
    return allProducts.filter((prod) => {
      const matchesCategory =
        activeCategory === "Todas" ||
        prod.categoria === activeCategory ||
        (Array.isArray(prod.tags) && prod.tags.includes(activeCategory)) ||
        (activeCategory === "Personalizadas" && prod.personalizable);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        prod.nombre.toLowerCase().includes(q) ||
        (prod.aroma && prod.aroma.toLowerCase().includes(q)) ||
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
          <h3 class="serif" style="font-size:1.5rem; margin-bottom:0.5rem;">No encontramos velas con ese filtro</h3>
          <p style="color:var(--text-dark-muted); margin-bottom:1.25rem;">Prueba con otra palabra clave o explora todas nuestras creaciones artesanales.</p>
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

        const starsCount = Number(prod.estrellas) || 5;
        const starsHtml = "★".repeat(starsCount);

        return `
          <article class="product-card fade-up visible" data-id="${prod.id}">
            <div class="product-image-wrap" data-action="detail" data-id="${prod.id}">
              <div class="product-badges">
                ${badgeText ? `<span class="badge-tag ${badgeClass}">${badgeText}</span>` : ""}
              </div>
              <img src="${prod.imagen}" alt="${prod.nombre} - DARVELÉ Velas Artesanales" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85'">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-aroma">${prod.aroma || prod.categoria}</span>
                <span class="product-stars" aria-label="Calificación 5 de 5">${starsHtml}</span>
              </div>
              <h3 class="product-title" data-action="detail" data-id="${prod.id}">${prod.nombre}</h3>
              <p class="product-short-desc">${prod.descripcionCorta || ""}</p>
              <div class="product-price-row">
                <span class="price-current">${formatCOP(effectivePrice)}</span>
                ${hasOffer ? `<span class="price-old">${formatCOP(prod.precio)}</span>` : ""}
              </div>
              <div class="product-actions">
                <button type="button" class="btn-card-detail" data-action="detail" data-id="${prod.id}">Ver detalle</button>
                <button type="button" class="btn-card-add" data-action="quick-add" data-id="${prod.id}">
                  <span>+ Agregar</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Eventos en tarjetas
    grid.querySelectorAll("[data-action='detail']").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        openProductModal(id);
      });
    });

    grid.querySelectorAll("[data-action='quick-add']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const prod = allProducts.find((p) => p.id === id);
        if (prod) {
          addToCart(prod, 1, null);
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
     MODAL DE DETALLE DE PRODUCTO
     -------------------------------------------------------------------------- */
  function openProductModal(productId) {
    const prod = allProducts.find((p) => p.id === productId);
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
    document.getElementById("modal-spec-aroma").textContent = prod.aroma || "Aroma de autor";
    document.getElementById("modal-spec-duration").textContent = prod.duracion || "35 horas";
    document.getElementById("modal-spec-intensity").textContent = prod.intensidad || "Media / Alta";

    // Galería de imágenes
    const mainImg = document.getElementById("modal-main-image");
    const thumbsContainer = document.getElementById("modal-thumbnails");
    const gallery = Array.isArray(prod.galeria) && prod.galeria.length > 0 ? prod.galeria : [prod.imagen];

    mainImg.src = gallery[0];
    mainImg.alt = prod.nombre;

    thumbsContainer.innerHTML = gallery
      .map(
        (imgUrl, idx) => `
        <img src="${imgUrl}" alt="Vista ${idx + 1}" class="modal-thumb ${idx === 0 ? "active" : ""}" data-src="${imgUrl}">
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
    document.getElementById("modal-box-color").value = "Marfil Imperial con Lazo Champaña";
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
        const val = Math.min(50, (parseInt(qtyInput.value, 10) || 1) + 1);
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
        if (boxColor) customDetails.push(`Caja: ${boxColor}`);
        if (dedication) customDetails.push(`Etiqueta: "${dedication}"`);
        if (cardMsg) customDetails.push(`Tarjeta: "${cardMsg}"`);

        addToCart(currentModalProduct, qty, customDetails.join(" | "));
        closeProductModal();
      });
    }
  }

  /* --------------------------------------------------------------------------
     SECCIÓN 7: "ARMA TU DETALLE" PASO A PASO
     -------------------------------------------------------------------------- */
  function initBuilderSection() {
    const candleCards = document.querySelectorAll("[data-builder-candle]");
    const boxCards = document.querySelectorAll("[data-builder-box]");
    const totalEl = document.getElementById("builder-total-display");
    const summaryTextEl = document.getElementById("builder-summary-text");
    const form = document.getElementById("custom-builder-form");

    function updateBuilderDisplay() {
      const total = builderState.candlePrice + builderState.boxPrice;
      if (totalEl) totalEl.textContent = formatCOP(total);
      if (summaryTextEl) {
        summaryTextEl.textContent = `${builderState.candleName} + ${builderState.boxName}`;
      }
    }

    candleCards.forEach((card) => {
      card.addEventListener("click", () => {
        candleCards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        builderState.candleName = card.getAttribute("data-name");
        builderState.candlePrice = Number(card.getAttribute("data-price")) || 45000;
        updateBuilderDisplay();
      });
    });

    boxCards.forEach((card) => {
      card.addEventListener("click", () => {
        boxCards.forEach((b) => b.classList.remove("selected"));
        card.classList.add("selected");
        builderState.boxName = card.getAttribute("data-name");
        builderState.boxPrice = Number(card.getAttribute("data-price")) || 18000;
        updateBuilderDisplay();
      });
    });

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const recipient = document.getElementById("builder-recipient").value.trim();
        const message = document.getElementById("builder-message").value.trim();

        if (!message) {
          showToast("Por favor escribe el mensaje especial para la tarjeta ✨", "error");
          document.getElementById("builder-message").focus();
          return;
        }

        const total = builderState.candlePrice + builderState.boxPrice;
        const customProduct = {
          id: "custom-" + Date.now(),
          nombre: `Detalle Personalizado DARVELÉ`,
          precio: total,
          precioOferta: null,
          imagen: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85"
        };

        const details = [
          `Vela: ${builderState.candleName}`,
          `Empaque: ${builderState.boxName}`,
          recipient ? `Para: ${recipient}` : null,
          `Mensaje: "${message}"`
        ]
          .filter(Boolean)
          .join(" | ");

        addToCart(customProduct, 1, details);
        form.reset();
        openCartDrawer();
      });
    }

    updateBuilderDisplay();
  }

  /* --------------------------------------------------------------------------
     CARRITO Y CHECKOUT A WHATSAPP
     -------------------------------------------------------------------------- */
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      cart = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(cart)) cart = [];
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

  function addToCart(product, quantity, customNote) {
    const hasOffer = product.precioOferta && Number(product.precioOferta) < Number(product.precio);
    const unitPrice = hasOffer ? Number(product.precioOferta) : Number(product.precio);
    const cartKey = `${product.id}__${customNote || ""}`;

    const existing = cart.find((item) => item.cartKey === cartKey);
    if (existing) {
      existing.cantidad += quantity;
    } else {
      cart.push({
        cartKey,
        id: product.id,
        nombre: product.nombre,
        precio: unitPrice,
        imagen: product.imagen,
        cantidad: quantity,
        personalizacion: customNote || ""
      });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(`¡${product.nombre} se sumó a tu carrito!`);
  }

  function updateCartItemQty(cartKey, delta) {
    const idx = cart.findIndex((item) => item.cartKey === cartKey);
    if (idx === -1) return;

    cart[idx].cantidad += delta;
    if (cart[idx].cantidad <= 0) {
      cart.splice(idx, 1);
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
    const subtotal = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const totalCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    const total = subtotal + shipping;
    return { subtotal, totalCount, shipping, total };
  }

  function updateCartUI() {
    const { subtotal, totalCount, shipping, total } = getCartTotals();

    // Header badge & total
    const countBadge = document.getElementById("header-cart-count");
    const headerTotal = document.getElementById("header-cart-total");
    if (countBadge) countBadge.textContent = totalCount;
    if (headerTotal) headerTotal.textContent = formatCOP(subtotal);

    // Banner envío gratis
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

    // Lista de items
    const itemsContainer = document.getElementById("cart-items-list");
    const checkoutWrapper = document.getElementById("cart-checkout-section");

    if (!itemsContainer) return;

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem;">
          <p class="serif" style="font-size:1.3rem; margin-bottom:0.5rem;">Tu carrito aún está apagado 🕯️</p>
          <p style="font-size:0.9rem; color:var(--text-dark-muted); margin-bottom:1.5rem;">Elige una vela artesanal o arma un detalle inolvidable para iluminar a alguien especial.</p>
        </div>
      `;
      if (checkoutWrapper) checkoutWrapper.style.display = "none";
    } else {
      if (checkoutWrapper) checkoutWrapper.style.display = "block";
      itemsContainer.innerHTML = cart
        .map(
          (item) => `
          <div class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
            <div class="cart-item-details">
              <div class="cart-item-title">${item.nombre}</div>
              ${item.personalizacion ? `<div class="cart-item-custom">${item.personalizacion}</div>` : ""}
              <div class="cart-item-price">${formatCOP(item.precio * item.cantidad)}</div>
              <div class="cart-item-controls">
                <div class="cart-qty-box">
                  <button type="button" data-cart-minus="${item.cartKey}" aria-label="Disminuir">−</button>
                  <span>${item.cantidad}</span>
                  <button type="button" data-cart-plus="${item.cartKey}" aria-label="Aumentar">+</button>
                </div>
                <button type="button" class="cart-remove-btn" data-cart-remove="${item.cartKey}">Eliminar</button>
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

    // Totales en footer del drawer
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
          const customSuffix = item.personalizacion ? ` (${item.personalizacion})` : "";
          return `- ${item.cantidad}x ${item.nombre}${customSuffix} - ${formatCOP(item.precio * item.cantidad)}`;
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
     ANIMACIONES SCROLL & WHATSAPP FLOTANTE
     -------------------------------------------------------------------------- */
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
