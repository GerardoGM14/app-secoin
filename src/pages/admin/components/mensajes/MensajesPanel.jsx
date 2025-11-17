"use client"

import { useState, useEffect, useRef } from "react"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, getDocs, Timestamp, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"

function MensajesPanel({ empresaSeleccionada = null }) {
  // Estados para mensajes generales
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  // Estados para chat/conversación
  const [mensajeChat, setMensajeChat] = useState("")
  const [conversacion, setConversacion] = useState([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [tabActiva, setTabActiva] = useState("generales") // "generales" o "conversacion"

  // Estados para selección de empresa
  const [empresas, setEmpresas] = useState([])
  const [empresasFiltradas, setEmpresasFiltradas] = useState([])
  const [empresaSeleccionadaLocal, setEmpresaSeleccionadaLocal] = useState(empresaSeleccionada)
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false)
  const [loadingEmpresas, setLoadingEmpresas] = useState(false)

  // Estados para búsqueda y filtrado
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("")
  const [filtroActivo, setFiltroActivo] = useState("todas") // "todas", "con_mensajes", "sin_mensajes"

  const chatContainerRef = useRef()

  // Cargar empresas disponibles
  useEffect(() => {
    const obtenerEmpresas = async () => {
      setLoadingEmpresas(true)
      try {
        const snap = await getDocs(collection(db, "usuarios"))
        const listaEmpresas = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((usuario) => usuario && usuario.rol === "empresa")
        setEmpresas(listaEmpresas)
        setEmpresasFiltradas(listaEmpresas)
      } catch (error) {
        console.error("Error al obtener empresas:", error)
      } finally {
        setLoadingEmpresas(false)
      }
    }
    obtenerEmpresas()
  }, [])

  // Filtrar empresas según búsqueda y filtro
  useEffect(() => {
    let empresasFiltradas = empresas

    // Filtrar por búsqueda
    if (busquedaEmpresa.trim()) {
      empresasFiltradas = empresasFiltradas.filter(
        (empresa) =>
          empresa.correo?.toLowerCase().includes(busquedaEmpresa.toLowerCase()) ||
          empresa.nombre?.toLowerCase().includes(busquedaEmpresa.toLowerCase()),
      )
    }

    // Filtrar por tipo
    if (filtroActivo === "con_mensajes") {
      // Aquí podrías agregar lógica para filtrar empresas que tienen mensajes
      // Por ahora mantenemos todas
    } else if (filtroActivo === "sin_mensajes") {
      // Aquí podrías agregar lógica para filtrar empresas sin mensajes
      // Por ahora mantenemos todas
    }

    setEmpresasFiltradas(empresasFiltradas)
  }, [busquedaEmpresa, filtroActivo, empresas])

  // Cargar mensajes generales
  useEffect(() => {
    const obtenerMensajes = async () => {
      try {
        const snap = await getDocs(collection(db, "mensajes"))
        const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setMensajes(lista)
      } catch (error) {
        console.error("Error al obtener mensajes:", error)
      }
    }
    obtenerMensajes()
  }, [])

  // Cargar conversación en tiempo real
  useEffect(() => {
    if (!empresaSeleccionadaLocal || tabActiva !== "conversacion") return

    const conversacionRef = collection(db, "conversaciones", empresaSeleccionadaLocal.id, "mensajes")
    const q = query(conversacionRef, orderBy("fecha", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setConversacion(mensajes)

      // Scroll al final del chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    })

    return () => unsubscribe()
  }, [empresaSeleccionadaLocal, tabActiva])

  // Publicar mensaje general
  const publicarMensaje = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Debes completar título y contenido.",
        confirmButtonColor: "#dc2626",
      })
      return
    }

    setLoading(true)
    try {
      Swal.fire({
        title: "Publicando mensaje...",
        text: "Por favor espera",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      })

      let imagenURL = null
      if (archivoSeleccionado) {
        const archivoRef = ref(storage, `mensajes/${archivoSeleccionado.name}`)
        await uploadBytes(archivoRef, archivoSeleccionado)
        imagenURL = await getDownloadURL(archivoRef)
      }

      await addDoc(collection(db, "mensajes"), {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        imagenURL,
        fecha: Timestamp.now(),
        tipo: "general",
        remitente: "admin",
      })

      Swal.fire({
        icon: "success",
        title: "¡Mensaje publicado!",
        text: "El mensaje se ha publicado correctamente.",
        confirmButtonColor: "#dc2626",
      })

      // Limpiar formulario
      setTitulo("")
      setContenido("")
      setArchivoSeleccionado(null)
      if (inputRef.current) {
        inputRef.current.value = ""
      }

      // Recargar lista
      const snap = await getDocs(collection(db, "mensajes"))
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMensajes(lista)
    } catch (error) {
      console.error("Error al publicar mensaje:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo publicar el mensaje. Inténtalo de nuevo.",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setLoading(false)
    }
  }

  // Enviar mensaje en chat
  const enviarMensajeChat = async () => {
    if (!mensajeChat.trim() || !empresaSeleccionadaLocal) return

    setLoadingChat(true)
    try {
      const conversacionRef = collection(db, "conversaciones", empresaSeleccionadaLocal.id, "mensajes")

      await addDoc(conversacionRef, {
        contenido: mensajeChat.trim(),
        remitente: "admin",
        fecha: Timestamp.now(),
        leido: false,
      })

      setMensajeChat("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      Swal.fire("Error", "No se pudo enviar el mensaje", "error")
    } finally {
      setLoadingChat(false)
    }
  }

  // Eliminar mensaje general
  const eliminarMensaje = async (id) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar mensaje?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    })

    if (confirmacion.isConfirmed) {
      try {
        await deleteDoc(doc(db, "mensajes", id))
        setMensajes(mensajes.filter((m) => m.id !== id))
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "El mensaje ha sido eliminado.",
          confirmButtonColor: "#dc2626",
        })
      } catch (error) {
        console.error("Error al eliminar mensaje:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el mensaje.",
          confirmButtonColor: "#dc2626",
        })
      }
    }
  }

  // Seleccionar empresa
  const seleccionarEmpresa = (empresa) => {
    setEmpresaSeleccionadaLocal(empresa)
    setMostrarModalEmpresa(false)
    setTabActiva("conversacion") // Cambiar automáticamente al chat
  }

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setBusquedaEmpresa("")
    setFiltroActivo("todas")
  }

  // Obtener iniciales de empresa
  const obtenerIniciales = (correo) => {
    if (!correo) return "E"
    return correo.charAt(0).toUpperCase()
  }

  // Formatear fecha para chat
  const formatearFechaChat = (timestamp) => {
    if (!timestamp) return ""
    const fecha = timestamp.toDate()
    const ahora = new Date()
    const esHoy = fecha.toDateString() === ahora.toDateString()

    if (esHoy) {
      return fecha.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Mensajes y Comunicación</h2>
              <p className="text-gray-600">
                {empresaSeleccionadaLocal
                  ? `Conversando con ${empresaSeleccionadaLocal.correo}`
                  : "Gestiona mensajes generales y conversaciones privadas"}
              </p>
            </div>
          </div>

          {/* Botón para abrir modal de empresas */}
          <button
            onClick={() => setMostrarModalEmpresa(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            {empresaSeleccionadaLocal ? "Cambiar Empresa" : "Seleccionar Empresa"}
          </button>
        </div>
      </div>

      {/* Modal de selección de empresas */}
      <AnimatePresence>
        {mostrarModalEmpresa && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModalEmpresa(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Seleccionar Empresa</h3>
                      <p className="text-blue-100">Elige una empresa para iniciar conversación</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarModalEmpresa(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Barra de búsqueda y filtros */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Barra de búsqueda */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar empresa por correo o nombre..."
                      value={busquedaEmpresa}
                      onChange={(e) => setBusquedaEmpresa(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {busquedaEmpresa && (
                      <button
                        onClick={() => setBusquedaEmpresa("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFiltroActivo("todas")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtroActivo === "todas"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Todas ({empresas.length})
                    </button>
                    <button
                      onClick={() => setFiltroActivo("con_mensajes")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtroActivo === "con_mensajes"
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Con mensajes
                    </button>
                    <button
                      onClick={() => setFiltroActivo("sin_mensajes")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtroActivo === "sin_mensajes"
                          ? "bg-gray-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Sin mensajes
                    </button>
                  </div>

                  {/* Botón limpiar */}
                  {(busquedaEmpresa || filtroActivo !== "todas") && (
                    <button
                      onClick={limpiarBusqueda}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Mostrando {empresasFiltradas.length} de {empresas.length} empresas
                  </span>
                  {busquedaEmpresa && <span className="text-blue-600">Búsqueda: "{busquedaEmpresa}"</span>}
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                {loadingEmpresas ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
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
                      <p className="text-gray-600">Cargando empresas...</p>
                    </div>
                  </div>
                ) : empresasFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {busquedaEmpresa ? "No se encontraron empresas" : "No hay empresas registradas"}
                    </h4>
                    <p className="text-gray-600">
                      {busquedaEmpresa
                        ? `No hay empresas que coincidan con "${busquedaEmpresa}"`
                        : "Aún no se han registrado empresas en el sistema"}
                    </p>
                    {busquedaEmpresa && (
                      <button
                        onClick={() => setBusquedaEmpresa("")}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {empresasFiltradas.map((empresa, index) => (
                      <motion.div
                        key={empresa.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative bg-white border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                          empresaSeleccionadaLocal?.id === empresa.id
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => seleccionarEmpresa(empresa)}
                      >
                        {/* Badge de seleccionado */}
                        {empresaSeleccionadaLocal?.id === empresa.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </motion.div>
                        )}

                        {/* Avatar de la empresa */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                              empresaSeleccionadaLocal?.id === empresa.id
                                ? "bg-blue-500 text-white"
                                : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                            }`}
                          >
                            {obtenerIniciales(empresa.correo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 truncate">{empresa.correo}</h4>
                            <p className="text-sm text-gray-500 truncate">
                              {empresa.nombre || "Sin nombre registrado"}
                            </p>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Última actividad: Hace 2 días</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span>
                              {conversacion.filter((m) => m.remitente === "empresa" && !m.leido).length > 0
                                ? `${conversacion.filter((m) => m.remitente === "empresa" && !m.leido).length} mensajes sin leer`
                                : "Sin mensajes pendientes"}
                            </span>
                          </div>
                        </div>

                        {/* Botón de acción */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div
                            className={`text-center text-sm font-medium transition-colors ${
                              empresaSeleccionadaLocal?.id === empresa.id
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-blue-600"
                            }`}
                          >
                            {empresaSeleccionadaLocal?.id === empresa.id ? "✓ Seleccionada" : "Seleccionar empresa"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {empresasFiltradas.length} de {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"}
                    {busquedaEmpresa && ` • Búsqueda: "${busquedaEmpresa}"`}
                  </p>
                  <button
                    onClick={() => setMostrarModalEmpresa(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTabActiva("generales")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                tabActiva === "generales"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                Mensajes Generales
              </div>
            </button>

            <button
              onClick={() => {
                if (empresaSeleccionadaLocal) {
                  setTabActiva("conversacion")
                } else {
                  setMostrarModalEmpresa(true)
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                tabActiva === "conversacion"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Chat WhatsApp
                {!empresaSeleccionadaLocal && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    Seleccionar empresa
                  </span>
                )}
                {empresaSeleccionadaLocal &&
                  conversacion.filter((m) => m.remitente === "empresa" && !m.leido).length > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                      {conversacion.filter((m) => m.remitente === "empresa" && !m.leido).length}
                    </span>
                  )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según tab activa */}
      <AnimatePresence mode="wait">
        {tabActiva === "generales" ? (
          <motion.div
            key="generales"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Formulario de publicación */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Crear mensaje general</h3>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                  📢 Visible para todas las empresas
                </div>
              </div>

              <div className="space-y-6">
                {/* Campo título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título del mensaje</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Mantenimiento programado del sistema"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      maxLength={100}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{titulo.length}/100 caracteres</div>
                </div>

                {/* Campo contenido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenido del mensaje</label>
                  <div className="relative">
                    <textarea
                      placeholder="Describe el mensaje o aviso que quieres compartir..."
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                      rows={4}
                      maxLength={500}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{contenido.length}/500 caracteres</div>
                </div>

                {/* Selector de imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen adjunta (opcional)</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {archivoSeleccionado ? archivoSeleccionado.name : "Seleccionar imagen"}
                      </span>
                    </button>

                    {archivoSeleccionado && (
                      <button
                        type="button"
                        onClick={() => {
                          setArchivoSeleccionado(null)
                          if (inputRef.current) inputRef.current.value = ""
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Quitar imagen
                      </button>
                    )}

                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Botón publicar */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={publicarMensaje}
                    disabled={loading || !titulo.trim() || !contenido.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                        Publicando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                        📢 Publicar Mensaje General
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Lista de mensajes generales */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Mensajes publicados ({mensajes.length})</h3>
              </div>
            </div>

            {mensajes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No hay mensajes publicados</p>
                <p className="text-gray-400 text-sm">Los mensajes que publiques aparecerán aquí</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mensajes.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Imagen */}
                    {msg.imagenURL && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={msg.imagenURL || "/placeholder.svg"}
                          alt="Imagen del mensaje"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg text-gray-800 group-hover:text-red-600 transition-colors flex-1 pr-2">
                          {msg.titulo}
                        </h4>
                        <button
                          onClick={() => eliminarMensaje(msg.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                          title="Eliminar mensaje"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{msg.contenido}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0V7a1 1 0 00-1 1v9a2 2 0 002 2h4a2 2 0 002-2V8a1 1 0 00-1-1V7"
                            />
                          </svg>
                          <span>
                            {msg.fecha?.toDate
                              ? msg.fecha.toDate().toLocaleDateString("es-PE", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Fecha no disponible"}
                          </span>
                        </div>
                        <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                          📢 General
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="conversacion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {empresaSeleccionadaLocal ? (
              /* Chat Interface estilo WhatsApp */
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-[700px] flex flex-col">
                {/* Chat Header estilo WhatsApp */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                      {obtenerIniciales(empresaSeleccionadaLocal?.correo)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{empresaSeleccionadaLocal?.correo}</h3>
                      <p className="text-green-100 text-sm flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                        Chat privado • En línea
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages con fondo de WhatsApp */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23f0f0f0' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: "#f0f2f5",
                  }}
                >
                  {conversacion.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mx-auto max-w-md">
                        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">¡Inicia la conversación!</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Envía el primer mensaje para comenzar a chatear con {empresaSeleccionadaLocal?.correo}
                        </p>
                      </div>
                    </div>
                  ) : (
                    conversacion.map((mensaje, index) => {
                      const esAdmin = mensaje.remitente === "admin"
                      const siguienteMensajeEsDelMismoRemitente =
                        index < conversacion.length - 1 && conversacion[index + 1].remitente === mensaje.remitente

                      return (
                        <div
                          key={mensaje.id}
                          className={`flex ${esAdmin ? "justify-end" : "justify-start"} ${
                            siguienteMensajeEsDelMismoRemitente ? "mb-1" : "mb-3"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                              esAdmin
                                ? "bg-green-500 text-white rounded-br-md"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{mensaje.contenido}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1`}>
                              <p className={`text-xs ${esAdmin ? "text-green-100" : "text-gray-500"}`}>
                                {formatearFechaChat(mensaje.fecha)}
                              </p>
                              {esAdmin && (
                                <div className="flex">
                                  <svg className="w-3 h-3 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <svg className="w-3 h-3 text-green-100 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Flecha del mensaje */}
                            <div
                              className={`absolute top-0 w-0 h-0 ${
                                esAdmin
                                  ? "right-0 border-l-8 border-l-green-500 border-t-8 border-t-transparent"
                                  : "left-0 border-r-8 border-r-white border-t-8 border-t-transparent"
                              }`}
                              style={{
                                [esAdmin ? "right" : "left"]: "-8px",
                                top: "0px",
                              }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Chat Input estilo WhatsApp */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-end gap-3">
                    <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={mensajeChat}
                        onChange={(e) => setMensajeChat(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && enviarMensajeChat()}
                        placeholder="Escribe un mensaje..."
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                        disabled={loadingChat}
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={enviarMensajeChat}
                      disabled={loadingChat || !mensajeChat.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loadingChat ? (
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
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Mensaje para seleccionar empresa */
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Selecciona una empresa</h3>
                  <p className="text-gray-600 mb-6">
                    Para iniciar una conversación privada, primero debes seleccionar una empresa desde el botón
                    "Seleccionar Empresa" en la parte superior.
                  </p>
                  <button
                    onClick={() => setMostrarModalEmpresa(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Seleccionar Empresa
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MensajesPanel
