import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebase/firebaseConfig"
import {
  HomeIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChatBubbleLeftEllipsisIcon,
  CogIcon,
  FolderIcon,
  ChevronDownIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

function Sidebar({ setSeccionActiva, seccionActiva }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [nombreSistema, setNombreSistema] = useState("Admin")
  const [logoURL, setLogoURL] = useState(null)
  const [subMenuHerramientas, setSubMenuHerramientas] = useState(false)
  const [subMenuAdministracion, setSubMenuAdministracion] = useState(false)

  useEffect(() => {
    const obtener = async () => {
      const snap = await getDoc(doc(db, "configuracion", "sistema"))
      if (snap.exists()) {
        const data = snap.data()
        setNombreSistema(data.nombre || "Admin")
        setLogoURL(data.logoURL || null)
      }
    }
    obtener()
  }, [])

  const menu = [
    { id: "inicio", label: "Inicio", icon: <HomeIcon className="h-5 w-5" /> },
    { id: "inspeccion", label: "Inspección", icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
    { id: "informes", label: "Informes", icon: <DocumentChartBarIcon className="h-5 w-5" /> },
    { id: "capacitacion", label: "Capacitación", icon: <AcademicCapIcon className="h-5 w-5" /> },
    { id: "mensajes", label: "Mensajes", icon: <ChatBubbleLeftEllipsisIcon className="h-5 w-5" /> },
    { id: "monitoreo", label: "Monitoreo", icon: <MapPinIcon className="h-5 w-5" /> },
    { id: "administracion", label: "Documentos", icon: <FolderIcon className="h-5 w-5" /> },
  ]

  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  const subMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
      },
    },
  }

  const subItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <aside className="w-72 flex-shrink-0 h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col z-30 transition-all duration-300">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-500 rounded-full -ml-20 -mb-20"></div>
      </div>

      <div className="relative z-10 px-6 pt-8 pb-2">
        {/* Header del sidebar */}
        <div className="mb-4 text-center">
          <div className="relative inline-block">
            {logoURL ? (
              <div className="mb-4 flex justify-center">
                <div className="bg-white p-3 rounded-2xl border border-gray-200 inline-block w-full max-w-[200px] flex justify-center">
                  <img
                    src={logoURL}
                    alt="Logo del Sistema"
                    className="max-h-24 w-auto max-w-full object-contain mix-blend-multiply"
                  />
                </div>
              </div>
            ) : (
              <div className="h-14 w-14 mx-auto mb-4 rounded-xl bg-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                {nombreSistema.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-tight">
              {nombreSistema}
            </h2>
            <div className="mt-1 text-xs text-gray-500 font-medium">Panel de Control</div>
          </div>
        </div>
      </div>

      {/* Área del cuerpo con scroll oculto */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative z-10">
        {/* Navegación */}
        <div className="flex-1 px-4 pr-1">
          <motion.nav className="flex flex-col gap-1 pb-10" initial="hidden" animate="visible" variants={containerVariants}>
            {menu.map((item, index) => {
              if (item.id === "administracion") {
                return (
                  <motion.div key={index} className="flex flex-col" variants={itemVariants}>
                    <button
                      onClick={() => setSubMenuAdministracion(!subMenuAdministracion)}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                        seccionActiva?.includes("administracion")
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20"
                          : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7">{item.icon}</span>
                        {item.label}
                      </span>
                      <motion.span animate={{ rotate: subMenuAdministracion ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDownIcon className="h-4 w-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {subMenuAdministracion && (
                        <motion.div
                          variants={subMenuVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="ml-10 mt-1 flex flex-col gap-1 overflow-hidden"
                        >
                          {[
                            { id: "administracion-cotizaciones", label: "Cotizaciones" },
                            { id: "administracion-ordenes", label: "Orden de Compra" },
                            { id: "administracion-guias", label: "Guías de Remisión" },
                            { id: "administracion-actas", label: "Actas de Conformidad" },
                            { id: "administracion-facturas", label: "Facturas" }, //
                            { id: "administracion-informes", label: "Informes Detallados" },
                            { id: "administracion-prestamo", label: "Guías de Extintores en Préstamo" },
                            { id: "administracion-certificado", label: "Certificado de Operatividad" }, //
                          ].map((subItem, subIndex) => (
                            <motion.button
                              key={subIndex}
                              variants={subItemVariants}
                              onClick={() => setSeccionActiva(subItem.id)}
                              className={`text-sm text-left rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer ${
                                seccionActiva === subItem.id
                                  ? "bg-red-100 text-red-700 font-medium"
                                  : "text-gray-600 hover:bg-red-50/50 hover:text-red-600"
                              }`}
                              whileHover={{ x: 4 }}
                            >
                              {subItem.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              }

              const isActive = seccionActiva === item.id
              return (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  onClick={() => {
                    if (item.route) {
                      navigate(item.route)
                    } else {
                      setSeccionActiva(item.id)
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium cursor-pointer ${
                    isActive || (item.route && location.pathname === item.route)
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20"
                      : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                  whileHover={!isActive ? { x: 4 } : {}}
                >
                  <span className="flex items-center justify-center w-7 h-7">{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              )
            })}

            {/* Herramientas con submenú */}
            <motion.div className="flex flex-col mt-1" variants={itemVariants}>
              <button
                onClick={() => setSubMenuHerramientas(!subMenuHerramientas)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                  seccionActiva?.includes("herramientas")
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20"
                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7">
                    <CogIcon className="h-5 w-5" />
                  </span>
                  Herramientas
                </span>
                <motion.span animate={{ rotate: subMenuHerramientas ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDownIcon className="h-4 w-4" />
                </motion.span>
              </button>

              <AnimatePresence>
                {subMenuHerramientas && (
                  <motion.div
                    variants={subMenuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="ml-10 mt-1 flex flex-col gap-1 overflow-hidden"
                  >
                    {[
                      { id: "herramientas-sistema", label: "Sistema" },
                      { id: "herramientas-editar-empresa", label: "Editar Empresa" },
                    ].map((subItem, subIndex) => (
                      <motion.button
                        key={subIndex}
                        variants={subItemVariants}
                        onClick={() => setSeccionActiva(subItem.id)}
                        className={`text-sm text-left rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer ${
                          seccionActiva === subItem.id
                            ? "bg-red-100 text-red-700 font-medium"
                            : "text-gray-600 hover:bg-red-50/50 hover:text-red-600"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        {subItem.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.nav>
        </div>

        {/* Footer del sidebar con Cerrar Sesión integrado (ahora dentro del scroll) */}
        <div className="p-4 mt-auto border-t border-gray-100 flex flex-col gap-3 bg-white">
          <button
            onClick={() => {
              localStorage.removeItem("usuario")
              localStorage.removeItem("empresaSeleccionadaAdmin")
              window.location.href = "/"
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-bold text-xs cursor-pointer group border border-transparent hover:border-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
          
          <div className="text-[10px] text-center text-gray-400 font-medium">
            <span className="opacity-70">© {new Date().getFullYear()} SECOIN • v1.5.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
