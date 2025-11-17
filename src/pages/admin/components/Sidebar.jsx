import { useEffect, useState } from "react"
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
} from "@heroicons/react/24/solid"
import { motion, AnimatePresence } from "framer-motion"

function Sidebar({ setSeccionActiva, seccionActiva }) {
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
    <aside className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen shadow-lg relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-500 rounded-full -ml-20 -mb-20"></div>
      </div>

      <div className="relative z-10 px-6 py-8">
        {/* Header del sidebar */}
        <div className="mb-10 text-center">
          <div className="relative inline-block">
            {logoURL ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <img
                  src={logoURL || "/placeholder.svg"}
                  alt="Logo"
                  className="h-16 w-16 object-cover mx-auto mb-3 rounded-full border-2 border-white shadow-lg relative z-10 transition-transform duration-300 hover:scale-105"
                />
              </div>
            ) : (
              <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {nombreSistema.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-tight">
              {nombreSistema}
            </h2>
            <div className="mt-1 text-xs text-gray-500 font-medium">Panel de Control</div>
          </div>
        </div>

        {/* Navegación - Contenedor con scroll */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-1 -mr-1">
          <motion.nav className="flex flex-col gap-2" initial="hidden" animate="visible" variants={containerVariants}>
            {menu.map((item, index) => {
              if (item.id === "administracion") {
                return (
                  <motion.div key={index} className="flex flex-col" variants={itemVariants}>
                    <button
                      onClick={() => setSubMenuAdministracion(!subMenuAdministracion)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
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
                              className={`text-sm text-left rounded-lg px-3 py-2 transition-all duration-200 ${
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
                  onClick={() => setSeccionActiva(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
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
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
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
                        className={`text-sm text-left rounded-lg px-3 py-2 transition-all duration-200 ${
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

        {/* Footer del sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
          <div className="text-xs text-center text-gray-500">
            <span className="block opacity-70">© {new Date().getFullYear()} SECOIN</span>
            <span className="block mt-1 opacity-50">v1.2.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
