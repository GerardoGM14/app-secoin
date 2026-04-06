"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "../../../../firebase/firebaseConfig"
import { MapPinIcon, UserCircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from "@heroicons/react/24/solid"
import { motion, AnimatePresence } from "framer-motion"

function MonitoreoUsuariosPanel() {
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mapaCargado, setMapaCargado] = useState(false)

  // Escuchar cambios en tiempo real de usuarios activos
  useEffect(() => {
    const q = query(collection(db, "usuarios_activos"), orderBy("ultimaConexion", "desc"))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usuariosData = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          usuariosData.push({
            id: doc.id,
            ...data,
            ultimaConexion: data.ultimaConexion?.toDate() || new Date(),
          })
        })
        setUsuarios(usuariosData)
        // Actualizar el usuario seleccionado con los datos frescos
        setUsuarioSeleccionado((prev) => {
          if (!prev) return null
          const actualizado = usuariosData.find((u) => u.id === prev.id)
          return actualizado || null
        })
        setCargando(false)
      },
      (error) => {
        console.error("Error al obtener usuarios:", error)
        setCargando(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Cargar Google Maps cuando se selecciona un usuario
  useEffect(() => {
    if (usuarioSeleccionado && usuarioSeleccionado.ubicacion) {
      // Reiniciar el estado del mapa para permitir recarga
      setMapaCargado(false)
      // Limpiar el contenido del mapa anterior
      const mapElement = document.getElementById("mapa-usuario")
      if (mapElement) {
        mapElement.innerHTML = ""
      }
      // Cargar Google Maps
      if (window.google && window.google.maps) {
        setMapaCargado(true)
        inicializarMapa()
      } else {
        cargarGoogleMaps()
      }
    }
  }, [usuarioSeleccionado])

  const cargarGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === "TU_API_KEY_AQUI") {
      console.warn("API Key de Google Maps no configurada.")
      return
    }

    return new Promise((resolve, reject) => {
      // Si ya existe el script, no volver a cargarlo
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        setMapaCargado(true)
        inicializarMapa()
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log("Google Maps cargado correctamente")
        setMapaCargado(true)
        inicializarMapa()
        resolve()
      }

      script.onerror = (error) => {
        console.error("Error al cargar Google Maps:", error)
        reject(error)
      }

      document.head.appendChild(script)
    })
  }

  const inicializarMapa = async () => {
    if (!usuarioSeleccionado?.ubicacion) return

    const { lat, lng } = usuarioSeleccionado.ubicacion
    const mapElement = document.getElementById("mapa-usuario")

    if (!mapElement) return

    try {
      const mapa = new window.google.maps.Map(mapElement, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })

      // Marcador estándar
      new window.google.maps.Marker({
        position: { lat, lng },
        map: mapa,
        title: usuarioSeleccionado.nombre || usuarioSeleccionado.correo,
      })

      // Agregar círculo de precisión
      if (usuarioSeleccionado.ubicacion.accuracy) {
        new window.google.maps.Circle({
          strokeColor: "#ef4444",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#ef4444",
          fillOpacity: 0.1,
          map: mapa,
          center: { lat, lng },
          radius: usuarioSeleccionado.ubicacion.accuracy,
        })
      }
    } catch (error) {
      console.error("Error al inicializar el mapa:", error)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "conectado":
        return "bg-green-100 text-green-800 border-green-300"
      case "ausente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "desconectado":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "conectado":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case "ausente":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const formatearTiempo = (fecha) => {
    if (!fecha) return "N/A"
    const ahora = new Date()
    const diff = ahora - fecha
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (minutos < 1) return "Hace un momento"
    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas} h`
    return `Hace ${dias} días`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <MapPinIcon className="h-8 w-8 text-red-600" />
              Monitoreo de Usuarios
            </h2>
            <p className="text-gray-500 mt-1">Visualiza la ubicación y estado de los usuarios conectados</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total de usuarios</div>
            <div className="text-3xl font-bold text-red-600">{usuarios.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de usuarios */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
              <h3 className="font-semibold text-lg">Usuarios Activos</h3>
            </div>

            {cargando ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <UserCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay usuarios conectados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                <AnimatePresence>
                  {usuarios.map((usuario) => (
                    <motion.div
                      key={usuario.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        usuarioSeleccionado?.id === usuario.id
                          ? "bg-red-50 border-l-4 border-red-600"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setUsuarioSeleccionado(usuario)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            <h4 className="font-semibold text-gray-800">
                              {usuario.nombre || usuario.correo || "Usuario sin nombre"}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{usuario.correo}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                              {usuario.rol}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getEstadoColor(
                                usuario.estado || "desconectado"
                              )}`}
                            >
                              {usuario.estado || "desconectado"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <ClockIcon className="h-3 w-3" />
                            {formatearTiempo(usuario.ultimaConexion)}
                          </div>
                        </div>
                        <div className="ml-2">{getEstadoIcon(usuario.estado || "desconectado")}</div>
                      </div>
                      {!usuario.ubicacion && (
                        <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          Ubicación no disponible
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Mapa y detalles */}
        <div className="lg:col-span-2">
          {usuarioSeleccionado ? (
            <div className="space-y-4">
              {/* Información del usuario seleccionado */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <EyeIcon className="h-6 w-6 text-red-600" />
                      {usuarioSeleccionado.nombre || usuarioSeleccionado.correo}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">{usuarioSeleccionado.correo}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getEstadoColor(
                      usuarioSeleccionado.estado || "desconectado"
                    )}`}>
                      {getEstadoIcon(usuarioSeleccionado.estado || "desconectado")}
                      <span className="text-sm font-medium capitalize">
                        {usuarioSeleccionado.estado || "desconectado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rol</p>
                    <p className="font-semibold text-gray-800 capitalize">{usuarioSeleccionado.rol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Última conexión</p>
                    <p className="font-semibold text-gray-800">
                      {formatearTiempo(usuarioSeleccionado.ultimaConexion)}
                    </p>
                  </div>
                </div>

                {usuarioSeleccionado.ubicacion ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Latitud</p>
                      <p className="font-mono text-sm text-gray-800">{usuarioSeleccionado.ubicacion.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Longitud</p>
                      <p className="font-mono text-sm text-gray-800">{usuarioSeleccionado.ubicacion.lng.toFixed(6)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 text-sm">
                      Este usuario no ha activado la ubicación o no está disponible
                    </p>
                  </div>
                )}
              </div>

              {/* Mapa */}
              {usuarioSeleccionado.ubicacion ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5" />
                      Ubicación en el Mapa
                    </h3>
                  </div>
                  <div id="mapa-usuario" className="w-full h-[500px]"></div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay ubicación disponible para mostrar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <EyeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Selecciona un usuario para ver su ubicación</p>
              <p className="text-gray-400 text-sm">Haz clic en un usuario de la lista para visualizar su ubicación en el mapa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonitoreoUsuariosPanel

