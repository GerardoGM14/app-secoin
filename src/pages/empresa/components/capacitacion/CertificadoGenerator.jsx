"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import Swal from "sweetalert2"
import QRCode from "qrcode"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function CertificadoGenerator({
  mostrar,
  onClose,
  datosUsuario,
  datosCurso,
  notaObtenida,
  fechaEvaluacion,
  pinEmpresa,
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [certificadoId, setCertificadoId] = useState("")
  const [generando, setGenerando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const certificadoRef = useRef()

  console.log("🏆 CertificadoGenerator - Iniciando")
  console.log("👤 Datos usuario:", datosUsuario)
  console.log("📚 Datos curso:", datosCurso)
  console.log("📊 Nota obtenida:", notaObtenida)

  useEffect(() => {
    if (mostrar && datosUsuario && datosCurso) {
      generarCertificado()
    }
  }, [mostrar, datosUsuario, datosCurso])

  const generarCertificado = async () => {
    setGenerando(true)
    try {
      console.log("🔄 Generando certificado...")

      // Generar ID único para el certificado
      const timestamp = Date.now()
      const idCertificado = `CERT-${datosUsuario.dniUsuario}-${timestamp}`
      setCertificadoId(idCertificado)

      // Datos para el certificado
      const datosCertificado = {
        id: idCertificado,
        nombreUsuario: datosUsuario.nombreUsuario,
        dniUsuario: datosUsuario.dniUsuario,
        cargoUsuario: datosUsuario.cargoUsuario,
        empresaUsuario: datosUsuario.empresaUsuario,
        cursoId: datosCurso.id,
        cursoTitulo: datosCurso.titulo,
        notaObtenida,
        fechaEvaluacion,
        fechaEmision: Timestamp.now(),
        pinEmpresa,
        estado: "activo",
        tipo: "capacitacion",
      }

      // Guardar en Firebase
      await addDoc(collection(db, "certificados"), datosCertificado)
      console.log("💾 Certificado guardado en Firebase:", idCertificado)

      // URL para validación del QR
      const urlValidacion = `${window.location.origin}/validar-certificado/${idCertificado}`

      // Generar código QR
      const qrUrl = await QRCode.toDataURL(urlValidacion, {
        width: 200,
        margin: 2,
        color: {
          dark: "#dc2626", // Rojo del sistema
          light: "#ffffff",
        },
      })
      setQrCodeUrl(qrUrl)
      console.log("🔗 QR generado para:", urlValidacion)

      Swal.fire({
        title: "🎉 ¡Certificado Generado!",
        text: "Tu certificado ha sido creado exitosamente",
        icon: "success",
        confirmButtonColor: "#dc2626",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("❌ Error al generar certificado:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el certificado",
        icon: "error",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setGenerando(false)
    }
  }

  const descargarPDF = async () => {
    if (!certificadoRef.current) return

    setDescargando(true)
    try {
      console.log("📄 Generando PDF...")

      // Capturar el certificado como imagen
      const canvas = await html2canvas(certificadoRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Crear PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 297 // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Nombre del archivo
      const nombreArchivo = `Certificado_${datosUsuario.nombreUsuario.replace(/\s+/g, "_")}_${datosCurso.titulo.replace(
        /\s+/g,
        "_",
      )}.pdf`

      pdf.save(nombreArchivo)
      console.log("✅ PDF descargado:", nombreArchivo)

      Swal.fire({
        title: "📄 Descarga Completada",
        text: "El certificado se ha descargado exitosamente",
        icon: "success",
        confirmButtonColor: "#dc2626",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("❌ Error al descargar PDF:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo descargar el certificado",
        icon: "error",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setDescargando(false)
    }
  }

  const compartirCertificado = async () => {
    const urlValidacion = `${window.location.origin}/validar-certificado/${certificadoId}`
    const texto = `🎉 ¡He completado exitosamente la capacitación "${datosCurso.titulo}"!\n\n📊 Nota obtenida: ${notaObtenida}/20\n🏢 Empresa: ${datosUsuario.empresaUsuario}\n\n🔗 Validar certificado: ${urlValidacion}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Certificado de Capacitación",
          text: texto,
          url: urlValidacion,
        })
        console.log("📤 Certificado compartido exitosamente")
      } catch (error) {
        console.log("❌ Error al compartir:", error)
        copiarEnlace(urlValidacion)
      }
    } else {
      copiarEnlace(urlValidacion)
    }
  }

  const copiarEnlace = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        Swal.fire({
          title: "📋 Enlace Copiado",
          text: "El enlace de validación ha sido copiado al portapapeles",
          icon: "success",
          confirmButtonColor: "#dc2626",
          timer: 2000,
          showConfirmButton: false,
        })
      })
      .catch(() => {
        Swal.fire({
          title: "Enlace de Validación",
          html: `
            <div class="text-left">
              <p class="mb-3">Copia este enlace para validar el certificado:</p>
              <div class="bg-gray-100 p-3 rounded-lg text-sm break-all">
                ${url}
              </div>
            </div>
          `,
          icon: "info",
          confirmButtonColor: "#dc2626",
        })
      })
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ""
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha)
    return fechaObj.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!mostrar) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="bg-white w-full max-w-6xl rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Certificado de Capacitación</h2>
                <p className="text-sm text-white/80">ID: {certificadoId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={compartirCertificado}
                disabled={generando}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur-sm"
                title="Compartir certificado"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>

              <button
                onClick={descargarPDF}
                disabled={generando || descargando}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur-sm"
                title="Descargar PDF"
              >
                {descargando ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur-sm"
                title="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del certificado */}
          <div className="p-6 bg-gray-50 overflow-y-auto max-h-[calc(100vh-200px)]">
            {generando ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Generando certificado...</p>
              </div>
            ) : (
              <div className="flex justify-center">
                {/* Certificado */}
                <div
                  ref={certificadoRef}
                  className="bg-white shadow-2xl rounded-lg overflow-hidden"
                  style={{ width: "842px", height: "595px" }} // A4 landscape
                >
                  {/* Borde decorativo */}
                  <div className="h-full relative bg-gradient-to-br from-red-50 to-rose-100 p-8">
                    <div className="h-full border-4 border-red-600 rounded-lg relative bg-white p-8">
                      {/* Patrón de fondo */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-4 left-4 w-32 h-32 bg-red-600 rounded-full"></div>
                        <div className="absolute bottom-4 right-4 w-24 h-24 bg-red-600 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-600 rounded-full"></div>
                      </div>

                      {/* Contenido del certificado */}
                      <div className="relative z-10 h-full flex flex-col">
                        {/* Header */}
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                          </div>
                          <h1 className="text-4xl font-bold text-red-600 mb-2">CERTIFICADO</h1>
                          <p className="text-lg text-gray-600">DE CAPACITACIÓN</p>
                        </div>

                        {/* Contenido principal */}
                        <div className="flex-1 flex flex-col justify-center text-center">
                          <p className="text-lg text-gray-700 mb-4">Se certifica que</p>

                          <h2 className="text-3xl font-bold text-gray-900 mb-2 border-b-2 border-red-600 pb-2 inline-block">
                            {datosUsuario.nombreUsuario}
                          </h2>

                          <p className="text-base text-gray-600 mb-6">
                            DNI: {datosUsuario.dniUsuario} | Cargo: {datosUsuario.cargoUsuario}
                          </p>

                          <p className="text-lg text-gray-700 mb-2">ha completado exitosamente la capacitación</p>

                          <h3 className="text-2xl font-bold text-red-600 mb-4">"{datosCurso.titulo}"</h3>

                          <div className="grid grid-cols-3 gap-8 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{notaObtenida}</div>
                              <div className="text-sm text-gray-600">Nota Obtenida</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {formatearFecha(fechaEvaluacion).split(" ")[0]}
                              </div>
                              <div className="text-sm text-gray-600">Día</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{new Date().getFullYear()}</div>
                              <div className="text-sm text-gray-600">Año</div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-4">
                            Empresa: <span className="font-semibold">{datosUsuario.empresaUsuario}</span>
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-end">
                          <div className="text-left">
                            <div className="border-t-2 border-gray-400 pt-2 w-48">
                              <p className="text-sm font-semibold text-gray-700">Instructor Certificado</p>
                              <p className="text-xs text-gray-500">Sistema de Capacitaciones</p>
                            </div>
                          </div>

                          <div className="text-center">
                            {qrCodeUrl && (
                              <div>
                                <img
                                  src={qrCodeUrl || "/placeholder.svg"}
                                  alt="QR Code"
                                  className="w-20 h-20 mx-auto mb-2"
                                />
                                <p className="text-xs text-gray-500">Validar certificado</p>
                                <p className="text-xs text-gray-400 font-mono">{certificadoId}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="border-t-2 border-gray-400 pt-2 w-48">
                              <p className="text-sm font-semibold text-gray-700">{formatearFecha(fechaEvaluacion)}</p>
                              <p className="text-xs text-gray-500">Fecha de emisión</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Certificado válido</span> • Verificable mediante código QR
            </div>

            <div className="flex gap-3">
              <button
                onClick={compartirCertificado}
                disabled={generando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Compartir
              </button>

              <button
                onClick={descargarPDF}
                disabled={generando || descargando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {descargando ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {descargando ? "Descargando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CertificadoGenerator
