"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Particles from "react-particles"
import { loadSlim } from "tsparticles-slim"
import { db } from "../firebase/firebaseConfig"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import QRCode from "qrcode"
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, ArrowPathIcon, UserIcon, AcademicCapIcon, CalendarIcon, BuildingOfficeIcon, IdentificationIcon, BriefcaseIcon, ChartBarIcon } from "@heroicons/react/24/solid"

function CertificadoVista() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [certificado, setCertificado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  useEffect(() => {
    if (id) {
      validarCertificado()
    }
  }, [id])

  // Configuración de partículas tipo neuronas
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  const particlesConfig = {
    background: {
      color: {
        value: "transparent",
      },
    },
    particles: {
      number: {
        value: 80,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: "#dc2626",
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.7,
        random: false,
        animation: {
          enable: false,
        },
      },
      size: {
        value: 1.5,
        random: false,
        animation: {
          enable: false,
        },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#dc2626",
        opacity: 0.4,
        width: 1,
        triangles: {
          enable: false,
        },
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce",
        },
        bounce: false,
      },
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: false,
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 150,
          links: {
            opacity: 0.5,
            blink: false,
          },
        },
      },
    },
    retina_detect: true,
  }

  const validarCertificado = async () => {
    setCargando(true)
    setError(null)

    try {
      console.log("🔄 Validando certificado...", id)

      // Buscar el certificado en Firebase por el campo 'id' (no por el ID del documento)
      // Primero intentar buscar por el campo 'id'
      const q = query(collection(db, "certificados"), where("id", "==", id))
      const querySnapshot = await getDocs(q)

      let certificadoEncontrado = null

      if (!querySnapshot.empty) {
        // Encontrado por el campo 'id'
        const docSnap = querySnapshot.docs[0]
        const datos = docSnap.data()
        certificadoEncontrado = { id: datos.id || id, ...datos }
        console.log("✅ Certificado válido encontrado por campo 'id':", datos)
      } else {
        // Si no se encuentra por campo 'id', intentar buscar por el ID del documento directamente
        // (por si acaso algunos certificados se guardaron con setDoc usando el id como document ID)
        const certificadoRef = doc(db, "certificados", id)
        const certificadoSnap = await getDoc(certificadoRef)

        if (certificadoSnap.exists()) {
          const datos = certificadoSnap.data()
          certificadoEncontrado = { id: certificadoSnap.id, ...datos }
          console.log("✅ Certificado válido encontrado por document ID:", datos)
        }
      }

      if (certificadoEncontrado) {
        setCertificado(certificadoEncontrado)

        // Generar QR code con la URL de validación
        const urlValidacion = `${window.location.origin}/certificado/${id}`
        try {
          const qrUrl = await QRCode.toDataURL(urlValidacion, {
            width: 200,
            margin: 2,
            color: {
              dark: "#dc2626", // Rojo del sistema
              light: "#ffffff",
            },
          })
          setQrCodeUrl(qrUrl)
        } catch (qrError) {
          console.error("Error al generar QR:", qrError)
        }
      } else {
        setError("Certificado no encontrado")
        console.log("❌ Certificado no encontrado")
      }
    } catch (error) {
      console.error("❌ Error al validar certificado:", error)
      setError("Error al validar el certificado")
    } finally {
      setCargando(false)
    }
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
        fechaObj = fecha.toDate()
      } else if (typeof fecha === "string") {
        fechaObj = new Date(fecha)
      } else if (fecha instanceof Date) {
        fechaObj = fecha
      } else {
        fechaObj = new Date(fecha)
      }

      if (isNaN(fechaObj.getTime())) {
        const hoy = new Date()
        return hoy.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
      }

      return fechaObj.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
    } catch (error) {
      console.error("Error al obtener día:", error)
      const hoy = new Date()
      return hoy.toLocaleDateString("es-PE", { month: "long", day: "numeric" })
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
            >
              <div className="text-center py-8">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <ArrowPathIcon className="h-8 w-8 text-red-600 animate-spin" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Validando Certificado</h3>
                <p className="text-sm text-gray-600">Espere mientras verificamos el certificado en el sistema</p>
                
                {/* Información adicional */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 text-center">ID: {id}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Certificado No Válido</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">ID: {id}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a buscar
          </button>
        </motion.div>
      </div>
    )
  }

  if (!certificado) return null

  return (
    <div className="relative min-h-screen py-8 px-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #fef2f2, #fce7f3)' }}>
      {/* Fondo con partículas tipo neuronas */}
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <Particles
          id="tsparticles-certificado"
          init={particlesInit}
          options={particlesConfig}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto relative" style={{ zIndex: 10 }}>
        {/* Header de validación */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl shadow-lg border-2 border-green-200 overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Lado izquierdo - Icono y texto */}
              <div className="flex items-center gap-4 flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircleIcon className="h-12 w-12 text-white" />
                  </div>
                  {/* Anillo animado */}
                  <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping opacity-20"></div>
                </motion.div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Certificado Válido</h1>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                      Verificado
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">Este certificado ha sido verificado exitosamente en el sistema</p>
                </div>
              </div>

              {/* Lado derecho - Información adicional */}
              <div className="flex flex-col items-end gap-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">ID del Certificado</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{certificado.id}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Estado: Activo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra decorativa inferior */}
          <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400"></div>
        </motion.div>

        {/* Vista del Certificado - Diseño similar a CertificadoGenerator */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-6">
          {/* Certificado */}
          <div
            className="shadow-2xl rounded-lg overflow-hidden"
            style={{ backgroundColor: "hsl(0, 0%, 100%)", width: "100%", maxWidth: "842px", margin: "0 auto" }}
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
                      <div className="w-20 h-20 rounded flex items-center justify-center" style={{ backgroundColor: "hsla(0, 0%, 100%, 0.2)" }}>
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Cuadro rojo superior derecho - ID */}
                  <div className="absolute top-0 right-0 p-4 rounded-bl-lg" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}>
                    <div className="flex flex-col items-center">
                      <p className="text-xs text-white font-mono text-center max-w-[80px] break-all">
                        {certificado.id}
                      </p>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-6" style={{ position: "relative", zIndex: 20 }}>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "hsl(0, 72%, 51%)", position: "relative", zIndex: 21 }}>
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <p className="text-lg mb-4" style={{ color: "hsl(210, 10%, 23%)" }}>Se certifica que</p>

                    <h2 className="text-3xl font-bold mb-2 border-b-2 inline-block" style={{ borderColor: "hsl(0, 72%, 51%)", color: "hsl(210, 11%, 15%)", paddingBottom: "12px" }}>
                      {certificado.nombreUsuario}
                    </h2>

                    <p className="text-base mb-6" style={{ color: "hsl(210, 9%, 31%)" }}>
                      DNI: {certificado.dniUsuario} | Cargo: {certificado.cargoUsuario}
                    </p>

                    <p className="text-lg mb-2" style={{ color: "hsl(210, 10%, 23%)" }}>ha completado exitosamente la capacitación</p>

                    <h3 className="text-2xl font-bold mb-4" style={{ color: "hsl(0, 72%, 51%)" }}>"{certificado.cursoTitulo}"</h3>

                    <div className="grid grid-cols-3 gap-8 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{certificado.notaObtenida}</div>
                        <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Nota Obtenida</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>
                          {obtenerDiaMes(certificado.fechaEvaluacion)}
                        </div>
                        <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Día</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{new Date().getFullYear()}</div>
                        <div className="text-sm" style={{ color: "hsl(210, 9%, 31%)" }}>Año</div>
                      </div>
                    </div>

                    <p className="text-sm mb-4" style={{ color: "hsl(210, 9%, 31%)" }}>
                      Empresa: <span className="font-semibold">{certificado.empresaUsuario}</span>
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
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="w-20 h-20 mx-auto mb-2"
                          />
                          <p className="text-xs" style={{ color: "hsl(210, 8%, 46%)" }}>Validar certificado</p>
                          <p className="text-xs font-mono" style={{ color: "hsl(210, 6%, 56%)" }}>{certificado.id}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="border-t-2 pt-2 w-48" style={{ borderColor: "hsl(210, 13%, 75%)" }}>
                        <p className="text-sm font-semibold" style={{ color: "hsl(210, 10%, 23%)" }}>Gerente General SECOIN</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Estado del certificado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Estado: {certificado.estado || "Activo"}</span>
              </div>
              <div className="text-sm text-gray-500">Tipo: {certificado.tipo || "Capacitación"}</div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Certificado Verificado</h4>
                <p className="text-sm text-green-700 mt-1">
                  Este certificado ha sido emitido por el sistema oficial de capacitaciones y es completamente válido.
                  La información mostrada corresponde a los datos registrados en el momento de la evaluación.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a buscar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default CertificadoVista

