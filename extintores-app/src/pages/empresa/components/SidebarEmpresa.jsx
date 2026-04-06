"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../../../firebase/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  AcademicCapIcon,
  ChatBubbleLeftEllipsisIcon,
  FolderIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid"

function SidebarEmpresa({ setSeccionActiva, seccionActiva }) {
  const [usuario, setUsuario] = useState(null)
  const [logoEmpresa, setLogoEmpresa] = useState("")
  const [nombreEmpresa, setNombreEmpresa] = useState("")
  const [nombrePersonalizado, setNombrePersonalizado] = useState("")
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreTemporal, setNombreTemporal] = useState("")
  const [cargando, setCargando] = useState(true)
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const menu = [
    { id: "inicio", label: "Inicio", icon: <HomeIcon className="h-5 w-5" /> },
    { id: "inspeccion", label: "Inspección", icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
    { id: "informes", label: "Informes", icon: <DocumentChartBarIcon className="h-5 w-5" /> },
    { id: "capacitacion", label: "Capacitación", icon: <AcademicCapIcon className="h-5 w-5" /> },
    { id: "mensajes", label: "Mensajes", icon: <ChatBubbleLeftEllipsisIcon className="h-5 w-5" /> },
    { id: "administracion", label: "Documentos", icon: <FolderIcon className="h-5 w-5" /> },
  ]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user)
        // Extraer nombre de empresa del email (parte antes del @)
        const emailParts = user.email.split("@")
        const nombreExtraido = emailParts[0]
        const nombreFormateado = nombreExtraido.charAt(0).toUpperCase() + nombreExtraido.slice(1)
        setNombreEmpresa(nombreFormateado)

        // Configurar listener en tiempo real para los datos de la empresa
        const empresaDocRef = doc(db, "usuarios", user.uid)
        const unsubscribeDoc = onSnapshot(
          empresaDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const empresaData = docSnapshot.data()
              console.log("📊 Datos de empresa actualizados:", empresaData)

              // Actualizar logo si existe
              if (empresaData.logoUrl) {
                console.log("🖼️ Nuevo logo detectado:", empresaData.logoUrl)
                setLogoEmpresa(empresaData.logoUrl)
                setLogoError(false)
              } else {
                console.log("🚫 No hay logo configurado")
                setLogoEmpresa("")
              }

              // Actualizar nombre personalizado si existe, sino usar el del email
              if (empresaData.nombrePersonalizado) {
                setNombrePersonalizado(empresaData.nombrePersonalizado)
              } else {
                setNombrePersonalizado(nombreFormateado)
              }
            } else {
              console.log("📄 Documento de empresa no existe, usando datos del email")
              // Si no existe el documento, usar el nombre del email
              setNombrePersonalizado(nombreFormateado)
              setLogoEmpresa("")
            }
            setCargando(false)
          },
          (error) => {
            console.error("❌ Error al escuchar cambios en empresa:", error)
            // En caso de error, usar datos del email
            setNombrePersonalizado(nombreFormateado)
            setLogoEmpresa("")
            setCargando(false)
          },
        )

        // Cleanup function para el listener del documento
        return () => unsubscribeDoc()
      } else {
        setCargando(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const iniciarEdicion = () => {
    setNombreTemporal(nombrePersonalizado)
    setEditandoNombre(true)
  }

  const cancelarEdicion = () => {
    setNombreTemporal("")
    setEditandoNombre(false)
  }

  const guardarNombre = async () => {
    if (!nombreTemporal.trim() || !usuario) return

    setGuardandoNombre(true)
    try {
      // Actualizar en Firestore
      await updateDoc(doc(db, "usuarios", usuario.uid), {
        nombrePersonalizado: nombreTemporal.trim(),
      })

      // El listener se encargará de actualizar el estado local automáticamente
      setEditandoNombre(false)
      setNombreTemporal("")
      console.log("✅ Nombre personalizado guardado exitosamente")
    } catch (error) {
      console.error("❌ Error al guardar el nombre personalizado:", error)
      // En caso de error, mantener el nombre anterior
      setNombreTemporal(nombrePersonalizado)
    } finally {
      setGuardandoNombre(false)
    }
  }

  const manejarTeclaEnter = (e) => {
    if (e.key === "Enter") {
      guardarNombre()
    } else if (e.key === "Escape") {
      cancelarEdicion()
    }
  }

  const obtenerIniciales = (nombre) => {
    if (!nombre) return "E"
    // Si tiene espacios, tomar la primera letra de cada palabra
    const palabras = nombre.split(" ")
    if (palabras.length > 1) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase()
    }
    // Si no tiene espacios, tomar las primeras dos letras
    return nombre.substring(0, 2).toUpperCase()
  }

  const manejarErrorLogo = () => {
    console.log("❌ Error al cargar logo, usando avatar por defecto")
    setLogoError(true)
  }

  const obtenerColorAvatar = (nombre) => {
    const colores = [
      "from-red-500 to-red-600",
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
      "from-teal-500 to-teal-600",
    ]

    // Usar la suma de códigos ASCII para generar un color consistente
    const seed = nombre ? nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0
    return colores[seed % colores.length]
  }

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen shadow-xl relative overflow-hidden"
    >
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-50 rounded-full opacity-30 translate-y-12 -translate-x-12"></div>

      <div className="relative z-10 px-6 py-8">
        {/* Header de la empresa */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Logo o Avatar de la empresa */}
            <div className="relative">
              {cargando ? (
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              ) : logoEmpresa && !logoError ? (
                <motion.div
                  key={logoEmpresa} // Key para forzar re-render cuando cambie la URL
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <img
                    src={logoEmpresa || "/placeholder.svg"}
                    alt={`Logo de ${nombrePersonalizado}`}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={manejarErrorLogo}
                    onLoad={() => {
                      console.log("✅ Logo cargado exitosamente")
                      setLogoError(false)
                    }}
                  />
                  {/* Indicador de actualización */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 bg-gradient-to-br ${obtenerColorAvatar(nombrePersonalizado)} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white relative`}
                >
                  {nombrePersonalizado ? obtenerIniciales(nombrePersonalizado) : "E"}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </motion.div>
              )}
            </div>

            {/* Información de la empresa */}
            <div className="text-center w-full">
              {cargando ? (
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  {/* Nombre de la empresa con opción de editar */}
                  <div className="relative group">
                    <AnimatePresence mode="wait">
                      {editandoNombre ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 justify-center"
                        >
                          <input
                            type="text"
                            value={nombreTemporal}
                            onChange={(e) => setNombreTemporal(e.target.value)}
                            onKeyDown={manejarTeclaEnter}
                            className="text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-0 max-w-[140px]"
                            placeholder="Nombre de empresa"
                            autoFocus
                            disabled={guardandoNombre}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={guardarNombre}
                              disabled={guardandoNombre || !nombreTemporal.trim()}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Guardar nombre"
                            >
                              {guardandoNombre ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="w-3 h-3 border border-green-600 border-t-transparent rounded-full"
                                />
                              ) : (
                                <CheckIcon className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              disabled={guardandoNombre}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Cancelar"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="display"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center gap-2 group"
                        >
                          <h2 className="text-lg font-bold text-gray-800 tracking-tight break-words max-w-[140px]">
                            {nombrePersonalizado || "Empresa"}
                          </h2>
                          <button
                            onClick={iniciarEdicion}
                            className="opacity-100 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 flex-shrink-0"
                            title="Editar nombre de empresa"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">Panel Empresarial</p>
                  {/* Mostrar nombre de registro original si es diferente */}
                  {/* Indicador de logo personalizado */}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Navegación */}
        <nav className="flex flex-col gap-2">
          {menu.map((item, index) => {
            const isActive = seccionActiva === item.id
            return (
              <motion.button
                key={item.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                onClick={() => setSeccionActiva(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium relative group ${
                  isActive
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 transform scale-105"
                    : "text-gray-700 hover:bg-gray-100 hover:text-red-600 hover:transform hover:scale-102"
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                >
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {/* Indicador activo */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-2 w-2 h-2 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm"
      >
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-500 font-medium">Red Secoin v2.0</p>
          <p className="text-xs text-gray-400">© 2024 Todos los derechos reservados</p>
        </div>
      </motion.div>
    </motion.aside>
  )
}

export default SidebarEmpresa


