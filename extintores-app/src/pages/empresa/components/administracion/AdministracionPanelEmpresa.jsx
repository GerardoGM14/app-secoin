"use client"

import { useState } from "react"
import { motion } from "framer-motion"

// Importación de subpaneles
import CotizacionesPanelEmpresa from "./CotizacionesPanelEmpresa"
import OrdenesCompraPanelEmpresa from "./OrdenesCompraPanelEmpresa"
import GuiasRemisionPanelEmpresa from "./GuiasRemisionPanelEmpresa"
import ActasConformidadPanelEmpresa from "./ActasConformidadPanelEmpresa"
import InformesDetalladosPanelEmpresa from "./InformesDetalladosPanelEmpresa"
import GuiasPrestamoPanelEmpresa from "./GuiasPrestamoPanelEmpresa"
import FacturasPanelEmpresa from "./FacturasPanelEmpresa"
import CertificadoPanelEmpresa from "./CertificadoPanelEmpresa"

function AdministracionPanelEmpresa() {
  const [subseccion, setSubseccion] = useState("cotizaciones")

  const secciones = [
    {
      id: "cotizaciones",
      nombre: "Cotizaciones",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "ordenes",
      nombre: "Órdenes de Compra",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      id: "guias",
      nombre: "Guías de Remisión",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
          />
        </svg>
      ),
    },
    {
      id: "actas",
      nombre: "Actas de Conformidad",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "facturas",
      nombre: "Facturas",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
          />
        </svg>
      ),
    },
    {
      id: "informes",
      nombre: "Informes Detallados",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "prestamo",
      nombre: "Guías en Préstamo",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      id: "certificado",
      nombre: "Certificados",
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
  ]

  const renderizarComponente = () => {
    switch (subseccion) {
      case "cotizaciones":
        return <CotizacionesPanelEmpresa />
      case "ordenes":
        return <OrdenesCompraPanelEmpresa />
      case "guias":
        return <GuiasRemisionPanelEmpresa />
      case "actas":
        return <ActasConformidadPanelEmpresa />
      case "facturas":
        return <FacturasPanelEmpresa />
      case "informes":
        return <InformesDetalladosPanelEmpresa />
      case "prestamo":
        return <GuiasPrestamoPanelEmpresa />
      case "certificado":
        return <CertificadoPanelEmpresa />
      default:
        return <CotizacionesPanelEmpresa />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Navegación de módulos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secciones.map((seccion, index) => (
            <motion.button
              key={seccion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSubseccion(seccion.id)}
              className={`group relative flex items-center gap-3 p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                subseccion === seccion.id
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md"
              }`}
            >
              <div
                className={`flex-shrink-0 transition-colors duration-300 ${
                  subseccion === seccion.id ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {seccion.icono}
              </div>
              <span className="text-sm font-medium truncate">{seccion.nombre}</span>

              {/* Indicador activo */}
              {subseccion === seccion.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Contenido dinámico */}
      <motion.div
        key={subseccion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="min-h-[400px]"
      >
        {renderizarComponente()}
      </motion.div>
    </motion.div>
  )
}

export default AdministracionPanelEmpresa
