"use client"

import { useState } from "react"
import CertificadoClasico from "./CertificadoClasico"
import CertificadoModerno from "./CertificadoModerno"
import CertificadoCorporativo from "./CertificadoCorporativo"

const CertificadosDemo = () => {
  const [disenoSeleccionado, setDisenoSeleccionado] = useState("clasico")

  // Datos de ejemplo para mostrar en los certificados
  const datosEjemplo = {
    nombreCompleto: "Juan Carlos Pérez García",
    dni: "12345678",
    cargo: "Operador de Maquinaria",
    empresa: "Constructora Los Andes S.A.C.",
    tituloCurso: "Seguridad en Trabajo en Alturas",
    nota: 18,
    fechaEvaluacion: "15 de Diciembre de 2024",
    idCertificado: "CERT-2024-001234",
    codigoQR: "https://ejemplo.com/validar/CERT-2024-001234",
  }

  const renderCertificado = () => {
    switch (disenoSeleccionado) {
      case "clasico":
        return <CertificadoClasico datos={datosEjemplo} />
      case "moderno":
        return <CertificadoModerno datos={datosEjemplo} />
      case "corporativo":
        return <CertificadoCorporativo datos={datosEjemplo} />
      default:
        return <CertificadoClasico datos={datosEjemplo} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Diseños de Certificados</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecciona el diseño que más te guste para los certificados de tu sistema. Cada diseño mantiene los colores
            profesionales rojos de tu marca.
          </p>
        </div>

        {/* Selector de diseños */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
            <button
              onClick={() => setDisenoSeleccionado("clasico")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                disenoSeleccionado === "clasico" ? "bg-red-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Clásico Elegante
            </button>
            <button
              onClick={() => setDisenoSeleccionado("moderno")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                disenoSeleccionado === "moderno" ? "bg-red-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Moderno Minimalista
            </button>
            <button
              onClick={() => setDisenoSeleccionado("corporativo")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                disenoSeleccionado === "corporativo"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Corporativo Premium
            </button>
          </div>
        </div>

        {/* Descripción del diseño actual */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            {disenoSeleccionado === "clasico" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Clásico Elegante</h3>
                <p className="text-gray-600">
                  Diseño tradicional con bordes ornamentales, tipografía serif profesional y elementos decorativos
                  clásicos. Ideal para certificaciones formales y ceremoniales.
                </p>
              </div>
            )}
            {disenoSeleccionado === "moderno" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Moderno Minimalista</h3>
                <p className="text-gray-600">
                  Diseño limpio y contemporáneo con uso inteligente de espacios en blanco y elementos geométricos
                  simples. Perfecto para empresas con imagen moderna y tecnológica.
                </p>
              </div>
            )}
            {disenoSeleccionado === "corporativo" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Corporativo Premium</h3>
                <p className="text-gray-600">
                  Diseño profesional empresarial con elementos gráficos dinámicos y layout estructurado. Ideal para
                  grandes corporaciones y certificaciones de alto nivel.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa del certificado - AJUSTADO PARA MEJOR PROPORCIÓN */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-6xl w-full">
            <div className="overflow-hidden rounded-lg">
              <div className="transform scale-90 origin-center">{renderCertificado()}</div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => window.print()}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Vista Previa de Impresión
          </button>
          <button
            onClick={() => alert(`Diseño "${disenoSeleccionado}" seleccionado. ¡Listo para integrar!`)}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Seleccionar Este Diseño
          </button>
        </div>

        {/* Información técnica */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Características:</h4>
              <ul className="space-y-1">
                <li>• Formato A4 horizontal (842x595px)</li>
                <li>• Colores profesionales rojos</li>
                <li>• Datos dinámicos integrados</li>
                <li>• Código QR para validación</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Datos incluidos:</h4>
              <ul className="space-y-1">
                <li>• Nombre completo del usuario</li>
                <li>• DNI y cargo</li>
                <li>• Empresa</li>
                <li>• Título del curso</li>
                <li>• Nota obtenida</li>
                <li>• Fecha de evaluación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificadosDemo
