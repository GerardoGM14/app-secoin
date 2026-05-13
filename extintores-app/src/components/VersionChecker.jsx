"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

export default function VersionChecker() {
  const [showModal, setShowModal] = useState(false)
  const initialVersionRef = useRef(null)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        // Evitar caché de navegador y CDN con parámetro único
        const res = await fetch(`/version.json?t=${Date.now()}`)
        if (!res.ok) return null
        const data = await res.json()
        return data.version
      } catch (error) {
        return null
      }
    }

    const checkVersion = async () => {
      const currentServerVersion = await fetchVersion()
      if (!currentServerVersion) return

      // Si es la primera vez que consultamos, registramos la versión base con la que inició el usuario
      if (!initialVersionRef.current) {
        initialVersionRef.current = currentServerVersion
      } else if (initialVersionRef.current !== currentServerVersion) {
        // Si la versión del servidor cambió respecto a la que cargó inicialmente, forzamos actualización
        setShowModal(true)
      }
    }

    // Ejecutar inmediatamente al montar
    checkVersion()

    // Consultar cada 10 segundos
    const intervalId = setInterval(checkVersion, 10000)

    return () => clearInterval(intervalId)
  }, [])

  const handleUpdate = () => {
    // Limpiar cachés de Service Workers / PWA si existen
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    // Forzar recarga limpia
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 2147483647 }} // El z-index máximo posible en navegadores para estar encima de todo
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ArrowPathIcon className="w-8 h-8 text-red-600 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Actualización Disponible!
            </h2>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Hemos lanzado una nueva versión del sistema con mejoras y correcciones. Para continuar navegando de forma segura y evitar inconsistencias, es necesario actualizar la página.
            </p>
            
            <button
              onClick={handleUpdate}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5 stroke-[2.5]" />
              Actualizar Sistema Ahora
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
