# 🕯️ DARVELÉ — Velas Artesanales y Detalles para Regalo en Colombia

Sitio web de comercio electrónico boutique y panel de administración para **DARVELÉ** (`@darvele_`), diseñado bajo la estética **Gama 1: Lujo Cálido** con carrito persistente en `localStorage`, personalizador de detalles paso a paso, pedidos directos a WhatsApp y panel CRUD con exportación/importación JSON.

---

## 📁 Estructura del Proyecto

```text
/
├── index.html          # Tienda pública completa (Hero, Catálogo, Modal, Arma tu detalle, Carrito, Checkout WhatsApp)
├── admin.html          # Panel de administración con login, métricas, CRUD y respaldo JSON
├── logo.png            # Logo de DARVELÉ en raíz (compatible si reemplazas el archivo directamente aquí)
├── assets/
│   └── logo.png        # Copia del logo en carpeta /assets/
├── css/
│   └── style.css       # Sistema de diseño Gama 1 Lujo Cálido (Mobile-first, animaciones fade-up, drawer, modales)
├── js/
│   ├── products.js     # Configuración global, 8 productos reales iniciales, formateador COP y Toasts
│   ├── app.js          # Lógica de tienda pública, filtros, buscador, modal, constructor y checkout WhatsApp
│   └── admin.js        # Lógica del panel admin, login, dashboard, CRUD y exportar/importar JSON
└── README.md           # Guía completa de uso, personalización y despliegue
```

---

## 📱 1. Cómo correr el proyecto en Termux (Android) o Linux/Mac/Windows

No necesitas instalar Node.js ni bases de datos externas. Todo funciona con el servidor HTTP nativo de Python 3:

1. Abre **Termux** (o tu terminal) y entra a la carpeta del proyecto:
   ```bash
   cd ~/Dariana
   ```
2. Inicia el servidor web local en el puerto `8000`:
   ```bash
   python3 -m http.server 8000
   ```
3. Abre tu navegador (Chrome, Brave, Safari) y visita:
   - **Tienda Pública:** `http://localhost:8000/index.html`
   - **Panel Admin:** `http://localhost:8000/admin.html`

> **Nota sobre el Logo:** El código carga automáticamente `logo.png` (y tiene respaldo automático en `assets/logo.png`). Si tienes tu archivo `logo.png` original, simplemente pégalo o reemplázalo en la raíz o en `/assets/logo.png` sin tocar una sola línea de código.

---

## 💬 2. Cómo cambiar el número de WhatsApp

El número de WhatsApp está centralizado en la constante `CONFIG_WHATSAPP` dentro del archivo [`js/products.js`](./js/products.js):

1. Abre `js/products.js`.
2. En la línea 7 verás:
   ```javascript
   const CONFIG_WHATSAPP = "573057221113";
   ```
3. Cámbialo por tu nuevo número con el indicativo de Colombia (`57`) sin signos `+` ni espacios.

---

## 🔐 3. Cómo cambiar la contraseña del Panel de Administración

La contraseña por defecto para entrar a `admin.html` es: **`darvele2026`**

Para cambiarla:
1. Abre [`js/admin.js`](./js/admin.js).
2. En la línea 7 modifica la constante:
   ```javascript
   const CONFIG_ADMIN_PASSWORD = "tu_nueva_clave_segura";
   ```

---

## 🎨 4. Cómo personalizar los colores (Gama 1 Lujo Cálido)

Todos los colores están definidos mediante variables CSS en la parte superior de [`css/style.css`](./css/style.css):

```css
:root {
  --bg-dark: #0B0B1E;        /* Fondo oscuro principal */
  --bg-light: #F5EFE6;       /* Fondo claro crema cálido */
  --gold: #D9B98A;           /* Dorado champaña (botones, bordes, títulos, iconos) */
  --terracotta: #C98A6B;     /* Terracota suave (ofertas, badges, detalles) */
  --text-light: #FFFFFF;     /* Texto sobre fondo oscuro */
  --text-dark: #1A1A1A;      /* Texto sobre fondo claro */
}
```

---

## 🚀 5. Cómo subir tu web gratis a Netlify o Vercel

### Opción A: Netlify Drop (En 30 segundos sin comandos)
1. Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastra la carpeta completa del proyecto.
3. ¡Listo! Netlify te dará un enlace HTTPS público (ej. `https://darvele.netlify.app`) que puedes poner en la biografía de Instagram `@darvele_`.

### Opción B: Vercel o Netlify con GitHub
1. Sube estos archivos a un repositorio de GitHub.
2. Entra a [vercel.com](https://vercel.com) o [netlify.com](https://netlify.com) y selecciona **"Import Project"**.
3. Como es un proyecto HTML/CSS/JS estático puro, no requiere comando de compilación (`Build Command` vacío y `Output Directory` en `.`).
4. Cada vez que actualices tus productos desde `admin.html`, puedes usar el botón **"Exportar JSON"** para guardar tu copia de seguridad.
