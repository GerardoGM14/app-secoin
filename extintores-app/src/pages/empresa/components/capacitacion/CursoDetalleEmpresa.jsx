"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, getDoc, doc, getDocs } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"

function CursoDetalleEmpresa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [curso, setCurso] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [cuestionario, setCuestionario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [sesionExpandida, setSesionExpandida] = useState(null)
  const [pinEmpresa, setPinEmpresa] = useState("")

  console.log("📚 CursoDetalleEmpresa - Iniciando")
  console.log("🆔 ID del curso:", id)

  useEffect(() => {
    obtenerDatosCurso()
    // Obtener PIN de la URL o generar uno nuevo
    const urlParams = new URLSearchParams(window.location.search)
    const pin = urlParams.get("pin") || Math.floor(100000 + Math.random() * 900000).toString()
    setPinEmpresa(pin)
    console.log("🔑 PIN empresa:", pin)
  }, [id])

  const obtenerDatosCurso = async () => {
    setCargando(true)
    try {
      console.log("🔍 Obteniendo datos del curso...")

      // Obtener información del curso
      const cursoSnap = await getDoc(doc(db, "capacitaciones", id))
      if (cursoSnap.exists()) {
        const cursoData = { id, ...cursoSnap.data() }
        setCurso(cursoData)
        console.log("📖 Curso obtenido:", cursoData.titulo)
      } else {
        console.error("❌ Curso no encontrado")
        Swal.fire({
          title: "Error",
          text: "El curso no existe o no está disponible",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          navigate("/empresa/capacitacion")
        })
        return
      }

      // Obtener sesiones del curso
      const sesionesSnap = await getDocs(collection(db, "capacitaciones", id, "sesiones"))
      const sesionesData = sesionesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setSesiones(sesionesData)
      console.log("📑 Sesiones obtenidas:", sesionesData.length)

      // Obtener cuestionario si existe
      const cuestionarioSnap = await getDocs(collection(db, "capacitaciones", id, "cuestionarios"))
      if (!cuestionarioSnap.empty) {
        const cuestionarioData = cuestionarioSnap.docs[0].data()
        setCuestionario(cuestionarioData)
        console.log("📝 Cuestionario encontrado:", cuestionarioData.titulo)
      }
    } catch (error) {
      console.error("❌ Error al obtener datos del curso:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los datos del curso",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      })
    } finally {
      setCargando(false)
    }
  }

  const obtenerIconoArchivo = (nombreArchivo) => {
    const extension = nombreArchivo.split(".").pop().toLowerCase()

    if (extension === "pdf") {
      return (
        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["doc", "docx"].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["ppt", "pptx"].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else {
      return (
        <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
  }

  const toggleSesion = (sesionId) => {
    setSesionExpandida(sesionExpandida === sesionId ? null : sesionId)
    console.log("🔄 Toggling sesión:", sesionId)
  }

  const generarEnlaceEvaluacion = () => {
    const enlace = `${window.location.origin}/capacitacion/evaluacion/${id}?pin=${pinEmpresa}`
    navigator.clipboard
      .writeText(enlace)
      .then(() => {
        Swal.fire({
          title: "¡Enlace de evaluación copiado!",
          html: `
            <div class="text-left">
              <p class="mb-3">Comparte este enlace con tus trabajadores para que realicen la evaluación:</p>
              <div class="bg-gray-100 p-3 rounded-lg text-sm break-all mb-3">
                ${enlace}
              </div>
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                <p class="text-sm text-yellow-800">
                  <strong>Importante:</strong> Los trabajadores necesitarán validar su DNI y tendrán máximo 2 intentos para aprobar.
                </p>
              </div>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Entendido",
        })
      })
      .catch(() => {
        Swal.fire({
          title: "Enlace de evaluación",
          html: `
            <div class="text-left">
              <p class="mb-3">Comparte este enlace con tus trabajadores:</p>
              <div class="bg-gray-100 p-3 rounded-lg text-sm break-all">
                ${enlace}
              </div>
            </div>
          `,
          icon: "info",
          confirmButtonColor: "#3b82f6",
        })
      })
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Cargando curso...</p>
      </div>
    )
  }

  if (!curso) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-6xl mx-auto"
    >
      {/* Encabezado del curso */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{curso.titulo}</h2>
            <p className="text-sm text-gray-500">
              {curso.fecha?.toDate
                ? curso.fecha.toDate().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Fecha no disponible"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/empresa/capacitacion")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
      </div>

      {/* Contenido principal del curso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Imagen y descripción */}
        <div className="lg:col-span-2 space-y-4">
          {curso.imagen && (
            <div className="relative rounded-xl overflow-hidden shadow-md h-64">
              <img src={curso.imagen || "/placeholder.svg"} alt={curso.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold">{curso.titulo}</h3>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Descripción del curso</h3>
            <p className="text-gray-600 whitespace-pre-line">{curso.descripcion}</p>
          </div>

          {/* Documentos principales del curso */}
          {curso.documentos && curso.documentos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Documentos del curso ({curso.documentos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {curso.documentos.map((documento, i) => (
                  <a
                    key={i}
                    href={documento.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 group"
                  >
                    {obtenerIconoArchivo(documento.nombre)}
                    <span className="text-sm text-gray-700 truncate flex-1">{documento.nombre}</span>
                    <svg
                      className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información del curso</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Duración</p>
                  <p className="text-sm text-gray-500">{sesiones.length} sesiones</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Certificación</p>
                  <p className="text-sm text-gray-500">{cuestionario ? "Evaluación disponible" : "Sin evaluación"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Recursos</p>
                  <p className="text-sm text-gray-500">{curso.documentos?.length || 0} documentos principales</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">PIN Empresa</p>
                  <p className="text-sm text-gray-500 font-mono">{pinEmpresa}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Evaluación final */}
          {cuestionario && (
            <div
              onClick={generarEnlaceEvaluacion}
              className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-125"></div>
              <h4 className="text-xl font-bold mb-2 relative z-10">Evaluación Final</h4>
              <p className="text-sm text-white/90 mb-4 relative z-10">
                Genera enlace para que tus trabajadores realicen la evaluación.
              </p>
              <div className="flex items-center justify-between relative z-10">
                <div className="text-xs text-white/80">
                  <span className="block mb-1">⏱️ {cuestionario.tiempo} minutos</span>
                  <span className="block">🎯 2 intentos máximo</span>
                  <span className="block">🏆 Certificado automático</span>
                </div>
                <svg
                  className="h-6 w-6 text-white/70 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sesiones del curso */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-800">Contenido del Curso</h3>
          <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
            {sesiones.length} {sesiones.length === 1 ? "sesión" : "sesiones"}
          </div>
        </div>
      </div>

      {/* Lista de sesiones */}
      <div className="space-y-4">
        {sesiones.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay sesiones disponibles</h3>
            <p className="text-gray-500">Este curso aún no tiene contenido publicado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion, index) => {
              const videoEmbed = sesion.video?.includes("watch?v=")
                ? sesion.video.replace("watch?v=", "embed/")
                : sesion.video
              const expandida = sesionExpandida === sesion.id

              return (
                <motion.div
                  key={sesion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300"
                >
                  {/* Header de la sesión */}
                  <div
                    onClick={() => toggleSesion(sesion.id)}
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{sesion.titulo}</h4>
                          {sesion.descripcion && <p className="text-sm text-gray-600 mt-1">{sesion.descripcion}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Indicadores de contenido */}
                        <div className="flex items-center gap-1">
                          {videoEmbed && (
                            <div className="bg-red-100 text-red-600 p-1 rounded-full" title="Incluye video">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                          {sesion.archivos && sesion.archivos.length > 0 && (
                            <div className="bg-green-100 text-green-600 p-1 rounded-full" title="Incluye documentos">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <motion.svg
                          animate={{ rotate: expandida ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandible */}
                  <AnimatePresence>
                    {expandida && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-gray-100">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Video */}
                            {videoEmbed && (
                              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                <div className="aspect-video">
                                  <iframe
                                    src={videoEmbed}
                                    title={`Video: ${sesion.titulo}`}
                                    allowFullScreen
                                    className="w-full h-full"
                                    loading="lazy"
                                  ></iframe>
                                </div>
                              </div>
                            )}

                            {/* Documentos */}
                            {sesion.archivos && sesion.archivos.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  <svg
                                    className="h-5 w-5 text-blue-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  Documentos ({sesion.archivos.length})
                                </h5>
                                <ul className="space-y-2">
                                  {sesion.archivos.map((archivo, i) => (
                                    <li key={i}>
                                      <a
                                        href={archivo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white rounded-md hover:bg-gray-100 transition-colors border border-gray-200 group"
                                        onClick={() => console.log("📄 Descargando archivo:", archivo.nombre)}
                                      >
                                        {obtenerIconoArchivo(archivo.nombre)}
                                        <span className="text-sm text-gray-700 truncate flex-1">{archivo.nombre}</span>
                                        <svg
                                          className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                          />
                                        </svg>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Fecha de la sesión */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {sesion.fecha?.toDate
                                ? sesion.fecha.toDate().toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Fecha no disponible"}
                            </p>
                            {sesion.actualizado && (
                              <p className="text-xs text-gray-400">
                                Actualizado: {sesion.actualizado.toDate().toLocaleDateString("es-ES")}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CursoDetalleEmpresa
