/**
 * ============================================================================
 * DARVELÉ — Panel de Administración & Gestión de Inventario (admin.js)
 * Especialidad: Velas Decorativas en Figura & Detalles Hechos a Mano
 * Arquitectura: Leonardo | Lógica CRUD, Persistencia v2 & JSON: Donatello
 * ============================================================================
 */

const CONFIG_ADMIN_PASSWORD = "darvele2026";
const SESSION_AUTH_KEY = "darvele_admin_session";

(function () {
  "use strict";

  let products = [];
  let adminSearchQuery = "";
  let adminCategoryFilter = "Todas";
  let uploadedImageBase64 = "";

  document.addEventListener("DOMContentLoaded", () => {
    products = getStoredProducts();
    initAuthFlow();
    populateCategorySelects();
    initFormEvents();
    initFilterAndBackupEvents();
    renderAdminDashboard();

    // Sincronización en tiempo real entre pestañas usando "darvele_productos_v2"
    window.addEventListener("storage", (e) => {
      if (!e.key || e.key === STORAGE_KEY_PRODUCTS) {
        products = getStoredProducts();
        renderAdminDashboard();
      }
    });
  });

  /* --------------------------------------------------------------------------
     AUTENTICACIÓN CON CONTRASEÑA (darvele2026)
     -------------------------------------------------------------------------- */
  function initAuthFlow() {
    const loginScreen = document.getElementById("admin-login-screen");
    const appScreen = document.getElementById("admin-app-screen");
    const loginForm = document.getElementById("admin-login-form");
    const logoutBtn = document.getElementById("admin-logout-btn");

    const isAuthenticated = sessionStorage.getItem(SESSION_AUTH_KEY) === "true";

    if (isAuthenticated) {
      loginScreen.style.display = "none";
      appScreen.style.display = "block";
    } else {
      loginScreen.style.display = "flex";
      appScreen.style.display = "none";
    }

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const passInput = document.getElementById("admin-password-input");
        if (passInput.value === CONFIG_ADMIN_PASSWORD) {
          sessionStorage.setItem(SESSION_AUTH_KEY, "true");
          loginScreen.style.display = "none";
          appScreen.style.display = "block";
          products = getStoredProducts();
          showToast("Bienvenido al Panel Maestro de DARVELÉ ✨");
          renderAdminDashboard();
        } else {
          showToast("Contraseña incorrecta. Verifica tus credenciales.", "error");
          passInput.value = "";
          passInput.focus();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem(SESSION_AUTH_KEY);
        loginScreen.style.display = "flex";
        appScreen.style.display = "none";
        showToast("Sesión cerrada correctamente");
      });
    }
  }

  /* --------------------------------------------------------------------------
     SELECTS DE CATEGORÍAS
     -------------------------------------------------------------------------- */
  function populateCategorySelects() {
    const formCatSelect = document.getElementById("prod-categoria");
    const filterCatSelect = document.getElementById("admin-filter-category");

    const validCategories = DARVELE_CATEGORIES.filter((c) => c !== "Todas");

    if (formCatSelect) {
      formCatSelect.innerHTML = validCategories
        .map((cat) => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`)
        .join("");
    }

    if (filterCatSelect) {
      filterCatSelect.innerHTML = DARVELE_CATEGORIES.map(
        (cat) => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`
      ).join("");
    }
  }

  /* --------------------------------------------------------------------------
     COMPRESIÓN DE IMAGEN A BASE64 (Máx 800px con Canvas si supera 800KB)
     -------------------------------------------------------------------------- */
  function processImageFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
      reader.onload = (ev) => {
        const rawDataUrl = ev.target.result;
        if (file.size <= 800 * 1024) {
          resolve(rawDataUrl);
          return;
        }

        const img = new Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          const MAX_WIDTH = 800;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (targetWidth > MAX_WIDTH) {
            targetHeight = Math.round((targetHeight * MAX_WIDTH) / targetWidth);
            targetWidth = MAX_WIDTH;
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressedDataUrl);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  /* --------------------------------------------------------------------------
     DASHBOARD MÉTRICAS Y TABLA / TARJETAS CRUD
     -------------------------------------------------------------------------- */
  function renderAdminDashboard() {
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.activo !== false).length;
    const featuredCount = products.filter((p) => p.destacado === true).length;
    const totalInventoryValue = products.reduce((sum, p) => {
      const price =
        p.precioOferta && Number(p.precioOferta) < Number(p.precio)
          ? Number(p.precioOferta)
          : Number(p.precio);
      const stock = Number(p.stock) || 0;
      return sum + price * stock;
    }, 0);

    const totalEl = document.getElementById("stat-total-products");
    const activeEl = document.getElementById("stat-active-products");
    const featEl = document.getElementById("stat-featured-products");
    const valEl = document.getElementById("stat-inventory-value");

    if (totalEl) totalEl.textContent = totalCount;
    if (activeEl) activeEl.textContent = activeCount;
    if (featEl) featEl.textContent = featuredCount;
    if (valEl) valEl.textContent = formatCOP(totalInventoryValue);

    renderProductsTable();
  }

  function getFigura(p) {
    return p.figura || p.categoria || "Figura decorativa";
  }

  function getIncluye(p) {
    return p.incluye || p.duracion || "Caja, cinta y tarjeta";
  }

  function renderProductsTable() {
    const tbody = document.getElementById("admin-products-tbody");
    const mobileCardsContainer = document.getElementById("admin-products-mobile-cards");
    if (!tbody && !mobileCardsContainer) return;

    const filtered = products.filter((p) => {
      const matchesCat =
        adminCategoryFilter === "Todas" ||
        p.categoria === adminCategoryFilter ||
        (Array.isArray(p.tags) && p.tags.includes(adminCategoryFilter));

      const q = adminSearchQuery.trim().toLowerCase();
      const figuraText = getFigura(p).toLowerCase();
      const incluyeText = getIncluye(p).toLowerCase();

      const matchesQuery =
        !q ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        figuraText.includes(q) ||
        incluyeText.includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-dark-muted);">
              No hay productos que coincidan con la búsqueda actual.
            </td>
          </tr>
        `;
      }
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = `
          <div style="text-align:center; padding:2rem 1rem; color:var(--text-dark-muted); background:var(--bg-light); border-radius:12px;">
            No hay productos que coincidan con la búsqueda actual.
          </div>
        `;
      }
      return;
    }

    if (tbody) {
      tbody.innerHTML = filtered
        .map((p) => {
          const hasOffer = p.precioOferta && Number(p.precioOferta) < Number(p.precio);
          const isActive = p.activo !== false;
          const safeId = escapeHTML(p.id);
          const safeNombre = escapeHTML(p.nombre);
          const safeImagen = escapeHTML(p.imagen);
          const safeFigura = escapeHTML(getFigura(p));
          const safeIncluye = escapeHTML(getIncluye(p));
          const safeCategoria = escapeHTML(p.categoria);

          return `
            <tr>
              <td>
                <div class="admin-prod-cell">
                  <img src="${safeImagen}" alt="${safeNombre}" onerror="this.src='https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=300&q=80'">
                  <div>
                    <strong style="display:block; color:var(--bg-dark);">${safeNombre}</strong>
                    <span style="font-size:0.78rem; color:var(--text-dark-muted);">${safeFigura} • Incluye: ${safeIncluye}</span>
                  </div>
                </div>
              </td>
              <td>${safeCategoria}</td>
              <td>
                <strong>${formatCOP(hasOffer ? p.precioOferta : p.precio)}</strong>
                ${hasOffer ? `<div style="font-size:0.75rem; text-decoration:line-through; color:#999;">${formatCOP(p.precio)}</div>` : ""}
              </td>
              <td>${Number(p.stock) || 0} uds</td>
              <td>
                <span class="status-pill ${isActive ? "status-active" : "status-inactive"}">
                  ${isActive ? "Activo" : "Inactivo"}
                </span>
                ${p.destacado ? `<span class="status-pill" style="background:rgba(217,185,138,0.25); color:#8E6B3E; margin-left:4px;">★ Destacado</span>` : ""}
              </td>
              <td>
                <div class="admin-action-btns">
                  <button type="button" class="btn-xs" data-edit="${safeId}">Editar</button>
                  <button type="button" class="btn-xs" data-toggle-active="${safeId}">
                    ${isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button type="button" class="btn-xs" data-toggle-featured="${safeId}">
                    ${p.destacado ? "Quitar ★" : "Destacar ★"}
                  </button>
                  <button type="button" class="btn-xs" style="color:#C0392B; border-color:rgba(192,57,43,0.3);" data-delete="${safeId}">
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = filtered
        .map((p) => {
          const hasOffer = p.precioOferta && Number(p.precioOferta) < Number(p.precio);
          const isActive = p.activo !== false;
          const safeId = escapeHTML(p.id);
          const safeNombre = escapeHTML(p.nombre);
          const safeImagen = escapeHTML(p.imagen);
          const safeFigura = escapeHTML(getFigura(p));
          const safeIncluye = escapeHTML(getIncluye(p));
          const safeCategoria = escapeHTML(p.categoria);

          return `
            <article class="admin-prod-card">
              <div class="admin-prod-card-img-wrap">
                <img src="${safeImagen}" alt="${safeNombre}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=600&q=80'">
                <div class="admin-prod-card-badges">
                  <span class="status-pill ${isActive ? "status-active" : "status-inactive"}" style="background:${isActive ? "#1E8449" : "#C0392B"}; color:#FFF;">
                    ${isActive ? "Activo" : "Inactivo"}
                  </span>
                  ${p.destacado ? `<span class="status-pill" style="background:var(--bg-dark); color:var(--gold); border:1px solid var(--gold);">★ Destacado</span>` : ""}
                </div>
              </div>
              <div class="admin-prod-card-body">
                <span class="admin-prod-card-cat">${safeCategoria}</span>
                <h3 class="admin-prod-card-title">${safeNombre}</h3>
                <div class="admin-prod-card-meta">${safeFigura} • Incluye: ${safeIncluye}</div>

                <div class="admin-prod-card-price-stock">
                  <div>
                    <strong style="font-size:1.15rem; color:var(--bg-dark);">${formatCOP(hasOffer ? p.precioOferta : p.precio)}</strong>
                    ${hasOffer ? `<span style="font-size:0.82rem; text-decoration:line-through; color:#888; margin-left:6px;">${formatCOP(p.precio)}</span>` : ""}
                  </div>
                  <span style="font-size:0.88rem; font-weight:600; color:var(--text-dark-muted);">Stock: ${Number(p.stock) || 0} uds</span>
                </div>

                <div class="admin-prod-card-actions">
                  <button type="button" class="btn-admin-card btn-edit-primary" data-edit="${safeId}">
                    ✎ Editar Producto
                  </button>
                  <button type="button" class="btn-admin-card" data-toggle-active="${safeId}">
                    ${isActive ? "Desactivar Producto" : "Activar Producto"}
                  </button>
                  <button type="button" class="btn-admin-card" data-toggle-featured="${safeId}">
                    ${p.destacado ? "Quitar de Destacados ★" : "Marcar Destacado ★"}
                  </button>
                  <button type="button" class="btn-admin-card btn-delete-danger" data-delete="${safeId}">
                    🗑 Eliminar Producto
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    // Bind botones en tabla y tarjetas móviles
    document.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => loadProductIntoForm(btn.getAttribute("data-edit")));
    });

    document.querySelectorAll("[data-toggle-active]").forEach((btn) => {
      btn.addEventListener("click", () => toggleProductActive(btn.getAttribute("data-toggle-active")));
    });

    document.querySelectorAll("[data-toggle-featured]").forEach((btn) => {
      btn.addEventListener("click", () => toggleProductFeatured(btn.getAttribute("data-toggle-featured")));
    });

    document.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => eliminarProducto(btn.getAttribute("data-delete")));
    });
  }

  let idSequence = 0;

  function generateUniqueProductId() {
    idSequence = (idSequence + 1) % 1000;
    return "prod_" + Date.now() + (idSequence > 1 ? "_" + idSequence : "");
  }

  /* --------------------------------------------------------------------------
     FUNCIONES OBLIGATORIAS CRUD: crearProducto, editarProducto, eliminarProducto
     -------------------------------------------------------------------------- */
  function crearProducto(productData) {
    const uniqueId = generateUniqueProductId();
    const newProd = {
      id: uniqueId,
      nombre: productData.nombre,
      precio: productData.precio,
      precioOferta: productData.precioOferta,
      categoria: productData.categoria,
      tags: [productData.categoria],
      figura: productData.figura,
      incluye: productData.incluye,
      acabado: "Pintada a mano",
      descripcionCorta: productData.descripcionCorta,
      descripcionLarga: productData.descripcionLarga || productData.descripcionCorta,
      stock: productData.stock,
      imagen: productData.imagen,
      galeria: [productData.imagen],
      personalizable: productData.personalizable,
      destacado: productData.destacado,
      activo: true,
      badge: productData.badge,
      estrellas: 5
    };

    products.push(newProd);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    showToast("Producto guardado ✅");
    resetProductForm();
    renderAdminDashboard();
  }

  function editarProducto(id, productData) {
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) {
      showToast("No se encontró el producto a editar", "error");
      return;
    }

    products[idx] = {
      ...products[idx],
      nombre: productData.nombre,
      precio: productData.precio,
      precioOferta: productData.precioOferta,
      categoria: productData.categoria,
      tags: [productData.categoria],
      figura: productData.figura,
      incluye: productData.incluye,
      descripcionCorta: productData.descripcionCorta,
      descripcionLarga: productData.descripcionLarga || productData.descripcionCorta,
      stock: productData.stock,
      imagen: productData.imagen,
      galeria: [productData.imagen],
      personalizable: productData.personalizable,
      destacado: productData.destacado,
      badge: productData.badge
    };

    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    showToast("Producto guardado ✅");
    resetProductForm();
    renderAdminDashboard();
  }

  function eliminarProducto(id) {
    const prod = products.find((p) => String(p.id) === String(id));
    if (!prod) return;

    const confirmed = window.confirm(`¿Estás seguro de eliminar "${prod.nombre}" del catálogo?`);
    if (!confirmed) return;

    products = products.filter((p) => String(p.id) !== String(id));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    renderAdminDashboard();
    showToast(`"${prod.nombre}" eliminado correctamente ✅`);
  }

  function toggleProductActive(id) {
    const prod = products.find((p) => String(p.id) === String(id));
    if (!prod) return;
    prod.activo = prod.activo === false ? true : false;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    renderAdminDashboard();
    showToast(`"${prod.nombre}" ahora está ${prod.activo ? "Activo ✅" : "Inactivo"}`);
  }

  function toggleProductFeatured(id) {
    const prod = products.find((p) => String(p.id) === String(id));
    if (!prod) return;
    prod.destacado = !prod.destacado;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    renderAdminDashboard();
    showToast(
      prod.destacado
        ? `"${prod.nombre}" marcado como Destacado ★`
        : `"${prod.nombre}" removido de Destacados`
    );
  }

  // Exponer funciones principales en window para pruebas o consola
  window.crearProducto = crearProducto;
  window.editarProducto = editarProducto;
  window.eliminarProducto = eliminarProducto;

  /* --------------------------------------------------------------------------
     EVENTOS DEL FORMULARIO DE PRODUCTOS
     -------------------------------------------------------------------------- */
  function initFormEvents() {
    const form = document.getElementById("admin-product-form");
    const fileInput = document.getElementById("prod-imagen-file");
    const urlInput = document.getElementById("prod-imagen-url");
    const previewBox = document.getElementById("prod-image-preview");
    const cancelBtn = document.getElementById("admin-cancel-edit-btn");

    function updatePreview(src) {
      if (!previewBox) return;
      if (src) {
        previewBox.innerHTML = `<img src="${src}" alt="Vista previa">`;
      } else {
        previewBox.innerHTML = `<span style="font-size:0.82rem; color:var(--text-dark-muted);">Vista previa de la imagen</span>`;
      }
    }

    if (fileInput) {
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          uploadedImageBase64 = await processImageFileToBase64(file);
          updatePreview(uploadedImageBase64);
          if (file.size > 800 * 1024) {
            showToast("Imagen optimizada automáticamente (máx 800px) para guardado rápido ✨");
          }
        } catch (err) {
          showToast("No se pudo procesar la imagen seleccionada", "error");
        }
      });
    }

    if (urlInput) {
      urlInput.addEventListener("input", () => {
        const cleanUrl = urlInput.value.trim();
        if (cleanUrl) {
          uploadedImageBase64 = "";
          if (fileInput) fileInput.value = "";
          updatePreview(cleanUrl);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", resetProductForm);
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const editingId = document.getElementById("prod-id").value.trim();
        const nombre = document.getElementById("prod-nombre").value.trim();
        const precio = Number(document.getElementById("prod-precio").value) || 0;
        const precioOfertaRaw = document.getElementById("prod-precio-oferta").value;
        const precioOferta = precioOfertaRaw ? Number(precioOfertaRaw) : null;
        const categoria = document.getElementById("prod-categoria").value;
        const figura = document.getElementById("prod-figura").value.trim();
        const incluye = document.getElementById("prod-incluye").value.trim() || "Caja, cinta y tarjeta personalizada";
        const descripcionCorta = document.getElementById("prod-desc-corta").value.trim();
        const descripcionLarga = document.getElementById("prod-desc-larga").value.trim();
        const stock = Number(document.getElementById("prod-stock").value) || 0;
        const personalizable = document.getElementById("prod-personalizable").checked;
        const destacado = document.getElementById("prod-destacado").checked;

        const pastedUrl = urlInput ? urlInput.value.trim() : "";
        const finalImage =
          uploadedImageBase64 ||
          pastedUrl ||
          "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85";

        if (!nombre || precio <= 0) {
          showToast("El nombre y un precio mayor a 0 son obligatorios", "error");
          return;
        }

        const badge =
          precioOferta && precioOferta < precio
            ? "Oferta"
            : destacado
            ? "Más vendido"
            : "Nuevo";

        const payload = {
          nombre,
          precio,
          precioOferta,
          categoria,
          figura,
          incluye,
          descripcionCorta,
          descripcionLarga,
          stock,
          imagen: finalImage,
          personalizable,
          destacado,
          badge
        };

        try {
          if (editingId) {
            editarProducto(editingId, payload);
          } else {
            crearProducto(payload);
          }
        } catch (err) {
          console.error("Error guardando en localStorage:", err);
          showToast("No se pudo guardar: memoria de localStorage llena. Comprime la imagen o usa una URL.", "error");
        }
      });
    }
  }

  function loadProductIntoForm(id) {
    const prod = products.find((p) => String(p.id) === String(id));
    if (!prod) return;

    document.getElementById("form-title-heading").textContent = "Editar Producto";
    document.getElementById("prod-id").value = prod.id;
    document.getElementById("prod-nombre").value = prod.nombre;
    document.getElementById("prod-precio").value = prod.precio;
    document.getElementById("prod-precio-oferta").value = prod.precioOferta || "";
    document.getElementById("prod-categoria").value = prod.categoria;
    document.getElementById("prod-figura").value = getFigura(prod);
    document.getElementById("prod-incluye").value = getIncluye(prod);
    document.getElementById("prod-desc-corta").value = prod.descripcionCorta || "";
    document.getElementById("prod-desc-larga").value = prod.descripcionLarga || "";
    document.getElementById("prod-stock").value = prod.stock ?? 10;

    const isBase64 = typeof prod.imagen === "string" && prod.imagen.startsWith("data:");
    document.getElementById("prod-imagen-url").value = isBase64 ? "" : prod.imagen || "";
    const fileInput = document.getElementById("prod-imagen-file");
    if (fileInput) fileInput.value = "";

    document.getElementById("prod-personalizable").checked = Boolean(prod.personalizable);
    document.getElementById("prod-destacado").checked = Boolean(prod.destacado);

    uploadedImageBase64 = isBase64 ? prod.imagen : "";
    const previewBox = document.getElementById("prod-image-preview");
    if (previewBox) {
      previewBox.innerHTML = `<img src="${prod.imagen}" alt="${escapeHTML(prod.nombre)}">`;
    }

    document.getElementById("admin-cancel-edit-btn").style.display = "inline-flex";
    document.getElementById("admin-form-panel").scrollIntoView({ behavior: "smooth" });
  }

  function resetProductForm() {
    const form = document.getElementById("admin-product-form");
    if (form) form.reset();
    document.getElementById("prod-id").value = "";
    document.getElementById("form-title-heading").textContent = "Crear Nuevo Producto";
    document.getElementById("admin-cancel-edit-btn").style.display = "none";
    uploadedImageBase64 = "";
    const previewBox = document.getElementById("prod-image-preview");
    if (previewBox) {
      previewBox.innerHTML = `<span style="font-size:0.82rem; color:var(--text-dark-muted);">Vista previa de la imagen</span>`;
    }
  }

  /* --------------------------------------------------------------------------
     FILTROS Y EXPORTAR / IMPORTAR JSON (darvele_backup.json)
     -------------------------------------------------------------------------- */
  function initFilterAndBackupEvents() {
    const searchInput = document.getElementById("admin-search-input");
    const catSelect = document.getElementById("admin-filter-category");
    const exportBtn = document.getElementById("admin-export-json-btn");
    const importInput = document.getElementById("admin-import-json-input");
    const restoreDefaultsBtn = document.getElementById("admin-restore-defaults-btn");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        adminSearchQuery = e.target.value;
        renderProductsTable();
      });
    }

    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        adminCategoryFilter = e.target.value;
        renderProductsTable();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const dataStr = JSON.stringify(products, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "darvele_backup.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("Respaldo darvele_backup.json descargado ✅");
      });
    }

    if (importInput) {
      importInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const imported = JSON.parse(ev.target.result);
            if (!Array.isArray(imported)) {
              showToast("El archivo JSON no contiene un array válido de productos", "error");
              return;
            }
            const normalized = imported
              .filter((item) => item && typeof item === "object" && item.nombre)
              .map((item, idx) => ({
                id: item.id ? String(item.id) : `prod_${Date.now()}_${idx}`,
                nombre: String(item.nombre).trim(),
                precio: Math.max(0, Number(item.precio) || 0),
                precioOferta: item.precioOferta ? Math.max(0, Number(item.precioOferta)) : null,
                categoria: item.categoria || "Velas Decorativas",
                tags: Array.isArray(item.tags) ? item.tags : [item.categoria || "Velas Decorativas"],
                figura: item.figura ? String(item.figura) : item.categoria || "Figura decorativa",
                incluye: item.incluye ? String(item.incluye) : "Caja, cinta y tarjeta personalizada",
                acabado: item.acabado ? String(item.acabado) : "Pintada a mano",
                descripcionCorta: item.descripcionCorta ? String(item.descripcionCorta) : "",
                descripcionLarga: item.descripcionLarga ? String(item.descripcionLarga) : "",
                stock: Math.max(0, Number(item.stock) || 0),
                imagen:
                  item.imagen ||
                  "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85",
                galeria: Array.isArray(item.galeria) && item.galeria.length > 0 ? item.galeria : [item.imagen],
                personalizable: item.personalizable !== false,
                destacado: Boolean(item.destacado),
                activo: item.activo !== false,
                badge: item.badge || "Nuevo",
                estrellas: Math.min(5, Math.max(1, Number(item.estrellas) || 5))
              }));

            if (normalized.length === 0) {
              showToast("El archivo JSON no contiene productos válidos con nombre", "error");
              return;
            }

            products = normalized;
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
            showToast(`¡${products.length} productos importados! Recargando... ✅`);
            setTimeout(() => {
              window.location.reload();
            }, 600);
          } catch (err) {
            showToast("Error al leer el archivo JSON. Verifica que no esté corrupto.", "error");
          }
        };
        reader.readAsText(file);
        importInput.value = "";
      });
    }

    if (restoreDefaultsBtn) {
      restoreDefaultsBtn.addEventListener("click", () => {
        const confirmed = window.confirm(
          "¿Estás seguro de restablecer los 6 productos de ejemplo en figura? Esto reemplazará tu catálogo actual."
        );
        if (!confirmed) return;

        products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        renderAdminDashboard();
        showToast("Catálogo restablecido con los 6 productos de figuras ✅");
      });
    }

    // Botón flotante circular dorado "Crear Producto" en móvil
    const fabCreateBtn = document.getElementById("admin-fab-create");
    const formPanel = document.getElementById("admin-form-panel");

    if (fabCreateBtn && formPanel) {
      fabCreateBtn.addEventListener("click", () => {
        resetProductForm();
        formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          document.getElementById("prod-nombre")?.focus();
        }, 350);
      });

      if ("IntersectionObserver" in window) {
        const fabObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                fabCreateBtn.classList.add("fab-hidden");
              } else {
                fabCreateBtn.classList.remove("fab-hidden");
              }
            });
          },
          { threshold: 0.15 }
        );
        fabObserver.observe(formPanel);
      }
    }
  }
})();
