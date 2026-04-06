# Certificado SECOIN - Validador de Certificados

Aplicación web dedicada exclusivamente a la validación de certificados emitidos por el sistema SECOIN.

## Características

- 🔍 Búsqueda de certificados por código
- ✅ Validación en tiempo real contra Firebase
- 📄 Vista previa del certificado con diseño profesional
- 📱 Diseño responsive
- 🎨 Interfaz moderna con animaciones

## Tecnologías

- React 19
- Vite
- Tailwind CSS
- Firebase Firestore
- Framer Motion
- QRCode

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
certificado-secoin/
├── src/
│   ├── firebase/
│   │   └── firebaseConfig.js    # Configuración de Firebase
│   ├── pages/
│   │   ├── ValidarCertificado.jsx  # Página de búsqueda
│   │   └── CertificadoVista.jsx     # Vista del certificado
│   ├── utils/
│   │   └── format.js            # Utilidades de formato
│   ├── App.jsx                  # Componente principal
│   └── main.jsx                 # Punto de entrada
├── index.html
└── package.json
```

## Uso

1. Ingrese el código del certificado en la página principal
2. El sistema buscará el certificado en la base de datos
3. Si es válido, se mostrará una vista previa completa del certificado
4. El certificado incluye código QR para validación adicional

## Notas

- Este proyecto utiliza la misma configuración de Firebase que `app-secoin`
- Los certificados se validan contra la colección `certificados` en Firestore
- El diseño respeta el estilo visual de la aplicación principal

