<div align="center">

# 🔥 Red SECOIN — Sistema de Gestión de Seguridad Contra Incendios

**Plataforma integral para la gestión, inspección y certificación de equipos contra incendios**

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://extintores-app.web.app)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: Source Available](https://img.shields.io/badge/License-Source%20Available-red?style=for-the-badge)](#licencia)

</div>

---

## 📋 Descripción

**Red SECOIN** es un sistema web profesional diseñado para empresas del rubro de seguridad contra incendios. Permite gestionar de forma centralizada las inspecciones de extintores, capacitaciones de personal, generación de certificados digitales verificables por QR, administración documental y monitoreo en tiempo real de las actividades operativas.

El sistema cuenta con tres paneles diferenciados por rol:

- 🔴 **Panel de Administrador** — Gestión completa de empresas, documentos, inspecciones, capacitaciones y monitoreo.
- 🟢 **Panel de Empresa** — Acceso a documentación, certificados, capacitaciones y administración de su información.
- 🔵 **Panel de Trabajador** — Acceso a cursos asignados, evaluaciones y descarga de certificados.

---

## ✨ Características Principales

| Módulo | Descripción |
|--------|------------|
| **🔐 Autenticación** | Login con Firebase Auth, roles diferenciados (admin, empresa, trabajador) |
| **📊 Dashboard Analítico** | Gráficos interactivos con amCharts 5 (área, barras, pie) |
| **📝 Inspecciones** | Registro, seguimiento y reportes de inspecciones de extintores |
| **🎓 Capacitaciones** | Cursos, evaluaciones con nota, y registro de asistencia |
| **📜 Certificados Digitales** | Generación automática de certificados PDF con código QR verificable |
| **🔍 Validación Pública** | Verificación de certificados vía QR sin necesidad de iniciar sesión |
| **📂 Gestión Documental** | Cotizaciones, órdenes de servicio, guías de remisión, actas, facturas |
| **📍 Geolocalización** | Tracking en tiempo real de trabajadores conectados |
| **💬 Mensajería** | Sistema de comunicación interna entre administrador y empresas |
| **🔄 Auto-Actualización** | Detección automática de nuevas versiones con modal de actualización forzada |

---

## 🏗️ Arquitectura del Proyecto

```
app-secoin/
├── extintores-app/              # Aplicación principal
│   ├── public/                  # Assets estáticos y version.json
│   ├── src/
│   │   ├── components/          # Componentes globales (VersionChecker, Geo...)
│   │   ├── firebase/            # Configuración de Firebase
│   │   ├── pages/
│   │   │   ├── admin/           # Panel de Administrador
│   │   │   │   ├── components/  # Sidebar, Dashboard, Charts, Inspección...
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── empresa/         # Panel de Empresa
│   │   │   │   └── components/  # Administración, Capacitación, Certificados...
│   │   │   ├── trabajador/      # Panel de Trabajador
│   │   │   ├── publico/         # Páginas de acceso público
│   │   │   ├── validacion/      # Validador de certificados
│   │   │   └── components/      # Componentes compartidos (Certificados)
│   │   ├── styles/              # Estilos globales
│   │   ├── utils/               # Utilidades y helpers
│   │   ├── App.jsx              # Router principal con rutas protegidas
│   │   └── main.jsx             # Entry point
│   ├── vite.config.js           # Configuración de Vite + plugin de versioning
│   └── package.json
├── certificado-secoin/          # Micrositio de validación de certificados
├── firebase.json                # Configuración de Firebase Hosting
└── README.md
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | React 19, JSX |
| **Bundler** | Vite 6 |
| **Estilos** | Tailwind CSS 4, DaisyUI 5 |
| **Animaciones** | Framer Motion 12 |
| **Gráficos** | amCharts 5, Recharts |
| **Backend/BaaS** | Firebase (Auth, Firestore, Storage, Hosting) |
| **PDF** | jsPDF + html2canvas (carga dinámica) |
| **QR** | qrcode |
| **Alertas** | SweetAlert2 |
| **Iconos** | Heroicons, Lucide React |
| **Routing** | React Router DOM 7 |

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Firebase CLI](https://firebase.google.com/docs/cli) (para despliegue)

### Configuración Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/GerardoGM14/app-secoin.git
cd app-secoin/extintores-app

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Abrir en el navegador
# → http://localhost:5173
```

### Construcción para Producción

```bash
# Generar el build optimizado (incluye version.json automático)
npm run build

# Vista previa del build
npm run preview
```

### Despliegue a Firebase

```bash
# Desde la raíz del proyecto
firebase deploy --only hosting:extintores-app
```

---

## 🔄 Sistema de Versionado Automático

El proyecto incluye un mecanismo de detección de versiones en tiempo real:

1. Al ejecutar `npm run build`, un plugin de Vite genera automáticamente un archivo `version.json` con una marca de tiempo única.
2. El componente `VersionChecker` consulta periódicamente este archivo desde el navegador.
3. Si detecta un cambio de versión tras un nuevo despliegue, muestra un **modal obligatorio** que fuerza al usuario a actualizar la página, garantizando que todos los clientes conectados siempre trabajen con la última versión del sistema.

---

## 📸 Capturas de Pantalla

> Las capturas de pantalla se encuentran disponibles en la aplicación desplegada.

| Vista | URL |
|-------|-----|
| **Sistema Principal** | [extintores-app.web.app](https://extintores-app.web.app) |
| **Validador de Certificados** | [certificado.redsecoin.com](https://certificado.redsecoin.com) |

---

## 👥 Roles del Sistema

### 🔴 Administrador
Acceso completo al sistema: gestión de empresas, carga de documentos, inspecciones, capacitaciones, monitoreo en tiempo real, herramientas de configuración y generación de certificados.

### 🟢 Empresa
Acceso a su panel exclusivo con: visualización de documentos asignados (cotizaciones, órdenes de servicio, guías, actas, facturas, certificados), módulo de capacitación con evaluaciones, y descarga de certificados.

### 🔵 Trabajador
Acceso a cursos de capacitación asignados, evaluaciones interactivas, y descarga de certificados obtenidos tras aprobar.

---

## 📄 Licencia

Este proyecto está protegido bajo una **Licencia de Solo Visualización (Source Available)**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

> **En resumen:** Puedes ver y estudiar el código fuente, pero **no** puedes copiarlo, modificarlo, distribuirlo ni usarlo con fines comerciales o personales sin autorización expresa del autor.

---

## 👨‍💻 Autor

Desarrollado por **Gerardo GM** — [GitHub](https://github.com/GerardoGM14)

---

<div align="center">

**Red SECOIN** © 2026 — Todos los derechos reservados.

</div>
