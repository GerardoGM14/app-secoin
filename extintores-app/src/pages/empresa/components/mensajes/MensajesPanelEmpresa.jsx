"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, query, getDocs, orderBy, onSnapshot, addDoc, Timestamp, updateDoc, doc } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"

function MensajesPanelEmpresa({ empresaSeleccionada }) {
  // Estados para mensajes generales
  const [mensajesGenerales, setMensajesGenerales] = useState([])
  const [loadingGenerales, setLoadingGenerales] = useState(true)

  // Estados para chat/conversación
  const [conversacion, setConversacion] = useState([])
  const [mensajeChat, setMensajeChat] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [tabActiva, setTabActiva] = useState("generales") // "generales" o "conversacion"

  const chatContainerRef = useRef()

  // Cargar mensajes generales
  useEffect(() => {
    const obtenerMensajesGenerales = async () => {
      setLoadingGenerales(true)
      try {
        console.log("Obteniendo mensajes generales...")

        // Primero intentamos obtener todos los mensajes
        const todosLosMensajes = await getDocs(collection(db, "mensajes"))
        console.log(
          "Todos los mensajes:",
          todosLosMensajes.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        )

        // Luego filtramos por tipo general
        const q = query(collection(db, "mensajes"), orderBy("fecha", "desc"))
        const snap = await getDocs(q)
        const todosMensajes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        console.log("Mensajes obtenidos:", todosMensajes)

        // Filtrar mensajes generales (incluyendo los que no tienen tipo definido)
        const mensajesGeneralesFiltrados = todosMensajes.filter(
          (msg) => msg.tipo === "general" || msg.remitente === "admin" || !msg.tipo, // Incluir mensajes sin tipo definido (compatibilidad)
        )

        console.log("Mensajes generales filtrados:", mensajesGeneralesFiltrados)
        setMensajesGenerales(mensajesGeneralesFiltrados)
      } catch (error) {
        console.error("Error al obtener mensajes generales:", error)
        // Intentar sin filtros como fallback
        try {
          const snap = await getDocs(collection(db, "mensajes"))
          const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          console.log("Mensajes sin filtro:", lista)
          setMensajesGenerales(lista)
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError)
        }
      } finally {
        setLoadingGenerales(false)
      }
    }

    obtenerMensajesGenerales()
  }, [])

  // Cargar conversación en tiempo real
  useEffect(() => {
    if (!empresaSeleccionada?.id || tabActiva !== "conversacion") return

    const conversacionRef = collection(db, "conversaciones", empresaSeleccionada.id, "mensajes")
    const q = query(conversacionRef, orderBy("fecha", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setConversacion(mensajes)

      // Marcar mensajes del admin como leídos
      snapshot.docs.forEach(async (docSnap) => {
        const mensaje = docSnap.data()
        if (mensaje.remitente === "admin" && !mensaje.leido) {
          await updateDoc(doc(db, "conversaciones", empresaSeleccionada.id, "mensajes", docSnap.id), {
            leido: true,
          })
        }
      })

      // Scroll al final del chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    })

    return () => unsubscribe()
  }, [empresaSeleccionada, tabActiva])

  // Enviar mensaje en chat
  const enviarMensajeChat = async () => {
    if (!mensajeChat.trim() || !empresaSeleccionada?.id) return

    setLoadingChat(true)
    try {
      const conversacionRef = collection(db, "conversaciones", empresaSeleccionada.id, "mensajes")

      await addDoc(conversacionRef, {
        contenido: mensajeChat.trim(),
        remitente: "empresa",
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

  // Formatear fecha para mensajes generales
  const formatearFechaGeneral = (timestamp) => {
    if (!timestamp) return "Fecha no disponible"
    return timestamp.toDate().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
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
            <p className="text-gray-600">Revisa mensajes generales y comunícate con el administrador</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTabActiva("generales")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                tabActiva === "generales"
                  ? "border-blue-500 text-blue-600"
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
                {mensajesGenerales.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {mensajesGenerales.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setTabActiva("conversacion")}
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
                Chat con Admin
                {conversacion.filter((m) => m.remitente === "admin" && !m.leido).length > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {conversacion.filter((m) => m.remitente === "admin" && !m.leido).length}
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
            {/* Debug info - remover en producción */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
              {mensajesGenerales.length > 0 && <p>Último mensaje: {mensajesGenerales[0]?.titulo || "Sin título"}</p>}
            </div>

            {/* Mensajes Generales */}
            {loadingGenerales ? (
              <div className="flex items-center justify-center py-16">
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
                  <p className="text-gray-600">Cargando mensajes...</p>
                </div>
              </div>
            ) : mensajesGenerales.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-16 space-y-4">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-500">No hay mensajes generales</p>
                  <p className="text-gray-400 mt-2">Los mensajes del administrador aparecerán aquí</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mensajesGenerales.map((msg) => (
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
                        <h4 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors flex-1">
                          {msg.titulo || "Sin título"}
                        </h4>
                        <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium ml-2">
                          📢 General
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{msg.contenido || "Sin contenido"}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>Administrador</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatearFechaGeneral(msg.fecha)}</div>
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
            {/* Chat Interface estilo WhatsApp */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-[700px] flex flex-col">
              {/* Chat Header estilo WhatsApp */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Administrador</h3>
                    <p className="text-green-100 text-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                      Chat privado • Soporte técnico
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
                        Envía un mensaje al administrador para obtener ayuda o resolver dudas
                      </p>
                    </div>
                  </div>
                ) : (
                  conversacion.map((mensaje, index) => {
                    const esEmpresa = mensaje.remitente === "empresa"
                    const siguienteMensajeEsDelMismoRemitente =
                      index < conversacion.length - 1 && conversacion[index + 1].remitente === mensaje.remitente

                    return (
                      <div
                        key={mensaje.id}
                        className={`flex ${esEmpresa ? "justify-end" : "justify-start"} ${
                          siguienteMensajeEsDelMismoRemitente ? "mb-1" : "mb-3"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                            esEmpresa
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{mensaje.contenido}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1`}>
                            <p className={`text-xs ${esEmpresa ? "text-blue-100" : "text-gray-500"}`}>
                              {formatearFechaChat(mensaje.fecha)}
                            </p>
                            {esEmpresa && (
                              <div className="flex">
                                <svg className="w-3 h-3 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <svg className="w-3 h-3 text-blue-100 -ml-1" fill="currentColor" viewBox="0 0 20 20">
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
                              esEmpresa
                                ? "right-0 border-l-8 border-l-blue-500 border-t-8 border-t-transparent"
                                : "left-0 border-r-8 border-r-white border-t-8 border-t-transparent"
                            }`}
                            style={{
                              [esEmpresa ? "right" : "left"]: "-8px",
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
                      placeholder="Escribe tu mensaje al administrador..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
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
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MensajesPanelEmpresa

