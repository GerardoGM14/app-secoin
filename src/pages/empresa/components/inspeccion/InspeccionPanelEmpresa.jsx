"use client"

import { useEffect, useState } from "react"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"

function InspeccionPanelEmpresa({ empresaSeleccionada }) {
  const [archivos, setArchivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenamiento, setOrdenamiento] = useState("fecha-desc")
  const [busqueda, setBusqueda] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    console.log("🔍 InspeccionPanelEmpresa - useEffect ejecutado")
    console.log("📊 Empresa seleccionada:", empresaSeleccionada)

    const obtenerArchivos = async () => {
      if (!empresaSeleccionada?.correo) {
        console.log("❌ No hay empresa seleccionada o no tiene correo")
        setCargando(false)
        return
      }

      console.log("🚀 Iniciando obtención de archivos para empresa:", empresaSeleccionada.correo)
      setCargando(true)
      setError("")

      try {
        // Cambiar la consulta para usar correo en lugar de empresaId
        const q = query(collection(db, "inspecciones"), where("empresaCorreo", "==", empresaSeleccionada.correo))
        console.log("📝 Query creada con correo:", empresaSeleccionada.correo)

        const snap = await getDocs(q)
        console.log("📄 Snapshot obtenido, docs encontrados:", snap.docs.length)

        const archivosFiltrados = snap.docs.map((doc) => {
          const data = { id: doc.id, ...doc.data() }
          console.log("📋 Archivo procesado:", data)
          return data
        })

        console.log("✅ Archivos filtrados totales:", archivosFiltrados.length)
        console.log("📊 Lista completa de archivos:", archivosFiltrados)

        setArchivos(archivosFiltrados)
      } catch (error) {
        console.error("❌ Error al obtener archivos de inspección:", error)
        console.error("🔥 Detalles del error:", error.message)
        setError("Error al cargar los archivos de inspección: " + error.message)
      } finally {
        setCargando(false)
        console.log("🏁 Proceso de carga finalizado")
      }
    }

    obtenerArchivos()
  }, [empresaSeleccionada])

  const obtenerTipoArchivo = (nombre) => {
    console.log("🔍 Analizando tipo de archivo para:", nombre)

    if (!nombre) {
      console.log("⚠️ Nombre de archivo vacío")
      return "documento"
    }

    const nombreLower = nombre.toLowerCase()
    const extension = nombre.split(".").pop()?.toLowerCase()

    console.log("📝 Extensión detectada:", extension)
    console.log("📝 Nombre en minúsculas:", nombreLower)

    let tipo = "documento"

    if (extension === "pdf") tipo = "pdf"
    else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) tipo = "imagen"
    else if (["mp4", "avi", "mov", "wmv"].includes(extension)) tipo = "video"
    else if (nombreLower.includes("informe") || nombreLower.includes("reporte")) tipo = "informe"
    else if (nombreLower.includes("certificado")) tipo = "certificado"

    console.log("✅ Tipo de archivo determinado:", tipo)
    return tipo
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case "pdf":
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
      case "imagen":
        return (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )
      case "video":
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )
      case "informe":
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case "certificado":
        return (
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
    }
  }

  const obtenerBadgeTipo = (tipo) => {
    switch (tipo) {
      case "pdf":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">PDF</span>
      case "imagen":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Imagen</span>
      case "video":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Video</span>
      case "informe":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Informe</span>
      case "certificado":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Certificado</span>
        )
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Documento</span>
    }
  }

  // Filtrar archivos
  const archivosFiltrados = archivos.filter((archivo) => {
    const cumpleFiltro = filtroTipo === "todos" || obtenerTipoArchivo(archivo.nombre) === filtroTipo
    const cumpleBusqueda =
      archivo.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (archivo.comentario && archivo.comentario.toLowerCase().includes(busqueda.toLowerCase()))

    console.log(`🔍 Filtro para ${archivo.nombre}: tipo=${cumpleFiltro}, búsqueda=${cumpleBusqueda}`)
    return cumpleFiltro && cumpleBusqueda
  })

  // Ordenar archivos
  const archivosOrdenados = [...archivosFiltrados].sort((a, b) => {
    console.log("📊 Ordenando archivos por:", ordenamiento)
    switch (ordenamiento) {
      case "fecha-desc":
        return (b.fecha?.toDate() || new Date(0)) - (a.fecha?.toDate() || new Date(0))
      case "fecha-asc":
        return (a.fecha?.toDate() || new Date(0)) - (b.fecha?.toDate() || new Date(0))
      case "nombre-asc":
        return (a.nombre || "").localeCompare(b.nombre || "")
      case "nombre-desc":
        return (b.nombre || "").localeCompare(a.nombre || "")
      default:
        return 0
    }
  })

  console.log("📊 Archivos después de filtros y ordenamiento:", archivosOrdenados.length)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Debug Info - Remover en producción */}
      {/*<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info:</h3>
        <p className="text-sm text-yellow-700">Empresa ID: {empresaSeleccionada?.id || "❌ No detectado"}</p>
        <p className="text-sm text-yellow-700">Empresa Nombre: {empresaSeleccionada?.nombre || "❌ No disponible"}</p>
        <p className="text-sm text-yellow-700">Empresa Correo: {empresaSeleccionada?.correo || "❌ No disponible"}</p>
        <p className="text-sm text-yellow-700">Total archivos: {archivos.length}</p>
        <p className="text-sm text-yellow-700">Archivos filtrados: {archivosFiltrados.length}</p>
        <p className="text-sm text-yellow-700">Cargando: {cargando ? "✅ Sí" : "❌ No"}</p>
        <p className="text-sm text-yellow-700">Filtro actual: {filtroTipo}</p>
        <p className="text-sm text-yellow-700">Búsqueda: "{busqueda}"</p>
        {error && <p className="text-sm text-red-600">❌ Error: {error}</p>}
      </div>*/}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Inspección</h1>
            <p className="text-red-100">Consulta y descarga tus archivos de inspección</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      {archivos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar archivos de inspección..."
                  value={busqueda}
                  onChange={(e) => {
                    console.log("🔍 Búsqueda actualizada:", e.target.value)
                    setBusqueda(e.target.value)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              {["todos", "pdf", "imagen", "video", "informe", "certificado", "documento"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    console.log("🔧 Filtro cambiado a:", tipo)
                    setFiltroTipo(tipo)
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filtroTipo === tipo ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tipo === "todos" ? "Todos" : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            {/* Ordenamiento */}
            <select
              value={ordenamiento}
              onChange={(e) => {
                console.log("📊 Ordenamiento cambiado a:", e.target.value)
                setOrdenamiento(e.target.value)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="fecha-desc">Más reciente</option>
              <option value="fecha-asc">Más antiguo</option>
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="nombre-desc">Nombre Z-A</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Contenido principal */}
      {cargando ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64"
        >
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando archivos de inspección...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Error al cargar</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      ) : archivosOrdenados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {busqueda || filtroTipo !== "todos"
                  ? "🔍 No se encontraron archivos"
                  : "📂 No hay archivos de inspección disponibles aún"}
              </h3>
              <p className="text-gray-500">
                {busqueda || filtroTipo !== "todos"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Aún no tienes archivos de inspección disponibles"}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {archivosOrdenados.map((archivo, index) => {
              const tipo = obtenerTipoArchivo(archivo.nombre)
              console.log(`🎨 Renderizando archivo ${index + 1}:`, archivo.nombre, "- Tipo:", tipo)

              return (
                <motion.div
                  key={archivo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {obtenerIconoTipo(tipo)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-red-600 transition-colors duration-200">
                          {archivo.nombre}
                        </h3>
                        <div className="mt-2">{obtenerBadgeTipo(tipo)}</div>
                      </div>
                    </div>
                  </div>

                  {archivo.comentario && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                      {archivo.comentario}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {archivo.fecha?.toDate().toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) || "Sin fecha"}
                    </span>

                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => console.log("🔗 Abriendo archivo:", archivo.url)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Ver
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Estadísticas */}
      {archivos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{archivos.length}</div>
              <div className="text-sm text-red-700">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "pdf").length}
              </div>
              <div className="text-sm text-red-700">PDFs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "imagen").length}
              </div>
              <div className="text-sm text-red-700">Imágenes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "video").length}
              </div>
              <div className="text-sm text-red-700">Videos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "informe").length}
              </div>
              <div className="text-sm text-red-700">Informes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "certificado").length}
              </div>
              <div className="text-sm text-red-700">Certificados</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default InspeccionPanelEmpresa
