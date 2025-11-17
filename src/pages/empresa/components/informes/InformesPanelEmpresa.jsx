"use client"

import { useEffect, useState } from "react"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"

function InformesPanelEmpresa({ empresaSeleccionada }) {
  const [archivos, setArchivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenamiento, setOrdenamiento] = useState("fecha-desc")
  const [busqueda, setBusqueda] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    console.log("🔍 InformesPanelEmpresa - useEffect ejecutado")
    console.log("📊 Empresa seleccionada:", empresaSeleccionada)

    const obtenerArchivos = async () => {
      if (!empresaSeleccionada?.correo) {
        console.log("❌ No hay empresa seleccionada o no tiene correo")
        setCargando(false)
        return
      }

      console.log("✅ Empresa válida, obteniendo archivos...")
      console.log("📧 Correo de empresa:", empresaSeleccionada.correo)

      setCargando(true)
      try {
        const q = query(collection(db, "informes"), where("empresaCorreo", "==", empresaSeleccionada.correo))

        console.log("🔍 Ejecutando query en colección 'informes'...")
        const snap = await getDocs(q)
        console.log("📊 Documentos encontrados:", snap.docs.length)

        const archivosFiltrados = snap.docs.map((doc) => {
          const data = { id: doc.id, ...doc.data() }
          console.log("📄 Archivo procesado:", data)
          return data
        })

        console.log("✅ Archivos finales:", archivosFiltrados)
        setArchivos(archivosFiltrados)
      } catch (error) {
        console.error("❌ Error al obtener archivos:", error)
        setError("Error al cargar los informes")
      } finally {
        setCargando(false)
      }
    }

    obtenerArchivos()
  }, [empresaSeleccionada])

  const obtenerTipoArchivo = (nombre) => {
    console.log("🔍 Analizando tipo de archivo para:", nombre)
    const nombreLower = nombre.toLowerCase()

    let tipo = "documento"
    if (nombreLower.includes("informe") || nombreLower.includes("técnico")) {
      tipo = "informe"
    } else if (nombreLower.includes("reporte") || nombreLower.includes("report")) {
      tipo = "reporte"
    } else if (nombreLower.includes("análisis") || nombreLower.includes("analisis")) {
      tipo = "analisis"
    } else if (nombreLower.includes("evaluación") || nombreLower.includes("evaluacion")) {
      tipo = "evaluacion"
    } else if (nombreLower.includes("certificado") || nombreLower.includes("certificación")) {
      tipo = "certificado"
    }

    console.log("📋 Tipo detectado:", tipo)
    return tipo
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case "informe":
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case "reporte":
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        )
      case "analisis":
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        )
      case "evaluacion":
        return (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        )
      case "certificado":
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      case "informe":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Informe Técnico
          </span>
        )
      case "reporte":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Reporte</span>
      case "analisis":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Análisis</span>
        )
      case "evaluacion":
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Evaluación</span>
        )
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
      archivo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (archivo.comentario && archivo.comentario.toLowerCase().includes(busqueda.toLowerCase()))
    console.log(`🔍 Archivo ${archivo.nombre}: filtro=${cumpleFiltro}, búsqueda=${cumpleBusqueda}`)
    return cumpleFiltro && cumpleBusqueda
  })

  // Ordenar archivos
  const archivosOrdenados = [...archivosFiltrados].sort((a, b) => {
    switch (ordenamiento) {
      case "fecha-desc":
        return b.fecha?.toDate() - a.fecha?.toDate()
      case "fecha-asc":
        return a.fecha?.toDate() - b.fecha?.toDate()
      case "nombre-asc":
        return a.nombre.localeCompare(b.nombre)
      case "nombre-desc":
        return b.nombre.localeCompare(a.nombre)
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
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
        <p className="text-sm text-yellow-700">Empresa correo: {empresaSeleccionada?.correo || "No detectado"}</p>
        <p className="text-sm text-yellow-700">Total archivos: {archivos.length}</p>
        <p className="text-sm text-yellow-700">Archivos filtrados: {archivosOrdenados.length}</p>
        <p className="text-sm text-yellow-700">Filtro actual: {filtroTipo}</p>
        <p className="text-sm text-yellow-700">Búsqueda: {busqueda || "Sin búsqueda"}</p>
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
      </div>/}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Informes</h1>
            <p className="text-red-100">Consulta y descarga tus informes técnicos</p>
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
                  placeholder="Buscar informes..."
                  value={busqueda}
                  onChange={(e) => {
                    console.log("🔍 Búsqueda cambiada a:", e.target.value)
                    setBusqueda(e.target.value)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              {["todos", "informe", "reporte", "analisis", "evaluacion", "certificado", "documento"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    console.log("🔍 Filtro cambiado a:", tipo)
                    setFiltroTipo(tipo)
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filtroTipo === tipo ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tipo === "todos"
                    ? "Todos"
                    : tipo === "informe"
                      ? "Informe"
                      : tipo === "analisis"
                        ? "Análisis"
                        : tipo === "evaluacion"
                          ? "Evaluación"
                          : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
          <p className="text-gray-600">Cargando informes...</p>
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
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar informes</h3>
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {busqueda || filtroTipo !== "todos" ? "No se encontraron informes" : "No hay informes disponibles"}
              </h3>
              <p className="text-gray-500">
                {busqueda || filtroTipo !== "todos"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Aún no tienes informes disponibles"}
              </p>
              {(busqueda || filtroTipo !== "todos") && (
                <button
                  onClick={() => {
                    setBusqueda("")
                    setFiltroTipo("todos")
                  }}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {archivosOrdenados.map((archivo, index) => {
              const tipo = obtenerTipoArchivo(archivo.nombre)
              console.log(`🎨 Renderizando archivo: ${archivo.nombre} (tipo: ${tipo})`)
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
                      })}
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
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "informe").length}
              </div>
              <div className="text-sm text-red-700">Informes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "reporte").length}
              </div>
              <div className="text-sm text-red-700">Reportes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "analisis").length}
              </div>
              <div className="text-sm text-red-700">Análisis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "evaluacion").length}
              </div>
              <div className="text-sm text-red-700">Evaluaciones</div>
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

export default InformesPanelEmpresa

