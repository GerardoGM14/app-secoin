import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const generateVersionPlugin = () => {
  return {
    name: 'generate-version-json',
    writeBundle() {
      const versionData = { version: new Date().getTime().toString() }
      fs.writeFileSync('dist/version.json', JSON.stringify(versionData))
      
      // Escribir también en public para que el servidor de desarrollo lo pueda detectar si el usuario corre build en otra terminal
      if (fs.existsSync('public')) {
        fs.writeFileSync('public/version.json', JSON.stringify(versionData))
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateVersionPlugin()],
  optimizeDeps: {
    include: [
      "@amcharts/amcharts5",
      "@amcharts/amcharts5/xy",
      "@amcharts/amcharts5/percent",
      "@amcharts/amcharts5/themes/Animated"
    ]
  },
  server: {
    port: 5173,
  },
})
