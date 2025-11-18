"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { tsParticles } from "tsparticles-engine"
import { auth, db } from "../firebase/firebaseConfig"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import {
  LockClosedIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid"

function Login() {
  const [correo, setCorreo] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mostrarModalCambio, setMostrarModalCambio] = useState(false)
  const [datosNuevoUsuario, setDatosNuevoUsuario] = useState(null)
  const [usuarioAnterior, setUsuarioAnterior] = useState(null)
  const [procesandoCambio, setProcesandoCambio] = useState(false)
  const navigate = useNavigate()

  // URLs de las imágenes
  const logoSecoinUrl = "https://i.postimg.cc/QCYtyDLZ/Logo-SECOIN.png"
  const capacitacion1Url = "https://i.postimg.cc/BQsyK9kM/Agregar-un-t-tulo-4.png"
  const capacitacion2Url = "https://i.postimg.cc/G2yNkcbS/Agregar-un-t-tulo-3.png"

  useEffect(() => {
    const iniciarParticulas = async () => {
      await tsParticles.load("tsparticles", {
        background: {
          color: { value: "#f8fafc" },
        },
        particles: {
          number: { value: 60 },
          color: { value: "#ef4444" },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0.1,
              sync: false,
            },
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            outModes: "out",
          },
          opacity: {
            value: 0.3,
            random: true,
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.1,
              sync: false,
            },
          },
          links: {
            enable: true,
            color: "#ef4444",
            opacity: 0.1,
            distance: 120,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            grab: {
              distance: 100,
              links: {
                opacity: 0.3,
              },
            },
          },
        },
      })
    }
    iniciarParticulas()
  }, [])

  // Función para detectar cambio de rol
  const detectarCambioRol = (nuevoUsuario) => {
    // Primero intentar con localStorage (sesión activa)
    const usuarioActual = localStorage.getItem("usuario")
    if (usuarioActual) {
      try {
        const usuarioParseado = JSON.parse(usuarioActual)
        console.log("🔍 Comparando usuarios (localStorage):", {
          anterior: usuarioParseado.rol,
          nuevo: nuevoUsuario.rol,
          correoAnterior: usuarioParseado.correo,
          correoNuevo: nuevoUsuario.correo,
        })
        
        // Detectar cambio de rol o correo
        if (usuarioParseado.rol !== nuevoUsuario.rol || usuarioParseado.correo !== nuevoUsuario.correo) {
          console.log("✅ Cambio detectado - retornando usuario anterior")
          return usuarioParseado
        }
        console.log("❌ No hay cambio detectado")
      } catch (error) {
        console.error("Error al parsear usuario anterior:", error)
      }
    } else {
      console.log("⚠️ No hay usuario anterior en localStorage")
    }

    // Si no hay en localStorage, intentar con últimoUsuario (persiste después de cerrar sesión)
    const ultimoUsuario = localStorage.getItem("ultimoUsuario")
    if (ultimoUsuario) {
      try {
        const usuarioParseado = JSON.parse(ultimoUsuario)
        console.log("🔍 Comparando usuarios (ultimoUsuario):", {
          anterior: usuarioParseado.rol,
          nuevo: nuevoUsuario.rol,
          correoAnterior: usuarioParseado.correo,
          correoNuevo: nuevoUsuario.correo,
        })
        
        // Detectar cambio de rol o correo
        if (usuarioParseado.rol !== nuevoUsuario.rol || usuarioParseado.correo !== nuevoUsuario.correo) {
          console.log("✅ Cambio detectado (desde último usuario) - retornando usuario anterior")
          return usuarioParseado
        }
        console.log("❌ No hay cambio detectado con último usuario")
      } catch (error) {
        console.error("Error al parsear último usuario:", error)
      }
    } else {
      console.log("⚠️ No hay último usuario guardado")
    }
    
    return null
  }

  // Función mejorada para guardar sesión completa
  const guardarSesionCompleta = (usuario, uid) => {
    const datosCompletos = {
      ...usuario,
      uid: uid,
      id: uid,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      sessionId: Date.now().toString(),
    }

    console.log("💾 Guardando sesión completa:", datosCompletos)

    // Guardar en localStorage
    localStorage.setItem("usuario", JSON.stringify(datosCompletos))
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userRole", usuario.rol)
    localStorage.setItem("userEmail", usuario.correo)
    localStorage.setItem("userUID", uid)

    // Guardar también como último usuario (para detectar cambios después de cerrar sesión)
    // Esto NO se limpia al cerrar sesión, solo se actualiza con el nuevo login
    localStorage.setItem("ultimoUsuario", JSON.stringify(datosCompletos))

    // Guardar en sessionStorage
    sessionStorage.setItem("usuario", JSON.stringify(datosCompletos))
    sessionStorage.setItem("isAuthenticated", "true")
    sessionStorage.setItem("userRole", usuario.rol)
    sessionStorage.setItem("userEmail", usuario.correo)
    sessionStorage.setItem("userUID", uid)

    // Verificar que se guardó correctamente
    const verificacion = localStorage.getItem("usuario")
    if (verificacion) {
      console.log("✅ Sesión verificada:", JSON.parse(verificacion))
      return true
    } else {
      console.error("❌ Error: No se pudo verificar la sesión guardada")
      return false
    }
  }

  // Función para procesar el cambio de usuario
  const procesarCambioUsuario = async () => {
    setProcesandoCambio(true)

    try {
      console.log("🔄 Procesando cambio de usuario...")

      // Paso 1: Cerrar sesión de Firebase
      if (auth.currentUser) {
        await signOut(auth)
        console.log("🔓 Sesión de Firebase cerrada")
      }

      // Paso 2: Limpiar storage completamente (excepto ultimoUsuario para futuras comparaciones)
      const ultimoUsuarioBackup = localStorage.getItem("ultimoUsuario")
      localStorage.clear()
      sessionStorage.clear()
      // Restaurar ultimoUsuario después de limpiar (para que persista)
      if (ultimoUsuarioBackup) {
        localStorage.setItem("ultimoUsuario", ultimoUsuarioBackup)
      }
      console.log("🧹 Storage limpiado (manteniendo último usuario para comparación)")

      // Paso 3: Pequeña pausa para asegurar limpieza
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Paso 4: Autenticar nuevamente con Firebase para obtener UID
      // Usar las credenciales del nuevo usuario
      const correoNuevo = datosNuevoUsuario.correo
      const userCredential = await signInWithEmailAndPassword(auth, correoNuevo, contrasena)
      const uid = userCredential.user.uid
      console.log("🔑 Re-autenticado con UID:", uid)

      // Paso 5: Guardar nueva sesión completa
      const sesionGuardada = guardarSesionCompleta(datosNuevoUsuario, uid)

      if (!sesionGuardada) {
        throw new Error("Error al guardar la sesión")
      }

      // Actualizar también ultimoUsuario con el nuevo usuario
      const datosCompletos = {
        ...datosNuevoUsuario,
        uid: uid,
        id: uid,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        sessionId: Date.now().toString(),
      }
      localStorage.setItem("ultimoUsuario", JSON.stringify(datosCompletos))

      console.log("💾 Nueva sesión guardada correctamente")

      // Paso 6: Navegar según el nuevo rol
      setTimeout(() => {
        if (datosNuevoUsuario.rol === "administrador") {
          window.location.href = "/admin"
        } else if (datosNuevoUsuario.rol === "empresa") {
          window.location.href = "/empresa"
        }
      }, 1000)

      console.log("✅ Cambio de usuario completado")
    } catch (error) {
      console.error("❌ Error en cambio de usuario:", error)
      setError("Error al cambiar de usuario. Intenta nuevamente.")
      setProcesandoCambio(false)
      setMostrarModalCambio(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setCargando(true)

    try {
      console.log("🔐 Iniciando login...")

      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena)
      const uid = userCredential.user.uid
      console.log("🔑 UID obtenido:", uid)

      const docRef = doc(db, "usuarios", uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const usuario = docSnap.data()
        console.log("✅ Usuario obtenido:", usuario.rol)

        if (!usuario.rol || (usuario.rol !== "administrador" && usuario.rol !== "empresa")) {
          throw new Error("Rol no válido")
        }

        // Detectar cambio de rol ANTES de guardar la nueva sesión
        const usuarioAnteriorDetectado = detectarCambioRol(usuario)

        console.log("🔍 Resultado de detección:", {
          usuarioAnteriorDetectado,
          nuevoRol: usuario.rol,
          nuevoCorreo: usuario.correo,
        })

        if (usuarioAnteriorDetectado) {
          console.log("🔄 Cambio de rol detectado:", {
            anterior: usuarioAnteriorDetectado.rol,
            nuevo: usuario.rol,
            correoAnterior: usuarioAnteriorDetectado.correo,
            correoNuevo: usuario.correo,
          })

          // IMPORTANTE: NO guardar la sesión todavía, mostrar el modal primero
          // Mostrar modal de cambio
          setUsuarioAnterior(usuarioAnteriorDetectado)
          setDatosNuevoUsuario({ ...usuario, uid })
          setMostrarModalCambio(true)
          setCargando(false)
          return // Salir aquí para que no se guarde la sesión ni se redirija
        }

        // Si no hay cambio de rol, proceder normalmente
        const sesionGuardada = guardarSesionCompleta(usuario, uid)

        if (!sesionGuardada) {
          throw new Error("Error al guardar la sesión")
        }

        if (usuario.rol === "administrador") {
          navigate("/admin")
        } else if (usuario.rol === "empresa") {
          navigate("/empresa")
        }
      } else {
        throw new Error("Usuario sin información en la base de datos")
      }
    } catch (err) {
      console.error("❌ Error:", err)

      let mensajeError = "Error al iniciar sesión. Intenta nuevamente."

      if (err.code === "auth/user-not-found") {
        mensajeError = "No existe una cuenta con este correo electrónico."
      } else if (err.code === "auth/wrong-password") {
        mensajeError = "La contraseña es incorrecta."
      } else if (err.code === "auth/invalid-email") {
        mensajeError = "El formato del correo electrónico no es válido."
      } else if (err.code === "auth/too-many-requests") {
        mensajeError = "Demasiados intentos fallidos. Intenta más tarde."
      } else if (err.message.includes("sesión")) {
        mensajeError = "Error al guardar la sesión. Intenta nuevamente."
      }

      setError(mensajeError)
    } finally {
      setCargando(false)
    }
  }

  // Modal de cambio de usuario
  const ModalCambioUsuario = () => (
    <AnimatePresence>
      {mostrarModalCambio && (
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
            {!procesandoCambio ? (
              <>
                {/* Header del modal */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cambio de Usuario Detectado</h3>
                    <p className="text-sm text-gray-500">
                      {usuarioAnterior?.rol === "administrador" && datosNuevoUsuario?.rol === "empresa"
                        ? "Cambiando de administrador a empresa"
                        : usuarioAnterior?.rol === "empresa" && datosNuevoUsuario?.rol === "administrador"
                        ? "Cambiando de empresa a administrador"
                        : "Se requiere cambiar la sesión actual"}
                    </p>
                  </div>
                </div>

                {/* Información del cambio */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Usuario actual:</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{usuarioAnterior?.correo}</p>
                        <p className="text-xs text-gray-500 capitalize">{usuarioAnterior?.rol}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Nuevo usuario:</span>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600">{datosNuevoUsuario?.correo}</p>
                          <p className="text-xs text-red-500 capitalize">{datosNuevoUsuario?.rol}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensaje explicativo */}
                <p className="text-sm text-gray-600 mb-6">
                  {usuarioAnterior?.rol === "administrador" && datosNuevoUsuario?.rol === "empresa"
                    ? "Estás cambiando de sesión de administrador a empresa. Se limpiará la sesión actual y se configurará la nueva sesión empresarial."
                    : usuarioAnterior?.rol === "empresa" && datosNuevoUsuario?.rol === "administrador"
                    ? "Estás cambiando de sesión de empresa a administrador. Se limpiará la sesión actual y se configurará la nueva sesión administrativa."
                    : "Para cambiar de usuario, necesitamos limpiar la sesión actual y configurar la nueva. Este proceso es automático y te redirigirá al panel correspondiente."}
                </p>

                {/* Botones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setMostrarModalCambio(false)
                      setCargando(false)
                      setError("")
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={procesarCambioUsuario}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Cambiar Usuario
                  </button>
                </div>
              </>
            ) : (
              // Estado de procesamiento con ícono centrado
              <div className="text-center py-8">
                <div className="flex justify-center items-center mb-4">
                  <ArrowPathIcon
                    className="h-12 w-12 text-red-600"
                    style={{
                      animation: "spin 2s linear infinite",
                    }}
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando Cambio de Usuario</h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    ✓ Cerrando sesión anterior...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    ✓ Limpiando datos del sistema...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    ✓ Re-autenticando usuario...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                    ✓ Configurando nueva sesión...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="text-red-600 font-medium"
                  >
                    🚀 Redirigiendo al panel...
                  </motion.p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Agregar esto antes del return, después de todas las funciones
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
    if (!document.head.querySelector("style[data-spin]")) {
      style.setAttribute("data-spin", "true")
      document.head.appendChild(style)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      {/* Fondo animado */}
      <div id="tsparticles" className="absolute inset-0 -z-10" />

      {/* Modal de cambio de usuario */}
      <ModalCambioUsuario />

      {/* Header mejorado con información de contacto */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-10 lg:space-y-0">
            {/* Información de oficina */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-12"
            >
              {/* Dirección */}
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <MapPinIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">Oficina Principal Chimbote</p>
                  <p className="text-xs text-red-100">Av. Enrique Meiggs 555 / Av. Meiggs 1252. Chimbote</p>
                </div>
              </div>

              {/* Separador */}
              <div className="hidden lg:block w-px h-12 bg-white/30"></div>

              {/* Correos */}
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <EnvelopeIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">Correos:</p>
                  <p className="text-xs text-red-100">taller@secoinperu.com / administración@secoinperu.com</p>
                </div>
              </div>
            </motion.div>

            {/* Separador escritorio */}
            <div className="hidden lg:block w-px h-12 bg-white/30"></div>

            {/* Divisor móviles */}
            <div className="lg:hidden w-full h-px bg-white/30 my-6"></div>

            {/* Información de contacto */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-12"
            >
              <div className="hidden lg:block w-px h-12 bg-white/30"></div>

              {/* Línea Secoin Informes */}
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <DevicePhoneMobileIcon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium">Línea Secoin Informes</p>
                  <p className="text-xs text-red-100">(043) 32 4526 • (043) 61 6441</p>
                </div>
              </div>

              {/* Separador */}
              <div className="hidden lg:block w-px h-12 bg-white/30"></div>

              {/* Secoin Emergencia */}
              <div className="flex items-center space-x-2">
                <div className="bg-yellow-400 p-1.5 rounded-full">
                  <PhoneIcon className="h-4 w-4 text-red-700" />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium">Secoin Emergencia</p>
                  <p className="text-xs text-red-100">998 398 981 • 998 398 982 • 944 974 808</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"></div>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex items-center justify-center min-h-screen pt-8 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-white shadow-2xl rounded-3xl w-full max-w-7xl flex overflow-hidden border border-gray-200 backdrop-blur-sm bg-white/95"
        >
          {/* Panel izquierdo - Logo SECOIN */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-1/3 hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-red-100 to-orange-50 p-8"
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              src={logoSecoinUrl}
              alt="Logo SECOIN"
              className="w-80 h-auto hover:scale-105 transition-transform duration-300"
            />
          </motion.div>

          {/* Panel central - Formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full lg:w-1/3 p-8 md:p-12 flex flex-col justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">¡Bienvenido!</h1>
              <p className="text-gray-500">Inicia sesión para acceder a la App SECOIN</p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    disabled={cargando}
                    placeholder="taller@secoinperu.com"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                    disabled={cargando}
                    placeholder="••••••••••••"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-3 px-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <motion.button
                type="submit"
                disabled={cargando}
                whileHover={!cargando ? { scale: 1.02 } : {}}
                whileTap={!cargando ? { scale: 0.98 } : {}}
                animate={
                  cargando
                    ? {
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0 10px 25px rgba(239, 68, 68, 0.3)",
                          "0 15px 35px rgba(239, 68, 68, 0.4)",
                          "0 10px 25px rgba(239, 68, 68, 0.3)",
                        ],
                      }
                    : {}
                }
                transition={
                  cargando
                    ? {
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                    : {
                        duration: 0.3,
                      }
                }
                className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  cargando
                    ? "bg-gradient-to-r from-red-400 to-red-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-xl"
                } text-white`}
              >
                {cargando ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-5 w-5 text-white" />
                    <span>Iniciar sesión</span>
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="my-8 flex items-center"
            >
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">o continúa con</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex justify-center space-x-4"
            >
              {[
                {
                  name: "Google",
                  src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png",
                  hover: "hover:bg-red-50",
                },
                {
                  name: "GitHub",
                  src: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
                  hover: "hover:bg-gray-50",
                },
                {
                  name: "Facebook",
                  src: "https://www.facebook.com/images/fb_icon_325x325.png",
                  hover: "hover:bg-blue-50",
                },
              ].map((social, index) => (
                <motion.a
                  key={social.name}
                  href="#"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`border border-gray-200 rounded-lg p-3 w-12 h-12 flex items-center justify-center ${social.hover} transition-all duration-300 shadow-sm hover:shadow-md`}
                >
                  <img
                    src={social.src || "/placeholder.svg"}
                    alt={social.name}
                    className="w-5 h-5 transition-transform duration-300"
                  />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Panel derecho - Capacitaciones */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-1/3 hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100 p-8 space-y-8"
          >
            {/* Primera imagen de capacitación */}
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              src={capacitacion1Url}
              alt="Capacitación 1"
              className="w-40 h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
            />

            {/* Segunda imagen de capacitación */}
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              src={capacitacion2Url}
              alt="Capacitación 2"
              className="w-40 h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="absolute bottom-4 text-center w-full text-sm text-gray-500"
      >
        © 2025 SECOIN - Seguridad Contra Incendios | Desarrollado por Gerardo Gonzalez
      </motion.footer>
    </div>
  )
}

export default Login


