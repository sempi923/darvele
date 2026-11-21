/**
 * ============================================================================
 * DARVELÉ — Panel de Administración & Gestión de Inventario (admin.js)
 * Arquitectura: Leonardo | Lógica CRUD & JSON: Donatello
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
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
    }

    if (filterCatSelect) {
      filterCatSelect.innerHTML = DARVELE_CATEGORIES.map(
        (cat) => `<option value="${cat}">${cat}</option>`
      ).join("");
    }
  }

  /* --------------------------------------------------------------------------
     DASHBOARD MÉTRICAS Y TABLA CRUD
     -------------------------------------------------------------------------- */
  function renderAdminDashboard() {
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.activo !== false).length;
    const featuredCount = products.filter((p) => p.destacado === true).length;
    const totalInventoryValue = products.reduce((sum, p) => {
      const price = p.precioOferta && Number(p.precioOferta) < Number(p.precio)
        ? Number(p.precioOferta)
        : Number(p.precio);
      const stock = Number(p.stock) || 0;
      return sum + price * stock;
    }, 0);

    document.getElementById("stat-total-products").textContent = totalCount;
    document.getElementById("stat-active-products").textContent = activeCount;
    document.getElementById("stat-featured-products").textContent = featuredCount;
    document.getElementById("stat-inventory-value").textContent = formatCOP(totalInventoryValue);

    renderProductsTable();
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
      const matchesQuery =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.aroma && p.aroma.toLowerCase().includes(q)) ||
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

          return `
            <tr>
              <td>
                <div class="admin-prod-cell">
                  <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=300&q=80'">
                  <div>
                    <strong style="display:block; color:var(--bg-dark);">${p.nombre}</strong>
                    <span style="font-size:0.78rem; color:var(--text-dark-muted);">${p.aroma || ""} • ${p.duracion || "30 horas"}</span>
                  </div>
                </div>
              </td>
              <td>${p.categoria}</td>
              <td>
                <strong>${formatCOP(hasOffer ? p.precioOferta : p.precio)}</strong>
                ${hasOffer ? `<div style="font-size:0.75rem; text-decoration:line-through; color:#999;">${formatCOP(p.precio)}</div>` : ""}
              </td>
              <td>${p.stock ?? 0} uds</td>
              <td>
                <span class="status-pill ${isActive ? "status-active" : "status-inactive"}">
                  ${isActive ? "Activo" : "Inactivo"}
                </span>
                ${p.destacado ? `<span class="status-pill" style="background:rgba(217,185,138,0.25); color:#8E6B3E; margin-left:4px;">★ Destacado</span>` : ""}
              </td>
              <td>
                <div class="admin-action-btns">
                  <button type="button" class="btn-xs" data-edit="${p.id}">Editar</button>
                  <button type="button" class="btn-xs" data-toggle-active="${p.id}">
                    ${isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button type="button" class="btn-xs" data-toggle-featured="${p.id}">
                    ${p.destacado ? "Quitar ★" : "Destacar ★"}
                  </button>
                  <button type="button" class="btn-xs" style="color:#C0392B; border-color:rgba(192,57,43,0.3);" data-delete="${p.id}">
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

          return `
            <article class="admin-prod-card">
              <div class="admin-prod-card-img-wrap">
                <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80'">
                <div class="admin-prod-card-badges">
                  <span class="status-pill ${isActive ? "status-active" : "status-inactive"}" style="background:${isActive ? "#1E8449" : "#C0392B"}; color:#FFF;">
                    ${isActive ? "Activo" : "Inactivo"}
                  </span>
                  ${p.destacado ? `<span class="status-pill" style="background:var(--bg-dark); color:var(--gold); border:1px solid var(--gold);">★ Destacado</span>` : ""}
                </div>
              </div>
              <div class="admin-prod-card-body">
                <span class="admin-prod-card-cat">${p.categoria}</span>
                <h3 class="admin-prod-card-title">${p.nombre}</h3>
                <div class="admin-prod-card-meta">${p.aroma || "Aroma artesanal"} • ${p.duracion || "35 horas"}</div>

                <div class="admin-prod-card-price-stock">
                  <div>
                    <strong style="font-size:1.15rem; color:var(--bg-dark);">${formatCOP(hasOffer ? p.precioOferta : p.precio)}</strong>
                    ${hasOffer ? `<span style="font-size:0.82rem; text-decoration:line-through; color:#888; margin-left:6px;">${formatCOP(p.precio)}</span>` : ""}
                  </div>
                  <span style="font-size:0.88rem; font-weight:600; color:var(--text-dark-muted);">Stock: ${p.stock ?? 0} uds</span>
                </div>

                <div class="admin-prod-card-actions">
                  <button type="button" class="btn-admin-card btn-edit-primary" data-edit="${p.id}">
                    ✎ Editar Producto
                  </button>
                  <button type="button" class="btn-admin-card" data-toggle-active="${p.id}">
                    ${isActive ? "Desactivar Producto" : "Activar Producto"}
                  </button>
                  <button type="button" class="btn-admin-card" data-toggle-featured="${p.id}">
                    ${p.destacado ? "Quitar de Destacados ★" : "Marcar Destacado ★"}
                  </button>
                  <button type="button" class="btn-admin-card btn-delete-danger" data-delete="${p.id}">
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
      btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-delete")));
    });
  }

  /* --------------------------------------------------------------------------
     CREAR / EDITAR / ELIMINAR PRODUCTOS
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
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadedImageBase64 = ev.target.result;
          updatePreview(uploadedImageBase64);
        };
        reader.readAsDataURL(file);
      });
    }

    if (urlInput) {
      urlInput.addEventListener("input", () => {
        if (urlInput.value.trim()) {
          uploadedImageBase64 = "";
          updatePreview(urlInput.value.trim());
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", resetProductForm);
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const editingId = document.getElementById("prod-id").value;
        const nombre = document.getElementById("prod-nombre").value.trim();
        const precio = Number(document.getElementById("prod-precio").value) || 0;
        const precioOfertaRaw = document.getElementById("prod-precio-oferta").value;
        const precioOferta = precioOfertaRaw ? Number(precioOfertaRaw) : null;
        const categoria = document.getElementById("prod-categoria").value;
        const aroma = document.getElementById("prod-aroma").value.trim();
        const descCorta = document.getElementById("prod-desc-corta").value.trim();
        const descLarga = document.getElementById("prod-desc-larga").value.trim();
        const duracion = document.getElementById("prod-duracion").value.trim() || "35 horas";
        const stock = Number(document.getElementById("prod-stock").value) || 0;
        const personalizable = document.getElementById("prod-personalizable").checked;
        const destacado = document.getElementById("prod-destacado").checked;

        const finalImage =
          uploadedImageBase64 ||
          urlInput.value.trim() ||
          "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85";

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

        if (editingId) {
          const idx = products.findIndex((p) => p.id === editingId);
          if (idx !== -1) {
            products[idx] = {
              ...products[idx],
              nombre,
              precio,
              precioOferta,
              categoria,
              aroma,
              descripcionCorta: descCorta,
              descripcionLarga: descLarga,
              duracion,
              stock,
              imagen: finalImage,
              galeria: [finalImage],
              personalizable,
              destacado,
              badge
            };
          }
          showToast(`Producto "${nombre}" actualizado con éxito ✨`);
        } else {
          const newProd = {
            id: "prod-" + Date.now(),
            nombre,
            precio,
            precioOferta,
            categoria,
            tags: [categoria],
            aroma,
            descripcionCorta: descCorta,
            descripcionLarga: descLarga,
            duracion,
            intensidad: "Media / Alta",
            stock,
            imagen: finalImage,
            galeria: [finalImage],
            personalizable,
            destacado,
            activo: true,
            badge,
            estrellas: 5
          };
          products.unshift(newProd);
          showToast(`Producto "${nombre}" creado en el catálogo ✨`);
        }

        saveStoredProducts(products);
        resetProductForm();
        renderAdminDashboard();
      });
    }
  }

  function loadProductIntoForm(id) {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    document.getElementById("form-title-heading").textContent = "Editar Producto";
    document.getElementById("prod-id").value = prod.id;
    document.getElementById("prod-nombre").value = prod.nombre;
    document.getElementById("prod-precio").value = prod.precio;
    document.getElementById("prod-precio-oferta").value = prod.precioOferta || "";
    document.getElementById("prod-categoria").value = prod.categoria;
    document.getElementById("prod-aroma").value = prod.aroma || "";
    document.getElementById("prod-desc-corta").value = prod.descripcionCorta || "";
    document.getElementById("prod-desc-larga").value = prod.descripcionLarga || "";
    document.getElementById("prod-duracion").value = prod.duracion || "35 horas";
    document.getElementById("prod-stock").value = prod.stock ?? 10;
    document.getElementById("prod-imagen-url").value = prod.imagen.startsWith("data:") ? "" : prod.imagen;
    document.getElementById("prod-personalizable").checked = Boolean(prod.personalizable);
    document.getElementById("prod-destacado").checked = Boolean(prod.destacado);

    uploadedImageBase64 = prod.imagen.startsWith("data:") ? prod.imagen : "";
    const previewBox = document.getElementById("prod-image-preview");
    if (previewBox) {
      previewBox.innerHTML = `<img src="${prod.imagen}" alt="${prod.nombre}">`;
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

  function toggleProductActive(id) {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    prod.activo = prod.activo === false ? true : false;
    saveStoredProducts(products);
    renderAdminDashboard();
    showToast(`"${prod.nombre}" ahora está ${prod.activo ? "Activo" : "Inactivo"}`);
  }

  function toggleProductFeatured(id) {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    prod.destacado = !prod.destacado;
    saveStoredProducts(products);
    renderAdminDashboard();
    showToast(
      prod.destacado
        ? `"${prod.nombre}" marcado como Destacado ★`
        : `"${prod.nombre}" removido de Destacados`
    );
  }

  function deleteProduct(id) {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    products = products.filter((p) => p.id !== id);
    saveStoredProducts(products);
    renderAdminDashboard();
    showToast(`"${prod.nombre}" fue eliminado del inventario`);
  }

  /* --------------------------------------------------------------------------
     FILTROS Y EXPORTAR / IMPORTAR JSON
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
        const dateTag = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `darvele_inventario_${dateTag}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("Respaldo JSON descargado correctamente ✨");
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
              showToast("El archivo JSON no contiene una lista válida de productos", "error");
              return;
            }
            products = imported;
            saveStoredProducts(products);
            renderAdminDashboard();
            showToast(`¡${products.length} productos importados con éxito! ✨`);
          } catch (err) {
            showToast("Error al leer el archivo JSON. Verifica el formato.", "error");
          }
        };
        reader.readAsText(file);
        importInput.value = "";
      });
    }

    if (restoreDefaultsBtn) {
      restoreDefaultsBtn.addEventListener("click", () => {
        products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        saveStoredProducts(products);
        renderAdminDashboard();
        showToast("Catálogo restaurado con los 8 productos originales de DARVELÉ ✨");
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

      // Ocultar el botón flotante mientras el usuario está viendo el formulario para que nunca lo tape
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
