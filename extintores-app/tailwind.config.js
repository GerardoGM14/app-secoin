/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // opcional si no necesitas reset
  },
  experimental: {
    optimizeUniversalDefaults: true, // opcional, mejora compatibilidad
  },
  future: {
    // Evita que se usen nuevas funciones CSS modernas
    hoverOnlyWhenSupported: false,
  },
}