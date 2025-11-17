import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BellIcon, UserCircleIcon } from "@heroicons/react/24/outline"
import { ShieldCheckIcon } from "@heroicons/react/24/solid"

function Topbar() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showTooltip, setShowTooltip] = useState(false)

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Formatear la fecha y hora
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentTime)

  const formattedTime = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <header className="w-full h-16 flex items-center justify-between px-6 bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg relative z-10">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        <div className="absolute -top-32 -right-16 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -left-16 w-48 h-48 bg-red-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Contenido del Topbar */}
      <div className="flex items-center gap-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Panel de Administración</h1>
            <p className="text-xs text-gray-400">Gestión de empresas y servicios</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        {/* Fecha y hora */}
        <div className="hidden md:block text-right mr-2">
          <p className="text-gray-400 text-xs">{formattedDate}</p>
          <p className="text-gray-300 text-sm font-medium">{formattedTime}</p>
        </div>

        {/* Licencia */}
        <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
          <ShieldCheckIcon className="h-4 w-4 text-green-400" />
          <span className="text-xs text-gray-300">Licencia Activa</span>
        </div>

        {/* Notificaciones */}
        <button className="relative p-1.5 rounded-full hover:bg-gray-700/50 transition-colors">
          <BellIcon className="h-5 w-5 text-gray-300" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Usuario */}
        <button className="p-1 rounded-full hover:bg-gray-700/50 transition-colors">
          <UserCircleIcon className="h-6 w-6 text-gray-300" />
        </button>

        {/* Copyright */}
        <div className="relative">
          <p
            className="text-gray-400 text-xs cursor-pointer hover:text-red-400 transition-colors flex items-center gap-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span>©</span> Copyright
          </p>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 bg-gray-800 text-xs text-gray-200 p-2 rounded-md shadow-lg z-50 w-48 border border-gray-700"
            >
              <p className="font-medium mb-1">Desarrollado por:</p>
              <p>Gerardo Fabian Gonzalez Moreno</p>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar