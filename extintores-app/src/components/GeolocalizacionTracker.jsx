"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"
import { MapPinIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid"

function GeolocalizacionTracker() {
  const [ubicacionPermitida, setUbicacionPermitida] = useState(false)
  const [watchId, setWatchId] = useState(null)
  const intervalRef = useRef(null)
  const isActiveRef = useRef(true)
  const usuarioRef = useRef(null)
  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false)
  const [mostrarModalDenegado, setMostrarModalDenegado] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [procesandoUbicacion, setProcesandoUbicacion] = useState(false)

  // Verificar si ya se activó la ubicación anteriormente
  useEffect(() => {
    const ubicacionActivada = localStorage.getItem("ubicacionActivada")
    if (ubicacionActivada === "true") {
      setUbicacionPermitida(true)
    }
  }, [])

  // Obtener usuario del localStorage
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    usuarioRef.current = usuario

    if (usuario && usuario.uid) {
      // Si la ubicación ya fue activada, iniciar tracking
      if (localStorage.getItem("ubicacionActivada") === "true") {
        iniciarTracking(usuario)
      } else {
        // Mostrar toast para solicitar permiso
        solicitarPermisoUbicacion(usuario)
      }
    }

    return () => {
      // Limpiar al desmontar
      limpiarTracking()
    }
  }, [])

  // Detectar cuando la pestaña está activa/inactiva
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden
      if (!document.hidden && ubicacionPermitida && usuarioRef.current) {
        // Si la pestaña se vuelve activa, reanudar tracking
        iniciarTracking(usuarioRef.current)
      }
    }

    const handleBeforeUnload = () => {
      // Limpiar al cerrar la pestaña
      if (usuarioRef.current) {
        actualizarEstadoUsuario(usuarioRef.current, "ausente")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [ubicacionPermitida])

  const solicitarPermisoUbicacion = async (usuario) => {
    // Esperar un momento para que la página cargue
    setTimeout(() => {
      setMostrarModalUbicacion(true)
    }, 1000)
  }

  const procesarActivacionUbicacion = async () => {
    setProcesandoUbicacion(true)
    try {
      const position = await obtenerUbicacion()
      if (position) {
        setUbicacionPermitida(true)
        localStorage.setItem("ubicacionActivada", "true")
        iniciarTracking(usuarioRef.current)
        setMostrarModalUbicacion(false)
        setProcesandoUbicacion(false)
        setMostrarModalExito(true)
        setTimeout(() => {
          setMostrarModalExito(false)
        }, 2000)
      }
    } catch (error) {
      console.error("Error al obtener ubicación:", error)
      setMostrarModalUbicacion(false)
      setProcesandoUbicacion(false)
      setMostrarModalDenegado(true)
    }
  }

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const actualizarUbicacionEnFirestore = async (usuario, ubicacion) => {
    try {
      const estado = isActiveRef.current ? "conectado" : "ausente"
      const docRef = doc(db, "usuarios_activos", usuario.uid)

      await setDoc(
        docRef,
        {
          uid: usuario.uid,
          nombre: usuario.nombre || usuario.correo || "Usuario",
          correo: usuario.correo,
          rol: usuario.rol,
          ubicacion: {
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            accuracy: ubicacion.accuracy,
          },
          estado: estado,
          ultimaConexion: serverTimestamp(),
          ultimaActualizacion: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (error) {
      console.error("Error al actualizar ubicación en Firestore:", error)
    }
  }

  const actualizarEstadoUsuario = async (usuario, estado) => {
    try {
      const docRef = doc(db, "usuarios_activos", usuario.uid)
      await setDoc(
        docRef,
        {
          estado: estado,
          ultimaActualizacion: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (error) {
      console.error("Error al actualizar estado:", error)
    }
  }

  const iniciarTracking = (usuario) => {
    if (!usuario || !usuario.uid) return

    // Limpiar tracking anterior si existe
    limpiarTracking()

    // Obtener ubicación inicial
    obtenerUbicacion()
      .then((ubicacion) => {
        actualizarUbicacionEnFirestore(usuario, ubicacion)
      })
      .catch((error) => {
        console.error("Error al obtener ubicación inicial:", error)
      })

    // Configurar watchPosition para actualizaciones continuas
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isActiveRef.current && usuarioRef.current) {
            const ubicacion = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }
            actualizarUbicacionEnFirestore(usuarioRef.current, ubicacion)
          }
        },
        (error) => {
          console.error("Error en watchPosition:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // Actualizar cada 30 segundos
        }
      )
      setWatchId(watchId)
    }

    // Actualización periódica adicional cada 45 segundos
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && usuarioRef.current) {
        obtenerUbicacion()
          .then((ubicacion) => {
            actualizarUbicacionEnFirestore(usuarioRef.current, ubicacion)
          })
          .catch((error) => {
            console.error("Error en actualización periódica:", error)
          })
      } else if (usuarioRef.current) {
        // Si está inactivo, actualizar solo el estado
        actualizarEstadoUsuario(usuarioRef.current, "ausente")
      }
    }, 45000) // 45 segundos
  }

  const limpiarTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Limpiar cuando el usuario cierra sesión
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "usuario" && !e.newValue) {
        // Usuario cerró sesión
        if (usuarioRef.current) {
          const docRef = doc(db, "usuarios_activos", usuarioRef.current.uid)
          deleteDoc(docRef).catch(console.error)
        }
        limpiarTracking()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Modal de solicitud de ubicación
  const ModalSolicitudUbicacion = () => (
    <AnimatePresence>
      {mostrarModalUbicacion && (
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
            {!procesandoUbicacion ? (
              <>
                {/* Header del modal */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPinIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Activar Ubicación</h3>
                    <p className="text-sm text-gray-500">Para una mejor experiencia</p>
                  </div>
                </div>

                {/* Información */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    Para una mejor experiencia, necesitamos acceder a tu ubicación.
                  </p>
                  <p className="text-xs text-gray-600">
                    Esto nos permite mejorar nuestros servicios y ofrecerte funcionalidades personalizadas.
                  </p>
                </div>

                {/* Mensaje explicativo */}
                <p className="text-sm text-gray-600 mb-6">
                  Tu ubicación se utilizará únicamente para mejorar la experiencia en la plataforma. Puedes desactivarla
                  en cualquier momento.
                </p>

                {/* Botones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setMostrarModalUbicacion(false)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={procesarActivacionUbicacion}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Activar Ubicación
                  </button>
                </div>
              </>
            ) : (
              // Estado de procesamiento
              <div className="text-center py-8">
                <div className="flex justify-center items-center mb-4">
                  <MapPinIcon
                    className="h-12 w-12 text-red-600"
                    style={{
                      animation: "spin 2s linear infinite",
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Obteniendo Ubicación</h3>
                <p className="text-sm text-gray-600">Por favor, permite el acceso a tu ubicación en tu navegador.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Modal de permiso denegado
  const ModalPermisoDenegado = () => (
    <AnimatePresence>
      {mostrarModalDenegado && (
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
            {/* Header del modal */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Permiso Denegado</h3>
                <p className="text-sm text-gray-500">No se pudo acceder a tu ubicación</p>
              </div>
            </div>

            {/* Información */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                No se pudo acceder a tu ubicación. Puedes activarla más tarde desde la configuración de tu navegador o
                intentar nuevamente.
              </p>
            </div>

            {/* Botón */}
            <button
              onClick={() => {
                setMostrarModalDenegado(false)
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Modal de éxito
  const ModalExito = () => (
    <AnimatePresence>
      {mostrarModalExito && (
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
            {/* Header del modal */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ubicación Activada</h3>
                <p className="text-sm text-gray-500">Tu ubicación ha sido activada correctamente</p>
              </div>
            </div>

            {/* Información */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Tu ubicación se está compartiendo y se actualizará automáticamente mientras uses la plataforma.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Inyectar CSS para animación spin
  useEffect(() => {
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
    if (typeof document !== "undefined") {
      const style = document.createElement("style")
      style.textContent = spinKeyframes
      if (!document.head.querySelector("style[data-spin-geo]")) {
        style.setAttribute("data-spin-geo", "true")
        document.head.appendChild(style)
      }
    }
  }, [])

  return (
    <>
      <ModalSolicitudUbicacion />
      <ModalPermisoDenegado />
      <ModalExito />
    </>
  )
}

export default GeolocalizacionTracker

