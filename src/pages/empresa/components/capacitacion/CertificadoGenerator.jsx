"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import Swal from "sweetalert2"
import QRCode from "qrcode"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid"

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
  const [qrCodeIdUrl, setQrCodeIdUrl] = useState("") // QR con el ID del certificado
  const [certificadoId, setCertificadoId] = useState("")
  const [generando, setGenerando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [mostrarModalError, setMostrarModalError] = useState(false)
  const [mostrarModalDescarga, setMostrarModalDescarga] = useState(false)
  const [validandoDescarga, setValidandoDescarga] = useState(false)
  const [mensajeError, setMensajeError] = useState("")
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

      // Generar código QR para validación (URL)
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

      // Generar código QR pequeño con el ID del certificado
      const qrIdUrl = await QRCode.toDataURL(idCertificado, {
        width: 100,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      setQrCodeIdUrl(qrIdUrl)
      console.log("🆔 QR ID generado para:", idCertificado)

      // Mostrar modal de éxito
      setMostrarModalExito(true)
      setTimeout(() => {
        setMostrarModalExito(false)
      }, 2000)
    } catch (error) {
      console.error("❌ Error al generar certificado:", error)
      setMensajeError("No se pudo generar el certificado")
      setMostrarModalError(true)
    } finally {
      setGenerando(false)
    }
  }

  const descargarPDF = async () => {
    if (!certificadoRef.current) return

    setDescargando(true)
    try {
      console.log("📄 Generando PDF...")

      // Agregar clase para ajustar posicionamiento durante la captura
      // Mover el contenido principal 8px hacia arriba para compensar diferencia en PDF
      const contenidoPrincipal = certificadoRef.current.querySelector('.contenido-principal-certificado')
      if (contenidoPrincipal) {
        contenidoPrincipal.style.transform = 'translateY(-8px)'
      }

      // Mover el nombre del usuario un poco más arriba (12px)
      const nombreUsuario = certificadoRef.current.querySelector('.nombre-usuario-certificado')
      if (nombreUsuario) {
        nombreUsuario.style.transform = 'translateY(-12px)'
      }

      // Capturar el certificado como imagen
      const canvas = await html2canvas(certificadoRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Restaurar los estilos originales después de la captura
      if (contenidoPrincipal) {
        contenidoPrincipal.style.transform = ''
      }
      if (nombreUsuario) {
        nombreUsuario.style.transform = ''
      }

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

      // Nombre del archivo: código QR
      const nombreArchivo = `${certificadoId}.pdf`

      pdf.save(nombreArchivo)
      console.log("✅ PDF descargado:", nombreArchivo)

      // Mostrar animación de validación primero
      setValidandoDescarga(true)
      setMostrarModalDescarga(true)
      
      // Después de 1.5 segundos, mostrar el éxito
      setTimeout(() => {
        setValidandoDescarga(false)
      }, 1500)
      
      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        setMostrarModalDescarga(false)
      }, 3000)
    } catch (error) {
      console.error("❌ Error al descargar PDF:", error)
      setMensajeError("No se pudo descargar el certificado")
      setMostrarModalError(true)
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

  const obtenerDiaMes = (fecha) => {
    if (!fecha) return ""
    try {
      let fechaObj
      if (fecha.toDate) {
        // Es un Timestamp de Firestore
        fechaObj = fecha.toDate()
      } else if (typeof fecha === "string") {
        // Es un string de fecha
        fechaObj = new Date(fecha)
      } else if (fecha instanceof Date) {
        // Ya es un objeto Date
        fechaObj = fecha
      } else {
        // Intentar parsear como fecha
        fechaObj = new Date(fecha)
      }
      
      // Validar que la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.warn("Fecha inválida:", fecha)
        const hoy = new Date()
        return hoy.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
      }
      
      // Retornar formato "Diciembre, 17"
      return fechaObj.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
    } catch (error) {
      console.error("Error al obtener día:", error)
      const hoy = new Date()
      return hoy.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
    }
  }

  if (!mostrar) return null

  return (
    <>
      {/* Modal de Certificado Generado */}
      <AnimatePresence>
        {mostrarModalExito && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6 border"
              style={{ backgroundColor: "hsl(0, 0%, 100%)", borderColor: "hsl(210, 16%, 93%)" }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full mb-4" style={{ backgroundColor: "hsl(142, 76%, 94%)" }}>
                  <CheckCircleIcon className="h-8 w-8" style={{ color: "hsl(142, 71%, 45%)" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "hsl(210, 11%, 15%)" }}>
                  ¡Certificado Generado!
                </h3>
                <p className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>
                  Tu certificado ha sido creado exitosamente
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Descarga Completada */}
      <AnimatePresence>
        {mostrarModalDescarga && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6 border"
              style={{ backgroundColor: "hsl(0, 0%, 100%)", borderColor: "hsl(210, 16%, 93%)" }}
            >
              <div className="flex flex-col items-center text-center">
                {validandoDescarga ? (
                  <>
                    <div className="p-3 rounded-full mb-4" style={{ backgroundColor: "hsl(142, 76%, 94%)" }}>
                      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(142, 71%, 45%)" }}></div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: "hsl(210, 11%, 15%)" }}>
                      Validando descarga...
                    </h3>
                    <p className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>
                      Verificando que el certificado se haya descargado correctamente
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full mb-4" style={{ backgroundColor: "hsl(142, 76%, 94%)" }}>
                      <CheckCircleIcon className="h-8 w-8" style={{ color: "hsl(142, 71%, 45%)" }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: "hsl(210, 11%, 15%)" }}>
                      ¡Descarga Completada!
                    </h3>
                    <p className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>
                      El certificado se ha descargado exitosamente
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Error */}
      <AnimatePresence>
        {mostrarModalError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6 border"
              style={{ backgroundColor: "hsl(0, 0%, 100%)", borderColor: "hsl(210, 16%, 93%)" }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full mb-4" style={{ backgroundColor: "hsl(0, 78%, 97%)" }}>
                  <XCircleIcon className="h-8 w-8" style={{ color: "hsl(0, 72%, 51%)" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "hsl(210, 11%, 15%)" }}>
                  Error
                </h3>
                <p className="text-sm mb-6" style={{ color: "hsl(210, 9%, 31%)" }}>
                  {mensajeError}
                </p>
                <button
                  onClick={() => setMostrarModalError(false)}
                  className="w-full px-4 py-2 text-white rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: "hsl(0, 72%, 51%)" }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "hsl(0, 74%, 42%)")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "hsl(0, 72%, 51%)")}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal principal del certificado */}
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
          <div className="text-white p-4 flex justify-between items-center" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}>
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
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]" style={{ backgroundColor: "hsl(210, 20%, 98%)" }}>
            {generando ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "hsl(0, 84%, 60%)" }}></div>
                <p className="font-medium" style={{ color: "hsl(210, 9%, 31%)" }}>Generando certificado...</p>
              </div>
            ) : (
              <div className="flex justify-center">
                {/* Certificado */}
                <div
                  ref={certificadoRef}
                  className="shadow-2xl rounded-lg overflow-hidden"
                  style={{ backgroundColor: "hsl(0, 0%, 100%)", width: "842px", height: "595px" }} // A4 landscape
                >
                  {/* Borde decorativo */}
                  <div className="h-full relative p-8" style={{ backgroundColor: "hsl(0, 78%, 97%)" }}>
                    <div className="h-full border-4 rounded-lg relative p-8" style={{ borderColor: "hsl(0, 72%, 51%)", backgroundColor: "hsl(0, 0%, 100%)" }}>
                      {/* Patrón de fondo */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-4 left-4 w-32 h-32 rounded-full" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}></div>
                        <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}></div>
                      </div>

                      {/* Contenido del certificado */}
                      <div className="relative z-10 h-full flex flex-col">
                        {/* Cuadro rojo superior izquierdo - Logo */}
                        <div className="absolute top-0 left-0 p-4 rounded-br-lg" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}>
                          <div className="flex flex-col items-center">
                            {/* Espacio para Logo */}
                            <div className="w-20 h-20 rounded flex items-center justify-center" style={{ backgroundColor: "hsla(0, 0%, 100%, 0.2)" }}>
                              {/* Aquí irá el logo - usar img tag cuando esté disponible */}
                              {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" /> */}
                            </div>
                          </div>
                        </div>

                        {/* Cuadro rojo superior derecho - QR */}
                        <div className="absolute top-0 right-0 p-4 rounded-bl-lg" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}>
                          <div className="flex flex-col items-center">
                            {/* QR pequeño con ID del certificado */}
                            {qrCodeIdUrl && (
                              <div className="flex flex-col items-center">
                                <img
                                  src={qrCodeIdUrl}
                                  alt="QR ID Certificado"
                                  className="w-16 h-16 p-1 rounded"
                                  style={{ backgroundColor: "hsl(0, 0%, 100%)" }}
                                />
                                <p className="text-xs text-white font-mono mt-1 text-center max-w-[80px] break-all">
                                  {certificadoId}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-6" style={{ position: "relative", zIndex: 20 }}>
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "hsl(0, 72%, 51%)", position: "relative", zIndex: 21 }}>
                            <svg className="w-10 h-10" style={{ color: "hsl(0, 0%, 100%)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                          </div>
                          <h1 className="text-4xl font-bold mb-2" style={{ color: "hsl(0, 72%, 51%)" }}>CERTIFICADO</h1>
                          <p className="text-lg" style={{ color: "hsl(210, 9%, 31%)" }}>DE CAPACITACIÓN</p>
                        </div>

                        {/* Contenido principal */}
                        <div className="flex-1 flex flex-col justify-center text-center contenido-principal-certificado">
                          <p className="text-lg mb-4" style={{ color: "hsl(210, 10%, 23%)" }}>Se certifica que</p>

                          <h2 className="text-3xl font-bold mb-2 border-b-2 inline-block nombre-usuario-certificado" style={{ borderColor: "hsl(0, 72%, 51%)", color: "hsl(210, 11%, 15%)", paddingBottom: "12px" }}>
                            {datosUsuario.nombreUsuario}
                          </h2>

                          <p className="text-base mb-6" style={{ color: "hsl(210, 9%, 31%)" }}>
                            DNI: {datosUsuario.dniUsuario} | Cargo: {datosUsuario.cargoUsuario}
                          </p>

                          <p className="text-lg mb-2" style={{ color: "hsl(210, 10%, 23%)" }}>ha completado exitosamente la capacitación</p>

                          <h3 className="text-2xl font-bold mb-4" style={{ color: "hsl(0, 72%, 51%)" }}>"{datosCurso.titulo}"</h3>

                          <div className="grid grid-cols-3 gap-8 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{notaObtenida}</div>
                              <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Nota Obtenida</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>
                                {obtenerDiaMes(fechaEvaluacion)}
                              </div>
                              <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Día</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{new Date().getFullYear()}</div>
                              <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Año</div>
                            </div>
                          </div>

                          <p className="text-sm mb-4" style={{ color: "hsl(210, 9%, 31%)", marginTop: "-8px" }}>
                            Empresa: <span className="font-semibold">{datosUsuario.empresaUsuario}</span>
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-end">
                          <div className="text-left">
                            <div className="border-t-2 pt-2 w-48" style={{ borderColor: "hsl(210, 13%, 75%)" }}>
                              <p className="text-sm font-semibold" style={{ color: "hsl(210, 10%, 23%)" }}>Instructor Certificado</p>
                              <p className="text-xs" style={{ color: "hsl(210, 8%, 46%)" }}>Sistema de Capacitaciones</p>
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
                                <p className="text-xs" style={{ color: "hsl(210, 8%, 46%)" }}>Validar certificado</p>
                                <p className="text-xs font-mono" style={{ color: "hsl(210, 6%, 56%)" }}>{certificadoId}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="border-t-2 pt-2 w-48" style={{ borderColor: "hsl(210, 13%, 75%)" }}>
                              <p className="text-sm font-semibold" style={{ color: "hsl(210, 10%, 23%)" }}>{formatearFecha(fechaEvaluacion)}</p>
                              <p className="text-xs" style={{ color: "hsl(210, 8%, 46%)" }}>Fecha de emisión</p>
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
          <div className="border-t p-4 flex justify-between items-center" style={{ backgroundColor: "hsl(210, 20%, 98%)", borderColor: "hsl(210, 16%, 93%)" }}>
            <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>
              <span className="font-medium">Certificado válido</span> • Verificable mediante código QR
            </div>

            <div className="flex gap-3">
              <button
                onClick={compartirCertificado}
                disabled={generando}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "hsl(221, 83%, 53%)", color: "hsl(0, 0%, 100%)" }}
                onMouseEnter={(e) => !generando && (e.target.style.backgroundColor = "hsl(221, 83%, 45%)")}
                onMouseLeave={(e) => !generando && (e.target.style.backgroundColor = "hsl(221, 83%, 53%)")}
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
                className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "hsl(0, 72%, 51%)" }}
                onMouseEnter={(e) => !generando && !descargando && (e.target.style.backgroundColor = "hsl(0, 74%, 42%)")}
                onMouseLeave={(e) => !generando && !descargando && (e.target.style.backgroundColor = "hsl(0, 72%, 51%)")}
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
    </>
  )
}

export default CertificadoGenerator
