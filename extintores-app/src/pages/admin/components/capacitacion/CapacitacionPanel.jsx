"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../../../firebase/firebaseConfig"
import CrearClase from "./CrearClase"
import Swal from "sweetalert2"

function CapacitacionPanel() {
  const [clases, setClases] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState("todos")
  const [modalVisibilidad, setModalVisibilidad] = useState({ mostrar: false, capacitacion: null })
  const [empresas, setEmpresas] = useState([])
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [hoverTimeouts, setHoverTimeouts] = useState({})
  const [mostrarOpciones, setMostrarOpciones] = useState({})
  const navigate = useNavigate()

  const obtenerClases = async () => {
    setCargando(true)
    try {
      const snapshot = await getDocs(collection(db, "capacitaciones"))
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setClases(lista)
    } catch (error) {
      console.error("Error al obtener capacitaciones:", error)
    } finally {
      setCargando(false)
    }
  }

  const obtenerEmpresas = async () => {
    setCargandoEmpresas(true)
    try {
      const snapshot = await getDocs(collection(db, "usuarios"))
      const listaEmpresas = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((usuario) => usuario && usuario.rol === "empresa")
      setEmpresas(listaEmpresas)
    } catch (error) {
      console.error("Error al obtener empresas:", error)
    } finally {
      setCargandoEmpresas(false)
    }
  }

  useEffect(() => {
    obtenerClases()
    obtenerEmpresas()
  }, [])

  const handleNuevaClase = () => {
    setMostrarFormulario(!mostrarFormulario)
  }

  const actualizarLista = () => {
    obtenerClases()
    setMostrarFormulario(false)
  }

  // Funciones para manejar hover
  const handleMouseEnter = (claseId) => {
    const timeout = setTimeout(() => {
      setMostrarOpciones((prev) => ({ ...prev, [claseId]: true }))
    }, 5000) // 5 segundos

    setHoverTimeouts((prev) => ({ ...prev, [claseId]: timeout }))
  }

  const handleMouseLeave = (claseId) => {
    // Limpiar timeout si existe
    if (hoverTimeouts[claseId]) {
      clearTimeout(hoverTimeouts[claseId])
      setHoverTimeouts((prev) => {
        const newTimeouts = { ...prev }
        delete newTimeouts[claseId]
        return newTimeouts
      })
    }

    // Ocultar opciones después de un pequeño delay para permitir interacción
    setTimeout(() => {
      setMostrarOpciones((prev) => ({ ...prev, [claseId]: false }))
    }, 300)
  }

  // Función para obtener iniciales de forma segura
  const obtenerIniciales = (empresa) => {
    if (!empresa) return "?"

    if (empresa.correo && typeof empresa.correo === "string" && empresa.correo.trim()) {
      return empresa.correo.charAt(0).toUpperCase()
    }

    if (empresa.nombre && typeof empresa.nombre === "string" && empresa.nombre.trim()) {
      return empresa.nombre.charAt(0).toUpperCase()
    }

    return "?"
  }

  // Función para obtener nombre de empresa de forma segura
  const obtenerNombreEmpresa = (empresa) => {
    if (!empresa) return "Empresa sin datos"

    if (empresa.nombre && typeof empresa.nombre === "string" && empresa.nombre.trim()) {
      return empresa.nombre
    }

    if (empresa.correo && typeof empresa.correo === "string" && empresa.correo.trim()) {
      return empresa.correo
    }

    return "Sin nombre"
  }

  // Función para obtener email de forma segura
  const obtenerEmailEmpresa = (empresa) => {
    if (!empresa) return "Sin email"

    if (empresa.correo && typeof empresa.correo === "string" && empresa.correo.trim()) {
      return empresa.correo
    }

    return "Sin email"
  }

  // Función para eliminar capacitación
  const eliminarCapacitacion = async (capacitacion) => {
    const result = await Swal.fire({
      title: "¿Eliminar capacitación?",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Título:</strong> ${capacitacion.titulo || "Sin título"}</p>
          <p class="mb-4 text-gray-600">${capacitacion.descripcion || "Sin descripción"}</p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-red-800 text-sm">
              ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los datos asociados.
            </p>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "swal-wide",
      },
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Eliminando capacitación...",
          text: "Por favor espere",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        })

        await deleteDoc(doc(db, "capacitaciones", capacitacion.id))

        Swal.fire({
          title: "¡Eliminada!",
          text: "La capacitación ha sido eliminada correctamente.",
          icon: "success",
          confirmButtonColor: "#dc2626",
        })

        obtenerClases()
      } catch (error) {
        console.error("Error al eliminar:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la capacitación.",
          icon: "error",
          confirmButtonColor: "#dc2626",
        })
      }
    }
  }

  // Función para abrir modal de visibilidad
  const abrirModalVisibilidad = async (capacitacion) => {
    setModalVisibilidad({ mostrar: true, capacitacion })
  }

  // Función para actualizar visibilidad de empresas
  const actualizarVisibilidadEmpresa = async (capacitacionId, empresaId, visible) => {
    try {
      const capacitacionRef = doc(db, "capacitaciones", capacitacionId)
      const capacitacionDoc = await getDoc(capacitacionRef)

      if (capacitacionDoc.exists()) {
        const data = capacitacionDoc.data()
        const empresasVisibles = data.empresasVisibles || []

        let nuevasEmpresasVisibles
        if (visible) {
          // Agregar empresa si no está
          if (!empresasVisibles.includes(empresaId)) {
            nuevasEmpresasVisibles = [...empresasVisibles, empresaId]
          } else {
            nuevasEmpresasVisibles = empresasVisibles
          }
        } else {
          // Remover empresa
          nuevasEmpresasVisibles = empresasVisibles.filter((id) => id !== empresaId)
        }

        await updateDoc(capacitacionRef, {
          empresasVisibles: nuevasEmpresasVisibles,
        })

        // Actualizar estado local
        setClases((prevClases) =>
          prevClases.map((clase) =>
            clase.id === capacitacionId ? { ...clase, empresasVisibles: nuevasEmpresasVisibles } : clase,
          ),
        )

        // Actualizar modal
        setModalVisibilidad((prev) => ({
          ...prev,
          capacitacion: {
            ...prev.capacitacion,
            empresasVisibles: nuevasEmpresasVisibles,
          },
        }))
      }
    } catch (error) {
      console.error("Error al actualizar visibilidad:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar la visibilidad.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      })
    }
  }

  // Función para obtener una categoría aleatoria pero consistente para cada clase
  const obtenerCategoria = (id) => {
    if (!id || typeof id !== "string") return "Sin categoría"

    const categorias = ["Seguridad", "Prevención", "Técnico", "Normativa", "Operativo"]
    const indice = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % categorias.length
    return categorias[indice]
  }

  // Función para obtener un color basado en la categoría
  const obtenerColorCategoria = (categoria) => {
    const colores = {
      Seguridad: "bg-red-100 text-red-800 border-red-200",
      Prevención: "bg-orange-100 text-orange-800 border-orange-200",
      Técnico: "bg-blue-100 text-blue-800 border-blue-200",
      Normativa: "bg-purple-100 text-purple-800 border-purple-200",
      Operativo: "bg-green-100 text-green-800 border-green-200",
    }
    return colores[categoria] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Filtrar clases según el filtro seleccionado
  const clasesFiltradas = Array.isArray(clases)
    ? filtro === "todos"
      ? clases
      : clases.filter((clase) => obtenerCategoria(clase.id) === filtro)
    : []

  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Modal de gestión de visibilidad
  const ModalVisibilidad = () => (
    <AnimatePresence>
      {modalVisibilidad.mostrar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalVisibilidad({ mostrar: false, capacitacion: null })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Gestionar Visibilidad</h3>
                    <p className="text-red-100 text-sm">Controla qué empresas pueden ver esta capacitación</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalVisibilidad({ mostrar: false, capacitacion: null })}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Información de la capacitación */}
            {modalVisibilidad.capacitacion && (
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  {modalVisibilidad.capacitacion.imagen ? (
                    <img
                      src={modalVisibilidad.capacitacion.imagen || "/placeholder.svg"}
                      alt={modalVisibilidad.capacitacion.titulo || "Capacitación"}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">
                      {modalVisibilidad.capacitacion.titulo || "Sin título"}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {modalVisibilidad.capacitacion.descripcion || "Sin descripción"}
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${obtenerColorCategoria(obtenerCategoria(modalVisibilidad.capacitacion.id))}`}
                    >
                      {obtenerCategoria(modalVisibilidad.capacitacion.id)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de empresas */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Empresas Registradas</h4>
                <span className="text-sm text-gray-500">{Array.isArray(empresas) ? empresas.length : 0} empresas</span>
              </div>

              {cargandoEmpresas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Cargando empresas...</span>
                </div>
              ) : !Array.isArray(empresas) || empresas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No hay empresas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {empresas.map((empresa) => {
                    if (!empresa || !empresa.id) return null

                    const esVisible = modalVisibilidad.capacitacion?.empresasVisibles?.includes(empresa.id) || false

                    return (
                      <motion.div
                        key={empresa.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {obtenerIniciales(empresa)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{obtenerNombreEmpresa(empresa)}</p>
                            <p className="text-sm text-gray-500">{obtenerEmailEmpresa(empresa)}</p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={esVisible}
                            onChange={(e) =>
                              actualizarVisibilidadEmpresa(
                                modalVisibilidad.capacitacion.id,
                                empresa.id,
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">
                            {esVisible ? "Visible" : "Oculta"}
                          </span>
                        </label>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{modalVisibilidad.capacitacion?.empresasVisibles?.length || 0}</span> de{" "}
                  {Array.isArray(empresas) ? empresas.length : 0} empresas pueden ver esta capacitación
                </div>
                <button
                  onClick={() => setModalVisibilidad({ mostrar: false, capacitacion: null })}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-red-100 text-red-700 p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </span>
            Capacitaciones
          </h2>
          <p className="text-gray-500 mt-1">Gestiona los cursos y capacitaciones disponibles</p>
        </div>
        <button
          onClick={handleNuevaClase}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 self-start sm:self-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mostrarFormulario ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
          {mostrarFormulario ? "Cancelar" : "Agregar Capacitación"}
        </button>
      </div>

      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <CrearClase visible={true} onClaseCreada={actualizarLista} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filtro === "todos"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {["Seguridad", "Prevención", "Técnico", "Normativa", "Operativo"].map((categoria) => (
          <button
            key={categoria}
            onClick={() => setFiltro(categoria)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              filtro === categoria
                ? obtenerColorCategoria(categoria)
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando capacitaciones...</p>
        </div>
      ) : !mostrarFormulario && clasesFiltradas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay capacitaciones disponibles</h3>
          <p className="text-gray-500 mb-6">
            {filtro !== "todos"
              ? `No se encontraron capacitaciones en la categoría "${filtro}"`
              : "Aún no se han registrado capacitaciones en el sistema"}
          </p>
          <button
            onClick={handleNuevaClase}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear nueva capacitación
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {clasesFiltradas.map((clase) => {
            if (!clase || !clase.id) return null

            const categoria = obtenerCategoria(clase.id)
            const colorCategoria = obtenerColorCategoria(categoria)

            return (
              <motion.div
                key={clase.id}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
                onMouseEnter={() => handleMouseEnter(clase.id)}
                onMouseLeave={() => handleMouseLeave(clase.id)}
              >
                <div className="relative">
                  {clase.imagen ? (
                    <img
                      src={clase.imagen || "/placeholder.svg"}
                      alt={clase.titulo || "Capacitación"}
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "https://via.placeholder.com/400x200?text=Sin+Imagen"
                      }}
                    />
                  ) : (
                    <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${colorCategoria}`}
                  >
                    {categoria}
                  </div>

                  {/* Indicador de empresas visibles */}
                  <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {Array.isArray(clase.empresasVisibles) ? clase.empresasVisibles.length : 0} empresas
                  </div>

                  {/* Opciones que aparecen al hacer hover */}
                  <AnimatePresence>
                    {mostrarOpciones[clase.id] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center gap-3"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirModalVisibilidad(clase)
                          }}
                          className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-800 hover:border-black px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                          title="Gestionar visibilidad"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                          Gestionar
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            eliminarCapacitacion(clase)
                          }}
                          className="bg-white hover:bg-red-50 text-red-500 border-2 border-red-500 hover:border-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                          title="Eliminar capacitación"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{clase.titulo || "Sin título"}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                    {clase.descripcion || "Sin descripción"}
                  </p>

                  {/* Botón Ver rojo con letras blancas */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/admin/capacitacion/curso/${clase.id}`)
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {clase.fecha?.toDate
                        ? clase.fecha.toDate().toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Fecha no disponible"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Modal de gestión de visibilidad */}
      <ModalVisibilidad />
    </motion.div>
  )
}

export default CapacitacionPanel


