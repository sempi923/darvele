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
 * Paleta oficial de 15 colores disponibles de velas DARVELÉ
 */
const DARVELE_CANDLE_COLORS = [
  { nombre: "Blanco", hex: "#FFFFFF" },
  { nombre: "Marfil / Crema", hex: "#F5EFE6" },
  { nombre: "Dorado", hex: "#D9B98A" },
  { nombre: "Rosa", hex: "#F2A7B8" },
  { nombre: "Rosado Pastel", hex: "#F8D5DE" },
  { nombre: "Azul", hex: "#7FA8D7" },
  { nombre: "Azul Pastel", hex: "#C5D9F0" },
  { nombre: "Verde", hex: "#8FA98F" },
  { nombre: "Verde Menta", hex: "#B8D8B8" },
  { nombre: "Morado / Lila", hex: "#B8A6D9" },
  { nombre: "Rojo", hex: "#C84B4B" },
  { nombre: "Negro", hex: "#1A1A1A" },
  { nombre: "Amarillo", hex: "#F2D06B" },
  { nombre: "Naranja", hex: "#E8A06B" },
  { nombre: "Café", hex: "#8B5E3C" }
];

/**
 * Devuelve el código hexadecimal de un color por su nombre
 */
function getCandleColorHex(colorName) {
  if (!colorName) return "#F5EFE6";
  const found = DARVELE_CANDLE_COLORS.find(
    (c) => c.nombre.toLowerCase() === String(colorName).trim().toLowerCase()
  );
  return found ? found.hex : "#D9B98A";
}

/**
 * 6 Productos reales de DARVELÉ — Velas Decorativas en Figura
 * Con soporte de colores disponibles ("colores").
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
    colores: ["Blanco", "Marfil / Crema", "Dorado", "Rosa", "Rosado Pastel", "Morado / Lila"],
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
    colores: ["Blanco", "Marfil / Crema", "Dorado", "Azul", "Azul Pastel", "Negro"],
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
    colores: ["Blanco", "Marfil / Crema", "Dorado", "Rojo", "Verde"],
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
    colores: ["Blanco", "Marfil / Crema", "Dorado", "Rosado Pastel", "Azul Pastel"],
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
    colores: ["Blanco", "Dorado", "Rosa", "Rosado Pastel", "Azul", "Azul Pastel", "Verde Menta", "Morado / Lila", "Amarillo"],
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
    colores: ["Blanco", "Marfil / Crema", "Dorado", "Rosa", "Rosado Pastel", "Azul Pastel", "Verde Menta", "Morado / Lila"],
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
 */
const OBSOLETE_LEGACY_IDS = new Set([
  "prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6", "prod-7", "prod-8",
  "prod_1700000000001", "prod_1700000000002", "prod_1700000000003", "prod_1700000000004",
  "prod_1700000000005", "prod_1700000000006", "prod_1700000000007", "prod_1700000000008"
]);

/**
 * Mapa de colores por defecto para enriquecer los 6 productos base si fueron guardados antes de existir el campo "colores"
 */
const DEFAULT_COLORS_BY_ID = Object.fromEntries(
  DEFAULT_PRODUCTS.map((p) => [p.id, p.colores])
);

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
 * - Si los 6 productos de ejemplo existen pero aún no tenían la propiedad "colores", les inyecta sus colores iniciales sin alterar precios ni textos.
 */
function getStoredProducts() {
  const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let modified = false;
        const hasObsoleteItems = parsed.some((p) => p && OBSOLETE_LEGACY_IDS.has(String(p.id)));

        if (hasObsoleteItems) {
          const userCustomProducts = parsed.filter((p) => p && !OBSOLETE_LEGACY_IDS.has(String(p.id)));
          const migrated = [...JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)), ...userCustomProducts];
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(migrated));
          return migrated;
        }

        // Enriquecer con array "colores" a los 6 productos base si fueron guardados antes de esta mejora
        parsed.forEach((p) => {
          if (p && !Array.isArray(p.colores) && DEFAULT_COLORS_BY_ID[p.id]) {
            p.colores = [...DEFAULT_COLORS_BY_ID[p.id]];
            modified = true;
          }
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(parsed));
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
