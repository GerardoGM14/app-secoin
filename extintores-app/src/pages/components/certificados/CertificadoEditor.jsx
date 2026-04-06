"use client"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import CertificadoCorporativo from "./CertificadoCorporativo"

export default function CertificadoEditor() {
  const certificadoRef = useRef()
  const [generandoPDF, setGenerandoPDF] = useState(false)

  // Datos editables del certificado
  const [datosCertificado, setDatosCertificado] = useState({
    nombreCompleto: "Juan Carlos Pérez García",
    dni: "12345678",
    cargo: "Operario de Construcción",
    empresa: "Constructora ABC S.A.C.",
    tituloCurso: "Seguridad y Salud Ocupacional en Construcción",
    nota: 18,
    fechaEvaluacion: new Date().toLocaleDateString("es-PE"),
    idCertificado: "CERT-12345678-2024001",
  })

  const actualizarDato = (campo, valor) => {
    setDatosCertificado((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const descargarPDF = async () => {
    setGenerandoPDF(true)

    try {
      // Importar librerías dinámicamente con manejo correcto de jsPDF
      const [jsPDFModule, html2canvas] = await Promise.all([import("jspdf"), import("html2canvas")])

      // Acceder correctamente al constructor de jsPDF
      const { jsPDF } = jsPDFModule
      const html2canvasDefault = html2canvas.default

      const elemento = certificadoRef.current

      if (!elemento) {
        throw new Error("No se encontró el elemento del certificado")
      }

      // Crear un contenedor temporal con estilos forzados
      const contenedorTemporal = document.createElement("div")
      contenedorTemporal.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 1200px;
        height: 850px;
        background: #ffffff;
        z-index: -9999;
        font-family: Arial, sans-serif;
      `

      // Clonar el elemento
      const elementoClonado = elemento.cloneNode(true)

      // Función para convertir todos los colores oklch a RGB
      const convertirColoresOklch = (elemento) => {
        const walker = document.createTreeWalker(elemento, NodeFilter.SHOW_ELEMENT, null, false)

        const elementos = [elemento]
        let nodo
        while ((nodo = walker.nextNode())) {
          elementos.push(nodo)
        }

        elementos.forEach((el) => {
          // Aplicar estilos inline basados en las clases para evitar OKLCH
          if (el.classList.contains("bg-gradient-to-br")) {
            el.style.background = "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)"
            el.style.backgroundImage = "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)"
          }

          if (el.classList.contains("bg-gradient-to-r")) {
            el.style.background = "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)"
            el.style.backgroundImage = "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)"
          }

          // Colores de texto
          if (el.classList.contains("text-white")) el.style.color = "#ffffff"
          if (el.classList.contains("text-red-600")) el.style.color = "#dc2626"
          if (el.classList.contains("text-red-700")) el.style.color = "#b91c1c"
          if (el.classList.contains("text-red-100")) el.style.color = "#fee2e2"
          if (el.classList.contains("text-gray-900")) el.style.color = "#111827"
          if (el.classList.contains("text-gray-800")) el.style.color = "#1f2937"
          if (el.classList.contains("text-gray-700")) el.style.color = "#374151"
          if (el.classList.contains("text-gray-600")) el.style.color = "#4b5563"
          if (el.classList.contains("text-gray-500")) el.style.color = "#6b7280"
          if (el.classList.contains("text-green-600")) el.style.color = "#059669"
          if (el.classList.contains("text-green-700")) el.style.color = "#047857"

          // Backgrounds
          if (el.classList.contains("bg-white")) el.style.backgroundColor = "#ffffff"
          if (el.classList.contains("bg-red-600")) el.style.backgroundColor = "#dc2626"
          if (el.classList.contains("bg-red-700")) el.style.backgroundColor = "#b91c1c"
          if (el.classList.contains("bg-red-50")) el.style.backgroundColor = "#fef2f2"
          if (el.classList.contains("bg-gray-50")) el.style.backgroundColor = "#f9fafb"
          if (el.classList.contains("bg-gray-100")) el.style.backgroundColor = "#f3f4f6"
          if (el.classList.contains("bg-gray-200")) el.style.backgroundColor = "#e5e7eb"
          if (el.classList.contains("bg-green-50")) el.style.backgroundColor = "#f0fdf4"

          // Borders
          if (el.classList.contains("border-red-600")) el.style.borderColor = "#dc2626"
          if (el.classList.contains("border-red-200")) el.style.borderColor = "#fecaca"
          if (el.classList.contains("border-gray-200")) el.style.borderColor = "#e5e7eb"
          if (el.classList.contains("border-gray-400")) el.style.borderColor = "#9ca3af"
          if (el.classList.contains("border-l-4")) el.style.borderLeft = "4px solid #dc2626"

          // Remover clases problemáticas pero mantener estructura
          const classesToKeep = [
            "w-",
            "h-",
            "p-",
            "m-",
            "flex",
            "grid",
            "col-",
            "row-",
            "gap-",
            "space-",
            "items-",
            "justify-",
            "text-",
            "font-",
            "rounded",
            "shadow",
            "relative",
            "absolute",
            "inset-",
            "top-",
            "bottom-",
            "left-",
            "right-",
            "overflow-",
          ]

          const newClasses = Array.from(el.classList).filter((cls) =>
            classesToKeep.some((keep) => cls.startsWith(keep)),
          )

          el.className = newClasses.join(" ")
        })
      }

      // Aplicar conversión de colores
      convertirColoresOklch(elementoClonado)

      // Agregar al DOM temporal
      contenedorTemporal.appendChild(elementoClonado)
      document.body.appendChild(contenedorTemporal)

      // Esperar un momento para que se apliquen los estilos
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Configuración de html2canvas sin colores problemáticos
      const canvas = await html2canvasDefault(elementoClonado, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 1200,
        height: 850,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: 850,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          // Agregar CSS para forzar colores RGB
          const style = clonedDoc.createElement("style")
          style.textContent = `
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: Arial, sans-serif !important;
            }
            
            /* Forzar todos los colores a RGB */
            .text-white { color: #ffffff !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-red-700 { color: #b91c1c !important; }
            .text-red-100 { color: #fee2e2 !important; }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-green-600 { color: #059669 !important; }
            .text-green-700 { color: #047857 !important; }
            
            .bg-white { background-color: #ffffff !important; }
            .bg-red-600 { background-color: #dc2626 !important; }
            .bg-red-700 { background-color: #b91c1c !important; }
            .bg-red-50 { background-color: #fef2f2 !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
            .bg-green-50 { background-color: #f0fdf4 !important; }
            
            .bg-gradient-to-br {
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%) !important;
            }
            .bg-gradient-to-r {
              background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%) !important;
            }
            
            .border-red-600 { border-color: #dc2626 !important; }
            .border-red-200 { border-color: #fecaca !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .border-gray-400 { border-color: #9ca3af !important; }
            .border-l-4 { border-left: 4px solid #dc2626 !important; }
          `
          clonedDoc.head.appendChild(style)
        },
      })

      // Limpiar elemento temporal
      document.body.removeChild(contenedorTemporal)

      // Crear PDF con constructor correcto
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      // Dimensiones del PDF A4 landscape
      const pdfWidth = 297
      const pdfHeight = 210

      // Calcular dimensiones manteniendo proporción
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio

      // Centrar la imagen en el PDF
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      // Convertir canvas a imagen
      const imgData = canvas.toDataURL("image/png", 1.0)

      // Agregar imagen al PDF
      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight, undefined, "FAST")

      // Descargar PDF
      const nombreArchivo = `Certificado_${datosCertificado.nombreCompleto.replace(/\s+/g, "_")}.pdf`
      pdf.save(nombreArchivo)

      console.log("PDF generado exitosamente")
    } catch (error) {
      console.error("Error detallado al generar PDF:", error)
      alert(`Error al generar el PDF: ${error.message}. Por favor, recarga la página e inténtalo de nuevo.`)
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Editor de Certificado Corporativo</h1>
          <p className="text-gray-600 text-lg">Personaliza y descarga tu certificado profesional en PDF</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Panel de edición */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Editar Datos</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    value={datosCertificado.nombreCompleto}
                    onChange={(e) => actualizarDato("nombreCompleto", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">DNI</label>
                    <input
                      type="text"
                      value={datosCertificado.dni}
                      onChange={(e) => actualizarDato("dni", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nota</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={datosCertificado.nota}
                      onChange={(e) => actualizarDato("nota", Number.parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  <input
                    type="text"
                    value={datosCertificado.cargo}
                    onChange={(e) => actualizarDato("cargo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                  <input
                    type="text"
                    value={datosCertificado.empresa}
                    onChange={(e) => actualizarDato("empresa", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título del Curso</label>
                  <textarea
                    value={datosCertificado.tituloCurso}
                    onChange={(e) => actualizarDato("tituloCurso", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Evaluación</label>
                  <input
                    type="date"
                    value={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      actualizarDato("fechaEvaluacion", new Date(e.target.value).toLocaleDateString("es-PE"))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID del Certificado</label>
                  <input
                    type="text"
                    value={datosCertificado.idCertificado}
                    onChange={(e) => actualizarDato("idCertificado", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    QR generado automáticamente: secoin.vercel.app/validar-certificado/{datosCertificado.idCertificado}
                  </p>
                </div>
              </div>

              {/* Botón de descarga PDF optimizado */}
              <div className="mt-8">
                <button
                  onClick={descargarPDF}
                  disabled={generandoPDF}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {generandoPDF ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Descargar PDF Corporativo
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Elementos faltantes detectados:</h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Sección de firmas en la parte inferior</li>
                  <li>• Sello circular de validación</li>
                  <li>• Sidebar completo con estadísticas</li>
                  <li>• Layout de 4 columnas no se renderiza completo</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Vista previa del certificado */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Vista Previa del Certificado Corporativo</h3>
                <p className="text-gray-600">Diseño profesional con layout optimizado</p>
              </div>

              <div className="flex justify-center">
                <div
                  ref={certificadoRef}
                  className="transform scale-75 origin-top"
                  style={{ transformOrigin: "top center" }}
                >
                  <CertificadoCorporativo datos={datosCertificado} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
