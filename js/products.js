/**
 * ============================================================================
 * DARVELÉ — Base de Datos Inicial & Utilidades Compartidas (products.js)
 * Especialidad: Velas Decorativas en Figura & Detalles Hechos a Mano
 * Arquitectura: Leonardo | Lógica: Donatello | Copy: Michelangelo
 * ============================================================================
 */

const CONFIG_WHATSAPP = "573057221113";
const CONFIG_INSTAGRAM = "https://instagram.com/darvele_";
const STORAGE_KEY_PRODUCTS = "darvele_productos_v2";
const STORAGE_KEY_CART = "darvele_carrito";
const FREE_SHIPPING_THRESHOLD = 120000;
const STANDARD_SHIPPING_COST = 12000;

/**
 * Categorías oficiales de DARVELÉ (Velas Decorativas en Figura)
 */
const DARVELE_CATEGORIES = [
  "Todas",
  "Velas Decorativas",
  "Graduación",
  "Navidad / Pesebre",
  "Bautizo y Primera Comunión",
  "Cumpleaños",
  "Detalles y Recuerdos",
  "Personalizadas"
];

/**
 * 6 Productos reales de DARVELÉ — Velas Decorativas en Figura
 * Sin campo aroma: usan "figura" (Figura / Tema) e "incluye" (Medidas / Incluye).
 */
const DEFAULT_PRODUCTS = [
  {
    id: "prod_1700000000101",
    nombre: "Vela Graduada Niña",
    precio: 25000,
    precioOferta: null,
    categoria: "Graduación",
    tags: ["Graduación", "Velas Decorativas", "Personalizadas"],
    figura: "Niña Graduada con Birrete Dorado",
    incluye: "Caja transparente, cinta y tarjeta personalizada",
    acabado: "Pintada a mano",
    descripcionCorta: "Vela decorativa en figura de niña graduada, con toga, birrete dorado y diploma. Incluye caja transparente, cinta y tarjeta personalizada con nombre y mensaje.",
    descripcionLarga: "Vela decorativa en figura de niña graduada, con toga, birrete dorado y diploma. Incluye caja transparente, cinta y tarjeta personalizada con nombre y mensaje.",
    stock: 25,
    imagen: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Más vendido",
    estrellas: 5
  },
  {
    id: "prod_1700000000102",
    nombre: "Vela Graduado Niño",
    precio: 25000,
    precioOferta: null,
    categoria: "Graduación",
    tags: ["Graduación", "Velas Decorativas", "Personalizadas"],
    figura: "Niño Graduado con Birrete Dorado",
    incluye: "Caja transparente, cinta y tarjeta personalizada",
    acabado: "Pintada a mano",
    descripcionCorta: "Vela decorativa en figura de niño graduado, con toga, birrete dorado y diploma. Incluye caja transparente, cinta y tarjeta personalizada.",
    descripcionLarga: "Vela decorativa en figura de niño graduado, con toga, birrete dorado y diploma. Incluye caja transparente, cinta y tarjeta personalizada.",
    stock: 25,
    imagen: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Más vendido",
    estrellas: 5
  },
  {
    id: "prod_1700000000103",
    nombre: "Pesebre Navideño Completo (8 figuras)",
    precio: 120000,
    precioOferta: null,
    categoria: "Navidad / Pesebre",
    tags: ["Navidad / Pesebre", "Velas Decorativas"],
    figura: "Set Natividad 8 Figuras con Detalles Dorados",
    incluye: "8 figuras en cera (Niño Jesús, María, José, 3 Reyes, buey y burro) + caja especial",
    acabado: "Detalles pintados a mano en dorado",
    descripcionCorta: "Set de 8 figuras en cera: Niño Jesús, María, José, 3 Reyes Magos, buey y burro. Detalles pintados a mano en dorado. Ideal para decorar en Navidad.",
    descripcionLarga: "Set de 8 figuras en cera: Niño Jesús, María, José, 3 Reyes Magos, buey y burro. Detalles pintados a mano en dorado. Ideal para decorar en Navidad.",
    stock: 12,
    imagen: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Edición Navidad",
    estrellas: 5
  },
  {
    id: "prod_1700000000104",
    nombre: "Vela Figura Bautizo Ángel",
    precio: 28000,
    precioOferta: null,
    categoria: "Bautizo y Primera Comunión",
    tags: ["Bautizo y Primera Comunión", "Velas Decorativas", "Personalizadas"],
    figura: "Angelito Esculpido en Cera",
    incluye: "Caja de presentación, cinta y tarjeta con nombre y fecha",
    acabado: "Esculpida y pintada a mano",
    descripcionCorta: "Vela decorativa en figura de angelito para bautizo o primera comunión. Se personaliza con nombre y fecha.",
    descripcionLarga: "Vela decorativa en figura de angelito para bautizo o primera comunión. Se personaliza con nombre y fecha.",
    stock: 30,
    imagen: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Personalizable",
    estrellas: 5
  },
  {
    id: "prod_1700000000105",
    nombre: "Vela Cumpleaños Personalizada",
    precio: 30000,
    precioOferta: null,
    categoria: "Cumpleaños",
    tags: ["Cumpleaños", "Velas Decorativas", "Personalizadas"],
    figura: "Figura Personalizada con Nombre y Edad",
    incluye: "Caja de regalo, cinta decorativa y tarjeta",
    acabado: "Colores personalizados a elección",
    descripcionCorta: "Vela decorativa en figura a elegir con nombre, edad y colores de tu fiesta. Incluye caja de regalo.",
    descripcionLarga: "Vela decorativa en figura a elegir con nombre, edad y colores de tu fiesta. Incluye caja de regalo.",
    stock: 20,
    imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: false,
    activo: true,
    badge: "Nuevo",
    estrellas: 5
  },
  {
    id: "prod_1700000000106",
    nombre: "Detalle / Recuerdo para Evento",
    precio: 18000,
    precioOferta: null,
    categoria: "Detalles y Recuerdos",
    tags: ["Detalles y Recuerdos", "Graduación", "Bautizo y Primera Comunión", "Cumpleaños", "Personalizadas"],
    figura: "Mini Figura para Recordatorio de Evento",
    incluye: "Empaque individual con cinta y tarjeta personalizada (Descuento desde 20 uds)",
    acabado: "Hecho a mano por unidad o docena",
    descripcionCorta: "Mini vela decorativa en figura para recuerdos de graduación, bautizo, cumpleaños o baby shower. Precio por unidad, descuento desde 20 unidades. Personalizable.",
    descripcionLarga: "Mini vela decorativa en figura para recuerdos de graduación, bautizo, cumpleaños o baby shower. Precio por unidad, descuento desde 20 unidades. Personalizable.",
    stock: 100,
    imagen: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Descuento +20 uds",
    estrellas: 5
  }
];

/**
 * IDs obsoletos del catálogo anterior de 8 velas que deben migrarse automáticamente
 * a los 6 productos reales de figuras si están presentes en localStorage.
 */
const OBSOLETE_LEGACY_IDS = new Set([
  "prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6", "prod-7", "prod-8",
  "prod_1700000000001", "prod_1700000000002", "prod_1700000000003", "prod_1700000000004",
  "prod_1700000000005", "prod_1700000000006", "prod_1700000000007", "prod_1700000000008"
]);

/**
 * Formatea un número a pesos colombianos con separador de miles: $25.000
 */
function formatCOP(amount) {
  const num = Number(amount) || 0;
  return "$" + num.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Obtiene la lista de productos desde localStorage ("darvele_productos_v2").
 * - SI EXISTE: usa esos productos tal cual y NUNCA borra los productos creados o editados por el usuario.
 *   (Si detecta que solo contiene el lote viejo obsoleto prod-1..prod-8, lo actualiza una única vez a los 6 nuevos de figura conservando cualquier producto nuevo que el usuario haya agregado).
 * - SI NO EXISTE (primera vez): carga los 6 productos de ejemplo en figura y los guarda inmediatamente en "darvele_productos_v2".
 */
function getStoredProducts() {
  const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Verificar si aún contiene únicamente productos del lote viejo obsoleto
        const hasObsoleteItems = parsed.some((p) => p && OBSOLETE_LEGACY_IDS.has(String(p.id)));
        if (hasObsoleteItems) {
          const userCustomProducts = parsed.filter((p) => p && !OBSOLETE_LEGACY_IDS.has(String(p.id)));
          const migrated = [...JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)), ...userCustomProducts];
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      }
      showToast("⚠️ El formato de productos en localStorage no es válido. Usa Exportar/Importar JSON.", "error");
      return [];
    } catch (err) {
      console.error("Error leyendo darvele_productos_v2 de localStorage:", err);
      showToast("⚠️ Datos corruptos en localStorage. No se borraron tus datos por seguridad.", "error");
      return [];
    }
  }

  // Primera vez: cargar los 6 productos reales en figura y guardarlos inmediatamente en "darvele_productos_v2"
  const initialProducts = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initialProducts));
  } catch (err) {
    console.error("No se pudo inicializar darvele_productos_v2:", err);
  }
  return initialProducts;
}

/**
 * Guarda la lista de productos en localStorage ("darvele_productos_v2")
 */
function saveStoredProducts(products) {
  try {
    if (!Array.isArray(products)) {
      throw new Error("El catálogo debe ser un array de productos.");
    }
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    return true;
  } catch (err) {
    console.error("Error guardando productos en localStorage:", err);
    showToast(
      "⚠️ No se pudo guardar en localStorage (posible imagen muy pesada o memoria llena). Intenta con una imagen más liviana o URL.",
      "error"
    );
    return false;
  }
}

/**
 * Escapa caracteres HTML especiales para prevenir inyección XSS en plantillas innerHTML
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Muestra un toast elegante sin usar alert() nativo (seguro contra XSS)
 */
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-item ${type === "error" ? "toast-error" : ""}`;
  const iconSpan = document.createElement("span");
  iconSpan.className = "toast-icon";
  iconSpan.textContent = type === "error" ? "⚠️" : "✨";

  const msgSpan = document.createElement("span");
  msgSpan.textContent = String(message || "");

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}
