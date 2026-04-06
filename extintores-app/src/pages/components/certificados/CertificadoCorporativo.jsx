"use client"

import { useEffect, useState } from "react"

const CertificadoCorporativo = ({ datos }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  // Generar QR automáticamente basado en el ID del certificado
  useEffect(() => {
    const generarQR = async () => {
      try {
        // URL de validación del certificado
        const urlValidacion = `https://secoin.vercel.app/validar-certificado/${datos.idCertificado}`

        // Usar API de QR Server para generar el código QR
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlValidacion)}&bgcolor=ffffff&color=000000&format=png&margin=10`

        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error("Error al generar QR:", error)
        setQrCodeUrl("")
      }
    }

    if (datos.idCertificado) {
      generarQR()
    }
  }, [datos.idCertificado])

  return (
    <div className="w-[842px] h-[595px] bg-white relative overflow-hidden shadow-2xl border border-gray-200">
      {/* Fondo corporativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>

      {/* Panel principal blanco */}
      <div className="absolute inset-4 bg-white rounded-lg shadow-inner flex flex-col">
        {/* Header corporativo */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-lg flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold mb-1">CERTIFICADO PROFESIONAL</h1>
              <p className="text-red-100 text-xs uppercase tracking-wider">Programa de Capacitación Empresarial</p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <p className="text-xs text-red-100 mb-1">Año</p>
                <p className="text-lg font-bold">{new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal con altura fija */}
        <div className="flex-1 p-4 min-h-0">
          <div className="grid grid-cols-4 gap-4 h-full">
            {/* Columna principal - Información del certificado (3 columnas) */}
            <div className="col-span-3 flex flex-col justify-between min-h-0">
              {/* Información del participante */}
              <div className="space-y-4 flex-shrink-0">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Se certifica que</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{datos.nombreCompleto}</h2>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">DNI:</span>
                      <span className="ml-1 font-semibold text-gray-900">{datos.dni}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cargo:</span>
                      <span className="ml-1 font-semibold text-gray-900">{datos.cargo}</span>
                    </div>
                  </div>
                </div>

                {/* Información del curso */}
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-600">
                  <p className="text-xs text-gray-600 mb-1">ha completado satisfactoriamente el programa</p>
                  <h3 className="text-lg font-bold text-red-700 mb-1">{datos.tituloCurso}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    impartido por <span className="font-semibold text-gray-900">{datos.empresa}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Calificación: {datos.nota}/20
                    </div>
                    <div className="text-xs text-gray-600">Fecha: {datos.fechaEvaluacion}</div>
                  </div>
                </div>

                {/* Competencias */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Competencias Certificadas:</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">Conocimientos teóricos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">Aplicación práctica</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">Evaluación aprobada</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">Certificación válida</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con firmas - FORZAR VISIBILIDAD */}
              <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-auto flex-shrink-0">
                <div className="text-center">
                  <div className="w-20 h-px bg-gray-400 mb-1 mx-auto"></div>
                  <p className="text-xs font-semibold text-gray-700">Director de Capacitación</p>
                  <p className="text-xs text-gray-500">Firma Autorizada</p>
                </div>
                <div className="text-center">
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">CERTIFICADO VÁLIDO</div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-px bg-gray-400 mb-1 mx-auto"></div>
                  <p className="text-xs font-semibold text-gray-700">Gerente General</p>
                  <p className="text-xs text-gray-500">Firma Autorizada</p>
                </div>
              </div>
            </div>

            {/* Columna lateral - QR y detalles (1 columna) */}
            <div className="col-span-1 flex flex-col justify-between min-h-0">
              {/* QR Code */}
              <div className="text-center flex-shrink-0">
                <div className="w-16 h-16 bg-gray-100 border-2 border-red-200 rounded-lg mx-auto mb-1 flex items-center justify-center overflow-hidden">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="QR Code para validar certificado"
                      className="w-full h-full object-cover"
                      onError={() => setQrCodeUrl("")}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <span className="text-xs text-gray-500">QR</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1">Validar certificado</p>
                <p className="text-xs text-gray-500 font-mono break-all leading-tight">{datos.idCertificado}</p>
              </div>

              {/* Estadísticas */}
              <div className="space-y-2 flex-shrink-0">
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-600">{datos.nota}</p>
                  <p className="text-xs text-gray-600">Puntuación</p>
                </div>

                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-green-600">APROBADO</p>
                  <p className="text-xs text-gray-600">Estado</p>
                </div>
              </div>

              {/* Sello de validez - FORZAR VISIBILIDAD */}
              <div className="text-center flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-red-600 mx-auto mb-1 flex items-center justify-center bg-red-50">
                  <div className="text-center">
                    <p className="text-xs font-bold text-red-700 leading-none">VÁLIDO</p>
                    <p className="text-xs text-red-600 leading-none">{new Date().getFullYear()}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Sello oficial</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute top-2 left-2 w-4 h-4 bg-white bg-opacity-20 rounded-full"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-white bg-opacity-20 rounded-full"></div>
    </div>
  )
}

export default CertificadoCorporativo
