/**
 * ============================================================================
 * DARVELÉ — Base de Datos Inicial & Utilidades Compartidas (products.js)
 * Arquitectura: Leonardo | Lógica: Donatello | Copy: Michelangelo
 * ============================================================================
 */

const CONFIG_WHATSAPP = "573057221113";
const CONFIG_INSTAGRAM = "https://instagram.com/darvele_";
const STORAGE_KEY_PRODUCTS = "darvele_productos_v2";
const LEGACY_STORAGE_KEY_PRODUCTS = "darvele_productos";
const STORAGE_KEY_CART = "darvele_carrito";
const FREE_SHIPPING_THRESHOLD = 120000;
const STANDARD_SHIPPING_COST = 12000;

const DARVELE_CATEGORIES = [
  "Todas",
  "Velas Aromáticas",
  "Velas Decorativas",
  "Boxes / Detalles",
  "Personalizadas",
  "Cumpleaños",
  "Aniversario",
  "Amor",
  "Agradecimiento"
];

/**
 * 8 Productos reales de ejemplo con copy emocional en español colombiano
 * Se cargan automáticamente en localStorage si no existen datos previos.
 */
const DEFAULT_PRODUCTS = [
  {
    id: "prod_1700000000001",
    nombre: "Vela Lavanda Relajante",
    precio: 45000,
    precioOferta: null,
    categoria: "Velas Aromáticas",
    tags: ["Velas Aromáticas", "Agradecimiento", "Personalizadas"],
    aroma: "Lavanda Francesa & Manzanilla",
    descripcionCorta: "Un abrazo de calma para desconectar del ruido y abrazar tu paz interior.",
    descripcionLarga: "Vertida a mano en cera de soya 100% natural con pabilo de algodón ecológico. Sus notas de lavanda fresca de la Provenza y un fondo sutil de manzanilla dulce transforman cualquier habitación en un santuario de descanso profundo. Ideal para regalar paz después de una semana intensa.",
    duracion: "35 horas",
    intensidad: "Media - Envolvente",
    stock: 18,
    imagen: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Más vendido",
    estrellas: 5
  },
  {
    id: "prod_1700000000002",
    nombre: "Vela Vainilla & Canela",
    precio: 48000,
    precioOferta: 44000,
    categoria: "Velas Aromáticas",
    tags: ["Velas Aromáticas", "Amor", "Agradecimiento"],
    aroma: "Vainilla Bourbon & Canela Dulce",
    descripcionCorta: "El calorcito de hogar que despierta recuerdos bonitos y tardes de lluvia.",
    descripcionLarga: "Una mezcla cálida y acogedora que perfuma toda la casa con la dulzura cremosa de la vainilla artesanal y el toque especiado de la canela recién molida. Es esa vela que enciendes cuando quieres que tu espacio se sienta como un abrazo de quien más quieres.",
    duracion: "38 horas",
    intensidad: "Alta - Cálida",
    stock: 15,
    imagen: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Oferta",
    estrellas: 5
  },
  {
    id: "prod_1700000000003",
    nombre: "Vela Café de la Mañana",
    precio: 52000,
    precioOferta: null,
    categoria: "Velas Aromáticas",
    tags: ["Velas Aromáticas", "Agradecimiento", "Cumpleaños"],
    aroma: "Café Tostado del Eje & Caramelo",
    descripcionCorta: "Tributo al aroma más amado de Colombia: café recién colado con notas de caramelo.",
    descripcionLarga: "Inspirada en los amaneceres de nuestras montañas cafeteras. Combina granos de café arábigo tostado con un corazón cremoso de avellana y caramelo artesanal. El regalo perfecto para amantes del buen café, oficinas elegantes y mañanas llenas de inspiración.",
    duracion: "40 horas",
    intensidad: "Alta - Intensa",
    stock: 12,
    imagen: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: false,
    activo: true,
    badge: "Nuevo",
    estrellas: 5
  },
  {
    id: "prod_1700000000004",
    nombre: "Vela Rosa Eterna",
    precio: 58000,
    precioOferta: null,
    categoria: "Personalizadas",
    tags: ["Personalizadas", "Amor", "Aniversario"],
    aroma: "Rosas de Jardín, Peonía & Ámbar",
    descripcionCorta: "Elegancia floral esculpida en cera vegetal para decir 'te amo' sin palabras.",
    descripcionLarga: "Coronada con delicados relieves florales hechos a mano y perfumada con un bouquet romántico de rosas frescas, peonías rosadas y un fondo sedoso de ámbar blanco. Una joya olfativa pensada para aniversarios, fechas inolvidables y personas que merecen todo.",
    duracion: "42 horas",
    intensidad: "Media - Floral Sofisticada",
    stock: 10,
    imagen: "https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Más vendido",
    estrellas: 5
  },
  {
    id: "prod_1700000000005",
    nombre: "Box Amor Eterno",
    precio: 85000,
    precioOferta: null,
    categoria: "Boxes / Detalles",
    tags: ["Boxes / Detalles", "Amor", "Aniversario", "Personalizadas"],
    aroma: "Frutos Rojos, Champagne & Rosas",
    descripcionCorta: "Caja de lujo con vela personalizada, fósforos largos en frasco de vidrio y tarjeta caligrafiada.",
    descripcionLarga: "Nuestro regalo insignia para enamorar desde el primer instante. Incluye 1 vela grande en envase de cristal con tapa dorada, frasco de fósforos de lujo, ramillete de flores secas preservadas, cinta de satén color champaña y tarjeta en papel algodón con tu dedicatoria impresa.",
    duracion: "45 horas",
    intensidad: "Alta - Romántica",
    stock: 8,
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
    id: "prod_1700000000006",
    nombre: "Box Cumpleaños Feliz",
    precio: 95000,
    precioOferta: 89000,
    categoria: "Cumpleaños",
    tags: ["Boxes / Detalles", "Cumpleaños", "Personalizadas"],
    aroma: "Vainilla Francesa, Macaron & Jazmín",
    descripcionCorta: "El detalle más inolvidable para celebrar la vida de esa persona tan especial.",
    descripcionLarga: "Sorprende en su día con una experiencia sensorial completa: Vela aromática personalizada con su nombre, mini vela escultural decorativa, apagavelas dorado o fósforos premium, flores secas y caja rígida de colección con lazo dorado y mensaje personalizado.",
    duracion: "50 horas",
    intensidad: "Alta - Festiva",
    stock: 9,
    imagen: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: true,
    activo: true,
    badge: "Oferta",
    estrellas: 5
  },
  {
    id: "prod_1700000000007",
    nombre: "Vela Decorativa Luna",
    precio: 65000,
    precioOferta: null,
    categoria: "Velas Decorativas",
    tags: ["Velas Decorativas", "Aniversario", "Agradecimiento"],
    aroma: "Sándalo Blanco & Cedro",
    descripcionCorta: "Escultura minimalista con destellos en hoja de oro que eleva cualquier rincón.",
    descripcionLarga: "Más que una vela, una pieza de arte contemporáneo moldeada a mano con acabados satinados y toques sutiles de folia dorada. Su fragancia amaderada de sándalo blanco y cedro aporta sofisticación digna de una boutique de diseño de interiores.",
    duracion: "32 horas",
    intensidad: "Media - Amaderada",
    stock: 14,
    imagen: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: false,
    activo: true,
    badge: "Nuevo",
    estrellas: 5
  },
  {
    id: "prod_1700000000008",
    nombre: "Vela Eucalipto Spa",
    precio: 49000,
    precioOferta: null,
    categoria: "Velas Aromáticas",
    tags: ["Velas Aromáticas", "Agradecimiento"],
    aroma: "Eucalipto Mentolado, Té Verde & Bambú",
    descripcionCorta: "Respira profundo: frescura botánica que convierte tu baño o cuarto en un spa de lujo.",
    descripcionLarga: "Elaborada con aceites esenciales puros de eucalipto andino, hojas de té verde y notas acuáticas de bambú. Purifica el ambiente, despeja la mente y renueva la energía del hogar con una estela limpia, herbal y profundamente revitalizante.",
    duracion: "36 horas",
    intensidad: "Media/Alta - Herbal",
    stock: 20,
    imagen: "https://images.unsplash.com/photo-1608181831718-c9ffd8728e72?auto=format&fit=crop&w=900&q=85",
    galeria: [
      "https://images.unsplash.com/photo-1608181831718-c9ffd8728e72?auto=format&fit=crop&w=900&q=85"
    ],
    personalizable: true,
    destacado: false,
    activo: true,
    badge: "Nuevo",
    estrellas: 5
  }
];

/**
 * Formatea un número a pesos colombianos con separador de miles: $45.000
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
 * - SI EXISTE: usa esos productos tal cual y NUNCA los sobrescribe con los de ejemplo.
 * - SI NO EXISTE (primera vez): migra de "darvele_productos" si había datos previos, o carga los 8 productos de ejemplo y los guarda inmediatamente en "darvele_productos_v2".
 * - En caso de JSON corrupto: muestra alerta mediante showToast y NO borra el localStorage.
 */
function getStoredProducts() {
  const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
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

  // Migración suave si el usuario tenía productos guardados en la clave anterior "darvele_productos"
  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_PRODUCTS);
  if (legacyRaw !== null) {
    try {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(legacyParsed));
        return legacyParsed;
      }
    } catch (e) {
      // Si la clave vieja falló, continuar con los 8 por defecto
    }
  }

  // Primera vez real: cargar los 8 productos de ejemplo y guardarlos inmediatamente en "darvele_productos_v2"
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
 * Muestra un toast elegante sin usar alert() nativo
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
  const icon = type === "error" ? "⚠️" : "✨";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}
