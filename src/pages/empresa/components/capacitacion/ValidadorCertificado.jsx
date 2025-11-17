"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { db } from "../../../../firebase/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

function ValidadorCertificado() {
  const { certificadoId } = useParams()
  const [certificado, setCertificado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  console.log("🔍 ValidadorCertificado - ID:", certificadoId)

  useEffect(() => {
    validarCertificado()
  }, [certificadoId])

  const validarCertificado = async () => {
    setCargando(true)
    setError(null)

    try {
      console.log("🔄 Validando certificado...")

      // Buscar el certificado en Firebase
      const certificadoRef = doc(db, "certificados", certificadoId)
      const certificadoSnap = await getDoc(certificadoRef)

      if (certificadoSnap.exists()) {
        const datos = certificadoSnap.data()
        setCertificado({ id: certificadoSnap.id, ...datos })
        console.log("✅ Certificado válido encontrado:", datos)
      } else {
        setError("Certificado no encontrado")
        console.log("❌ Certificado no encontrado")
      }
    } catch (error) {
      console.error("❌ Error al validar certificado:", error)
      setError("Error al validar el certificado")
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ""
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha)
    return fechaObj.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Validando certificado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Certificado No Válido</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">ID: {certificadoId}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        {/* Header de validación */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Certificado Válido</h1>
          <p className="text-center text-gray-600">Este certificado ha sido verificado exitosamente</p>
        </div>

        {/* Información del certificado */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">Certificado de Capacitación</h2>
            <p className="text-red-100">ID: {certificado.id}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos del participante */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">
                  Datos del Participante
                </h3>

                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="text-lg font-semibold text-gray-900">{certificado.nombreUsuario}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">DNI</label>
                  <p className="text-lg font-semibold text-gray-900">{certificado.dniUsuario}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Cargo</label>
                  <p className="text-lg font-semibold text-gray-900">{certificado.cargoUsuario}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <p className="text-lg font-semibold text-gray-900">{certificado.empresaUsuario}</p>
                </div>
              </div>

              {/* Datos del curso */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Datos del Curso</h3>

                <div>
                  <label className="text-sm font-medium text-gray-500">Capacitación</label>
                  <p className="text-lg font-semibold text-gray-900">{certificado.cursoTitulo}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Nota Obtenida</label>
                  <p className="text-lg font-semibold text-green-600">{certificado.notaObtenida}/20</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Evaluación</label>
                  <p className="text-lg font-semibold text-gray-900">{formatearFecha(certificado.fechaEvaluacion)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
                  <p className="text-lg font-semibold text-gray-900">{formatearFecha(certificado.fechaEmision)}</p>
                </div>
              </div>
            </div>

            {/* Estado del certificado */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Estado: Activo</span>
                </div>
                <div className="text-sm text-gray-500">Tipo: {certificado.tipo || "Capacitación"}</div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">Certificado Verificado</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Este certificado ha sido emitido por el sistema oficial de capacitaciones y es completamente válido.
                    La información mostrada corresponde a los datos registrados en el momento de la evaluación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ValidadorCertificado
