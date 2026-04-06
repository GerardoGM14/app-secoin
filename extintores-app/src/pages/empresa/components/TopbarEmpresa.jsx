"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../../../firebase/firebaseConfig"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, query, onSnapshot, limit } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/solid"

function TopbarEmpresa() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarModalLogout, setMostrarModalLogout] = useState(false)
  const [procesandoLogout, setProcesandoLogout] = useState(false)

  // Estados para notificaciones
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [mensajesGenerales, setMensajesGenerales] = useState([])
  const [mensajesPrivados, setMensajesPrivados] = useState([])
  const [totalNotificaciones, setTotalNotificaciones] = useState(0)
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setCargando(false)
    })

    return () => unsubscribe()
  }, [])

  // Cargar notificaciones en tiempo real
  useEffect(() => {
    if (!usuario) return

    setCargandoNotificaciones(true)

    // Escuchar mensajes generales (últimos 5)
    const mensajesGeneralesRef = collection(db, "mensajes")
    const qGenerales = query(mensajesGeneralesRef, limit(5))

    const unsubscribeGenerales = onSnapshot(qGenerales, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        tipo: "general",
      }))
      setMensajesGenerales(mensajes)
    })

    // Escuchar mensajes privados para esta empresa (últimos 5)
    const mensajesPrivadosRef = collection(db, "conversaciones", usuario.uid, "mensajes")
    const qPrivados = query(mensajesPrivadosRef, limit(5))

    const unsubscribePrivados = onSnapshot(qPrivados, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        tipo: "privado",
      }))
      setMensajesPrivados(mensajes)
      setCargandoNotificaciones(false)
    })

    return () => {
      unsubscribeGenerales()
      unsubscribePrivados()
    }
  }, [usuario])

  // Calcular total de notificaciones
  useEffect(() => {
    const total = mensajesGenerales.length + mensajesPrivados.length
    setTotalNotificaciones(total)
  }, [mensajesGenerales, mensajesPrivados])

  // Función para limpiar completamente la sesión
  const limpiarSesionCompleta = async () => {
    console.log("🧹 Iniciando limpieza completa de sesión...")

    try {
      // 1. Cerrar sesión de Firebase
      console.log("🔥 Cerrando sesión de Firebase...")
      await signOut(auth)

      // 2. Limpiar localStorage (preservando ultimoUsuario para detectar cambios de rol)
      console.log("💾 Limpiando localStorage...")
      const ultimoUsuarioBackup = localStorage.getItem("ultimoUsuario")
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key !== "ultimoUsuario") {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => {
        if (key) localStorage.removeItem(key)
      })
      // Restaurar ultimoUsuario después de limpiar
      if (ultimoUsuarioBackup) {
        localStorage.setItem("ultimoUsuario", ultimoUsuarioBackup)
      }

      // 3. Limpiar sessionStorage
      console.log("🗂️ Limpiando sessionStorage...")
      sessionStorage.clear()

      // 4. Limpiar cookies
      console.log("🍪 Limpiando cookies...")
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })

      // 5. Verificar limpieza
      console.log("✅ Verificando limpieza...")
      const verificacion = {
        localStorage: localStorage.length === 0,
        sessionStorage: sessionStorage.length === 0,
        cookies: document.cookie === "",
      }

      console.log("📊 Resultado de verificación:", verificacion)
      return { success: true, verificacion }
    } catch (error) {
      console.error("❌ Error durante la limpieza:", error)
      return { success: false, error: error.message }
    }
  }

  // Función para procesar el logout
  const procesarLogout = async () => {
    setProcesandoLogout(true)

    try {
      console.log("🚪 Iniciando proceso de cierre de sesión...")

      // Pequeña pausa para mostrar el primer paso
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Limpiar sesión completa
      const resultado = await limpiarSesionCompleta()

      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      // Pausa antes de redirigir
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("✅ Sesión cerrada exitosamente")

      // Redirigir al login usando react-router-dom
      setTimeout(() => {
        navigate("/", { replace: true })
      }, 500)
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error)
      setProcesandoLogout(false)
      setMostrarModalLogout(false)

      // Mostrar error al usuario
      alert("Error al cerrar sesión. Por favor, intenta nuevamente.")
    }
  }

  const handleLogout = () => {
    setMostrarModalLogout(true)
  }

  const obtenerIniciales = (email) => {
    if (!email) return "U"
    const partes = email.split("@")[0].split(".")
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase()
    }
    return email[0].toUpperCase()
  }

  // Formatear fecha para notificaciones
  const formatearFecha = (timestamp) => {
    if (!timestamp) return "Hace un momento"

    const fecha = timestamp.toDate()
    const ahora = new Date()
    const diferencia = ahora - fecha

    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(diferencia / (1000 * 60 * 60))
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

    if (minutos < 1) return "Hace un momento"
    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas}h`
    if (dias < 7) return `Hace ${dias}d`

    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    })
  }

  // Truncar texto
  const truncarTexto = (texto, limite = 50) => {
    if (!texto) return ""
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto
  }

  // Modal de confirmación de logout
  const ModalLogout = () => (
    <AnimatePresence>
      {mostrarModalLogout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
          >
            {!procesandoLogout ? (
              <>
                {/* Header del modal */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cerrar Sesión</h3>
                    <p className="text-sm text-gray-500">¿Estás seguro de que deseas salir?</p>
                  </div>
                </div>

                {/* Información del usuario actual */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {obtenerIniciales(usuario?.email)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{usuario?.email}</p>
                      <p className="text-xs text-gray-500">Panel Empresarial</p>
                    </div>
                  </div>
                </div>

                {/* Mensaje explicativo */}
                <p className="text-sm text-gray-600 mb-6">
                  Al cerrar sesión, se limpiarán todos los datos almacenados localmente y serás redirigido a la página
                  de inicio de sesión.
                </p>

                {/* Botones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setMostrarModalLogout(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={procesarLogout}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              // Estado de procesamiento
              <div className="text-center py-8">
                <div className="flex justify-center items-center mb-4">
                  <ArrowPathIcon
                    className="h-12 w-12 text-red-600"
                    style={{
                      animation: "spin 2s linear infinite",
                    }}
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cerrando Sesión</h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    ✓ Cerrando sesión de Firebase...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    ✓ Limpiando datos locales...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    ✓ Eliminando cookies de sesión...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                    ✓ Verificando limpieza completa...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="text-red-600 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Redirigiendo al login...
                  </motion.p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Panel de notificaciones
  const PanelNotificaciones = () => (
    <AnimatePresence>
      {mostrarNotificaciones && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden"
        >
          {/* Header del panel */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                <h3 className="font-semibold">Notificaciones</h3>
              </div>
              <button
                onClick={() => setMostrarNotificaciones(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-red-100 text-sm mt-1">
              {totalNotificaciones} {totalNotificaciones === 1 ? "notificación" : "notificaciones"}
            </p>
          </div>

          {/* Contenido del panel */}
          <div className="max-h-96 overflow-y-auto">
            {cargandoNotificaciones ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Cargando notificaciones...</p>
              </div>
            ) : totalNotificaciones === 0 ? (
              <div className="p-6 text-center">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <BellIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No hay notificaciones</p>
                <p className="text-gray-400 text-sm">Te notificaremos cuando recibas mensajes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Mensajes Generales */}
                {mensajesGenerales.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SpeakerWaveIcon className="w-4 h-4 text-red-500" />
                      <h4 className="font-semibold text-gray-800 text-sm">Mensajes Generales</h4>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                        {mensajesGenerales.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {mensajesGenerales.map((mensaje) => (
                        <motion.div
                          key={mensaje.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-red-50 border border-red-100 rounded-lg p-3 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-800 text-sm truncate">{mensaje.titulo}</h5>
                              <p className="text-gray-600 text-xs mt-1">{truncarTexto(mensaje.contenido, 60)}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatearFecha(mensaje.fecha)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-600 font-medium">Mensaje General</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensajes Privados */}
                {mensajesPrivados.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-green-500" />
                      <h4 className="font-semibold text-gray-800 text-sm">Mensajes Privados</h4>
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                        {mensajesPrivados.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {mensajesPrivados.map((mensaje) => (
                        <motion.div
                          key={mensaje.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-green-50 border border-green-100 rounded-lg p-3 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-800 text-sm">Mensaje del Administrador</h5>
                              <p className="text-gray-600 text-xs mt-1">{truncarTexto(mensaje.contenido, 60)}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatearFecha(mensaje.fecha)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Chat Privado</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer del panel */}
          {totalNotificaciones > 0 && (
            <div className="bg-gray-50 p-3 border-t border-gray-200">
              <button className="w-full text-center text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Agregar CSS para la animación de spin
  const spinKeyframes = `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `

  // Inyectar el CSS
  if (typeof document !== "undefined") {
    const style = document.createElement("style")
    style.textContent = spinKeyframes
    if (!document.head.querySelector("style[data-spin-topbar]")) {
      style.setAttribute("data-spin-topbar", "true")
      document.head.appendChild(style)
    }
  }

  return (
    <>
      {/* Modal de logout */}
      <ModalLogout />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-16 flex items-center justify-between px-6 bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg border-b border-gray-700"
      >
        {/* Logo y título */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Panel Empresarial</h1>
            <p className="text-xs text-gray-300 hidden sm:block">Sistema de Gestión Documental</p>
          </div>
        </div>

        {/* Sección derecha */}
        <div className="flex items-center gap-4">
          {/* Notificaciones interactivas */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Notificaciones"
            >
              <BellIcon className="w-5 h-5" />
              {totalNotificaciones > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                >
                  {totalNotificaciones > 9 ? "9+" : totalNotificaciones}
                </motion.span>
              )}
            </motion.button>

            {/* Panel de notificaciones */}
            <PanelNotificaciones />
          </div>

          {/* Configuración */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            title="Configuración"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>

          {/* Información del usuario */}
          {cargando ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="hidden sm:block">
                <div className="w-24 h-3 bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-2 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ) : usuario ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {obtenerIniciales(usuario.email)}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-white text-sm font-medium">{usuario.email}</p>
                <p className="text-gray-300 text-xs">Sesión Activa</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-300 text-sm">No autenticado</div>
          )}

          {/* Botón de logout mejorado */}
          {usuario && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
              title="Cerrar Sesión"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
            </motion.button>
          )}

          {/* Copyright */}
          <div className="hidden lg:block text-right text-xs border-l border-gray-600 pl-4">
            <p className="text-gray-400">© 2024</p>
            <p
              className="text-gray-300 font-medium cursor-pointer hover:text-white transition-colors duration-200"
              title="Desarrollado por Gerardo Fabian Gonzalez Moreno"
            >
              GFGM Dev
            </p>
          </div>
        </div>
      </motion.header>
    </>
  )
}

export default TopbarEmpresa
