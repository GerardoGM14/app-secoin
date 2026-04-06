"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../../../firebase/firebaseConfig"
import Swal from "sweetalert2"

function CapacitacionPanelEmpresa({ empresaSeleccionada }) {
  const [capacitaciones, setCapacitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [pinEmpresa, setPinEmpresa] = useState("")
  const [mostrarModalPin, setMostrarModalPin] = useState(false)
  const navigate = useNavigate()

  console.log("🎓 CapacitacionPanelEmpresa - Iniciando")
  console.log("📊 Empresa seleccionada:", empresaSeleccionada)

  useEffect(() => {
    obtenerCapacitaciones()
    generarPinEmpresa()
  }, [])

  const obtenerCapacitaciones = async () => {
    setCargando(true)
    try {
      console.log("🔍 Obteniendo capacitaciones públicas...")
      const snapshot = await getDocs(collection(db, "capacitaciones"))
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      console.log("📚 Capacitaciones obtenidas:", lista.length)
      setCapacitaciones(lista)
    } catch (error) {
      console.error("❌ Error al obtener capacitaciones:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las capacitaciones",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      })
    } finally {
      setCargando(false)
    }
  }

  const generarPinEmpresa = () => {
    // Generar PIN de 6 dígitos único para la empresa
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    setPinEmpresa(pin)
    console.log("🔑 PIN generado para empresa:", pin)
  }

  const obtenerCategoria = (id) => {
    const categorias = ["Seguridad", "Prevención", "Técnico", "Normativa", "Operativo"]
    const indice = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % categorias.length
    return categorias[indice]
  }

  const obtenerColorCategoria = (categoria) => {
    const colores = {
      Seguridad: "bg-red-100 text-red-800 border-red-200",
      Prevención: "bg-red-100 text-red-800 border-red-200",
      Técnico: "bg-green-100 text-green-800 border-green-200",
      Normativa: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Operativo: "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colores[categoria] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Filtrar capacitaciones
  const capacitacionesFiltradas = capacitaciones.filter((capacitacion) => {
    const categoria = obtenerCategoria(capacitacion.id)
    const cumpleFiltro = filtro === "todos" || categoria === filtro
    const cumpleBusqueda =
      capacitacion.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      capacitacion.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    return cumpleFiltro && cumpleBusqueda
  })

  const mostrarModalPinEmpresa = () => {
    setMostrarModalPin(true)
  }

  const copiarEnlaceCapacitacion = (capacitacionId) => {
    const enlace = `${window.location.origin}/capacitacion/registro/${capacitacionId}?pin=${pinEmpresa}`
    navigator.clipboard
      .writeText(enlace)
      .then(() => {
        Swal.fire({
          title: "¡Enlace copiado!",
          text: "El enlace ha sido copiado al portapapeles. Compártelo con tus trabajadores.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        })
      })
      .catch(() => {
        Swal.fire({
          title: "Enlace generado",
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

  const verDetalleCapacitacion = (capacitacionId) => {
    console.log("👁️ Viendo detalle de capacitación:", capacitacionId)
    navigate(`/empresa/capacitacion/curso/${capacitacionId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Capacitaciones Disponibles</h1>
              <p className="text-red-100">Accede al contenido y distribuye a tus trabajadores</p>
            </div>
          </div>
          <button
            onClick={mostrarModalPinEmpresa}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            PIN Empresa
          </button>
        </div>
      </div>

      {/* Controles */}
      {capacitaciones.length > 0 && (
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
                  placeholder="Buscar capacitaciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              {["todos", "Seguridad", "Prevención", "Técnico", "Normativa", "Operativo"].map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setFiltro(categoria)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filtro === categoria ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {categoria === "todos" ? "Todos" : categoria}
                </button>
              ))}
            </div>
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
          <p className="text-gray-600">Cargando capacitaciones...</p>
        </motion.div>
      ) : capacitacionesFiltradas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {busqueda || filtro !== "todos"
                  ? "No se encontraron capacitaciones"
                  : "No hay capacitaciones disponibles"}
              </h3>
              <p className="text-gray-500">
                {busqueda || filtro !== "todos"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Aún no hay capacitaciones publicadas"}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {capacitacionesFiltradas.map((capacitacion, index) => {
              const categoria = obtenerCategoria(capacitacion.id)
              const colorCategoria = obtenerColorCategoria(categoria)

              return (
                <motion.div
                  key={capacitacion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Imagen */}
                  <div className="relative h-48 overflow-hidden">
                    {capacitacion.imagen ? (
                      <img
                        src={capacitacion.imagen || "/placeholder.svg"}
                        alt={capacitacion.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${colorCategoria}`}
                    >
                      {categoria}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors duration-200">
                      {capacitacion.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{capacitacion.descripcion}</p>

                    {/* Fecha */}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {capacitacion.fecha?.toDate
                        ? capacitacion.fecha.toDate().toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Fecha no disponible"}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => verDetalleCapacitacion(capacitacion.id)}
                        className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 text-sm font-medium"
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
                        Ver Curso
                      </button>
                      <button
                        onClick={() => copiarEnlaceCapacitacion(capacitacion.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Generar enlace para trabajadores"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Estadísticas */}
      {capacitaciones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{capacitaciones.length}</div>
              <div className="text-sm text-red-700">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {capacitaciones.filter((c) => obtenerCategoria(c.id) === "Seguridad").length}
              </div>
              <div className="text-sm text-red-700">Seguridad</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {capacitaciones.filter((c) => obtenerCategoria(c.id) === "Prevención").length}
              </div>
              <div className="text-sm text-red-700">Prevención</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {capacitaciones.filter((c) => obtenerCategoria(c.id) === "Técnico").length}
              </div>
              <div className="text-sm text-red-700">Técnico</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{pinEmpresa}</div>
              <div className="text-sm text-red-700">PIN Empresa</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal PIN Empresa */}
      <AnimatePresence>
        {mostrarModalPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setMostrarModalPin(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">PIN de tu Empresa</h3>
                <p className="text-gray-600 mb-6">
                  Comparte este PIN con tus trabajadores para que puedan acceder a las capacitaciones
                </p>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-3xl font-mono font-bold text-red-600">{pinEmpresa}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pinEmpresa)
                      Swal.fire({
                        title: "¡Copiado!",
                        text: "PIN copiado al portapapeles",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false,
                      })
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Copiar PIN
                  </button>
                  <button
                    onClick={() => setMostrarModalPin(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CapacitacionPanelEmpresa
