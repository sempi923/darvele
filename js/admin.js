/**
 * ============================================================================
 * DARVELÉ — Panel de Administración & Gestión de Inventario (admin.js)
 * Especialidad: Velas Decorativas en Figura & Selector Múltiple de 15 Colores
 * Arquitectura: Leonardo | Lógica CRUD, Persistencia v2 & JSON: Donatello
 * ============================================================================
 */

/**
 * Hash SHA-256 de la contraseña maestra ("Dariana2026")
 * No se almacena en texto plano en el código fuente.
 */
const CONFIG_ADMIN_PASSWORD_HASH = "346d148ff46fb074cdad88029ba1993681f847e9b76fc0068fa2aa1c47982e11";
const SESSION_AUTH_KEY = "darvele_admin_session";
const LOCKOUT_STORAGE_KEY = "darvele_admin_lockout";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minuto de bloqueo tras 5 intentos fallidos
const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024; // 2MB máximo recomendado

/**
 * Implementación pura en JavaScript de SHA-256 (funciona tanto en HTTPS como en HTTP local Termux)
 */
function sha256Hex(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  // Convertir string UTF-8 a bytes ASCII
  const utf8 = unescape(encodeURIComponent(String(ascii)));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";

  const words = [];
  const asciiBitLength = utf8[lengthProperty] * 8;

  let hash = (sha256Hex.h = sha256Hex.h || []);
  const k = (sha256Hex.k = sha256Hex.k || []);
  let primeCounter = k[lengthProperty];

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let padded = utf8 + "\x80";
  while ((padded[lengthProperty] % 64) - 56) padded += "\x00";
  for (i = 0; i < padded[lengthProperty]; i++) {
    j = padded.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  let hCopy = hash.slice(0, 8);
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hCopy.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const a = hCopy[0],
        e = hCopy[4];
      const temp1 =
        hCopy[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hCopy[5]) ^ (~e & hCopy[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hCopy[1]) ^ (a & hCopy[2]) ^ (hCopy[1] & hCopy[2]));

      hCopy = [(temp1 + temp2) | 0].concat(hCopy);
      hCopy[4] = (hCopy[4] + temp1) | 0;
      hCopy.pop();
    }

    for (i = 0; i < 8; i++) {
      hCopy[i] = (hCopy[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hCopy[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

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
    renderAdminColorPicker(["Blanco", "Marfil / Crema", "Dorado"]);
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
     AUTENTICACIÓN CON HASH SHA-256 Y BLOQUEO DE 1 MINUTO TRAS 5 INTENTOS
     -------------------------------------------------------------------------- */
  let lockoutTimerInterval = null;

  function getLockoutState() {
    try {
      const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (!raw) return { attempts: 0, lockedUntil: 0 };
      const parsed = JSON.parse(raw);
      return {
        attempts: Number(parsed.attempts) || 0,
        lockedUntil: Number(parsed.lockedUntil) || 0
      };
    } catch (e) {
      return { attempts: 0, lockedUntil: 0 };
    }
  }

  function saveLockoutState(attempts, lockedUntil) {
    try {
      localStorage.setItem(
        LOCKOUT_STORAGE_KEY,
        JSON.stringify({ attempts, lockedUntil })
      );
    } catch (e) {}
  }

  function updateLockoutUI() {
    const lockoutBanner = document.getElementById("admin-lockout-msg");
    const passInput = document.getElementById("admin-password-input");
    const submitBtn = document.getElementById("admin-login-submit-btn");
    const { attempts, lockedUntil } = getLockoutState();
    const now = Date.now();

    if (lockedUntil > now) {
      const remainingSec = Math.ceil((lockedUntil - now) / 1000);
      if (lockoutBanner) {
        lockoutBanner.style.display = "block";
        lockoutBanner.textContent = `⛔ Demasiados intentos. Bloqueado por ${remainingSec} segundos.`;
      }
      if (passInput) passInput.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      return true;
    } else {
      if (lockedUntil > 0 && lockedUntil <= now) {
        saveLockoutState(0, 0);
      }
      if (lockoutBanner) lockoutBanner.style.display = "none";
      if (passInput) passInput.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      if (lockoutTimerInterval) {
        clearInterval(lockoutTimerInterval);
        lockoutTimerInterval = null;
      }
      return false;
    }
  }

  function startLockoutCountdown() {
    if (lockoutTimerInterval) clearInterval(lockoutTimerInterval);
    updateLockoutUI();
    lockoutTimerInterval = setInterval(() => {
      const stillLocked = updateLockoutUI();
      if (!stillLocked && lockoutTimerInterval) {
        clearInterval(lockoutTimerInterval);
        lockoutTimerInterval = null;
      }
    }, 1000);
  }

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
      if (getLockoutState().lockedUntil > Date.now()) {
        startLockoutCountdown();
      }
    }

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (updateLockoutUI()) {
          showToast("Demasiados intentos. Espera 1 minuto para volver a intentar.", "error");
          return;
        }

        const passInput = document.getElementById("admin-password-input");
        const candidateHash = sha256Hex(passInput.value);

        if (candidateHash === CONFIG_ADMIN_PASSWORD_HASH) {
          saveLockoutState(0, 0);
          sessionStorage.setItem(SESSION_AUTH_KEY, "true");
          loginScreen.style.display = "none";
          appScreen.style.display = "block";
          products = getStoredProducts();
          showToast("Bienvenido al Panel Maestro de DARVELÉ ✨");
          renderAdminDashboard();
        } else {
          const state = getLockoutState();
          const nextAttempts = state.attempts + 1;

          if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
            const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
            saveLockoutState(nextAttempts, lockUntil);
            startLockoutCountdown();
            showToast("Demasiados intentos. Acceso bloqueado por 1 minuto.", "error");
          } else {
            saveLockoutState(nextAttempts, 0);
            const left = MAX_LOGIN_ATTEMPTS - nextAttempts;
            showToast(`Contraseña incorrecta. Te quedan ${left} intento(s).`, "error");
          }
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
     SELECTS DE CATEGORÍAS Y SELECTOR MÚLTIPLE DE 15 COLORES
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

  function renderAdminColorPicker(selectedColors = []) {
    const grid = document.getElementById("admin-candle-colors-grid");
    if (!grid) return;

    const selectedSet = new Set(Array.isArray(selectedColors) ? selectedColors : []);

    grid.innerHTML = DARVELE_CANDLE_COLORS.map((c) => {
      const isChecked = selectedSet.has(c.nombre);
      return `
        <label class="admin-color-chip ${isChecked ? "checked" : ""}">
          <input type="checkbox" name="prod-color-item" value="${escapeHTML(c.nombre)}" ${isChecked ? "checked" : ""}>
          <span class="admin-color-circle" style="background-color:${c.hex};"></span>
          <span>${escapeHTML(c.nombre)}</span>
        </label>
      `;
    }).join("");

    grid.querySelectorAll('input[name="prod-color-item"]').forEach((chk) => {
      chk.addEventListener("change", () => {
        const label = chk.closest(".admin-color-chip");
        if (label) label.classList.toggle("checked", chk.checked);
      });
    });
  }

  function getSelectedAdminColors() {
    const checkboxes = document.querySelectorAll('input[name="prod-color-item"]:checked');
    return Array.from(checkboxes).map((chk) => chk.value);
  }

  /* --------------------------------------------------------------------------
     VALIDACIÓN Y COMPRESIÓN DE IMAGEN A BASE64 (.jpg/.png/.webp, máx 2MB -> 800px)
     -------------------------------------------------------------------------- */
  function processImageFileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
        reject(new Error("Formato no permitido. Sube únicamente imágenes .JPG, .PNG o .WEBP"));
        return;
      }
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        reject(new Error("La imagen supera los 2MB permitidos. Elige una foto más liviana."));
        return;
      }

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

  function renderColorDotsMini(colores) {
    if (!Array.isArray(colores) || colores.length === 0) return "";
    const dots = colores
      .map((cName) => {
        const hex = getCandleColorHex(cName);
        return `<span title="${escapeHTML(cName)}" style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${hex}; border:1px solid rgba(26,26,26,0.3);"></span>`;
      })
      .join("");
    return `<div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center; margin-top:4px;">${dots}</div>`;
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
      const coloresText = Array.isArray(p.colores) ? p.colores.join(" ").toLowerCase() : "";

      const matchesQuery =
        !q ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        figuraText.includes(q) ||
        incluyeText.includes(q) ||
        coloresText.includes(q) ||
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
                    ${renderColorDotsMini(p.colores)}
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
                ${renderColorDotsMini(p.colores)}

                <div class="admin-prod-card-price-stock" style="margin-top:0.65rem;">
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
      colores: Array.isArray(productData.colores) ? productData.colores : [],
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
      colores: Array.isArray(productData.colores) ? productData.colores : [],
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
    const selectAllColorsBtn = document.getElementById("admin-colors-select-all");
    const clearAllColorsBtn = document.getElementById("admin-colors-clear-all");

    if (selectAllColorsBtn) {
      selectAllColorsBtn.addEventListener("click", () => {
        renderAdminColorPicker(DARVELE_CANDLE_COLORS.map((c) => c.nombre));
      });
    }

    if (clearAllColorsBtn) {
      clearAllColorsBtn.addEventListener("click", () => {
        renderAdminColorPicker([]);
      });
    }

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
          fileInput.value = "";
          showToast(err.message || "No se pudo procesar la imagen seleccionada", "error");
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
        const stock = Math.max(0, Number(document.getElementById("prod-stock").value) || 0);
        const personalizable = document.getElementById("prod-personalizable").checked;
        const destacado = document.getElementById("prod-destacado").checked;
        const colores = getSelectedAdminColors();

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
          colores,
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

    renderAdminColorPicker(Array.isArray(prod.colores) ? prod.colores : []);

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
    renderAdminColorPicker(["Blanco", "Marfil / Crema", "Dorado"]);
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
                precio: Math.max(1000, Number(item.precio) || 18000),
                precioOferta: item.precioOferta ? Math.max(0, Number(item.precioOferta)) : null,
                categoria: item.categoria || "Velas Decorativas",
                tags: Array.isArray(item.tags) ? item.tags : [item.categoria || "Velas Decorativas"],
                figura: item.figura ? String(item.figura) : item.categoria || "Figura decorativa",
                incluye: item.incluye ? String(item.incluye) : "Caja, cinta y tarjeta personalizada",
                acabado: item.acabado ? String(item.acabado) : "Pintada a mano",
                colores: Array.isArray(item.colores) ? item.colores.map(String) : [],
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
