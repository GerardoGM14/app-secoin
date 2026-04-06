"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import Particles from "react-particles"
import { loadSlim } from "tsparticles-slim"
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid"

function ValidarCertificado() {
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState("")
  const [buscando, setBuscando] = useState(false)
  const navigate = useNavigate()

  // Configuración de partículas tipo neuronas
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  const particlesConfig = {
    background: {
      color: {
        value: "transparent",
      },
    },
    particles: {
      number: {
        value: 80,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: "#dc2626",
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.5,
        random: false,
        animation: {
          enable: false,
        },
      },
      size: {
        value: 1.5,
        random: false,
        animation: {
          enable: false,
        },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#dc2626",
        opacity: 0.4,
        width: 1,
        triangles: {
          enable: false,
        },
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce",
        },
        bounce: false,
      },
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: false,
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 150,
          links: {
            opacity: 0.8,
            blink: false,
          },
        },
      },
    },
    retina_detect: true,
  }

  const buscarCertificado = async (e) => {
    e?.preventDefault()
    
    if (!codigo.trim()) {
      setError("Por favor, ingrese un código de certificado")
      return
    }

    setBuscando(true)
    setError("")

    // Redirigir a la vista del certificado
    navigate(`/certificado/${codigo.trim()}`)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #fef2f2, #fce7f3)' }}>
      {/* Fondo con partículas tipo neuronas */}
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <Particles
          id="tsparticles-busqueda"
          init={particlesInit}
          options={particlesConfig}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <motion.div
        className="relative z-10 bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "hsl(0, 72%, 51%)" }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m7.5-4.5A9 9 0 1118 12a9 9 0 01-18 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validar Certificado</h1>
          <p className="text-gray-600">Ingrese el código del certificado para verificar su validez</p>
        </div>

        {/* Formulario de búsqueda */}
        <form onSubmit={buscarCertificado} className="space-y-6">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
              Código del Certificado
            </label>
            <div className="relative">
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value)
                  setError("")
                }}
                placeholder="Ej: CERT-12345678-1234567890"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                disabled={buscando}
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={buscando}
            className="w-full py-3 px-6 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(0, 72%, 51%)" }}
            onMouseEnter={(e) => !buscando && (e.target.style.backgroundColor = "hsl(0, 74%, 42%)")}
            onMouseLeave={(e) => !buscando && (e.target.style.backgroundColor = "hsl(0, 72%, 51%)")}
          >
            {buscando ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5" />
                Buscar Certificado
              </>
            )}
          </button>
        </form>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">¿Cómo obtener el código?</h4>
                <p className="text-sm text-blue-700">
                  El código del certificado se encuentra en el documento PDF descargado o en el código QR del certificado.
                  También puede encontrarlo en la URL de validación del certificado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ValidarCertificado

