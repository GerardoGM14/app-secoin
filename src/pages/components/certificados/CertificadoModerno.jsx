const CertificadoModerno = ({ datos }) => {
  return (
    <div className="w-[842px] h-[595px] bg-white relative overflow-hidden shadow-2xl border border-gray-100">
      {/* Fondo geométrico sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>

      {/* Elementos geométricos decorativos más pequeños */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-600 opacity-5 rounded-full -translate-y-24 translate-x-24"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500 opacity-5 rounded-full translate-y-16 -translate-x-16"></div>

      {/* Barra lateral roja */}
      <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-red-600 to-red-500"></div>

      {/* Contenido principal - MEJOR DISTRIBUIDO */}
      <div className="relative z-10 h-full flex flex-col p-12">
        {/* Header minimalista más compacto */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-3xl font-light text-gray-900">CERTIFICADO</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wider">de finalización</p>
            </div>
          </div>
        </div>

        {/* Contenido central - LAYOUT MEJORADO */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          {/* Columna izquierda - Información principal */}
          <div className="col-span-2 flex flex-col justify-center space-y-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Certificamos que</p>
              <h2 className="text-4xl font-light text-gray-900 mb-4">{datos.nombreCompleto}</h2>
              <div className="w-20 h-1 bg-red-600 mb-6"></div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">DNI</p>
                <p className="text-lg font-medium text-gray-900">{datos.dni}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cargo</p>
                <p className="text-lg font-medium text-gray-900">{datos.cargo}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Empresa</p>
              <p className="text-lg font-medium text-red-700">{datos.empresa}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-3">ha completado exitosamente el programa</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xl font-medium text-gray-900 leading-tight">{datos.tituloCurso}</h3>
              </div>
            </div>
          </div>

          {/* Columna derecha - Métricas y QR */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Nota */}
            <div className="bg-red-50 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Calificación</p>
              <div className="text-4xl font-light text-red-600 mb-2">{datos.nota}</div>
              <p className="text-xs text-gray-500">sobre 20 puntos</p>
            </div>

            {/* Estado */}
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Estado</p>
              <div className="text-2xl font-medium text-green-600 mb-2">APROBADO</div>
              <p className="text-xs text-gray-500">Certificación válida</p>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-xs text-gray-500">QR</span>
              </div>
              <p className="text-xs text-gray-500">Validar certificado</p>
            </div>
          </div>
        </div>

        {/* Footer compacto */}
        <div className="flex justify-between items-end pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha de emisión</p>
            <p className="text-sm font-medium text-gray-900">{datos.fechaEvaluacion}</p>
          </div>

          <div className="text-center">
            <div className="w-24 h-px bg-gray-400 mb-2"></div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Firma autorizada</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ID del certificado</p>
            <p className="text-sm font-mono text-gray-700">{datos.idCertificado}</p>
          </div>
        </div>
      </div>

      {/* Badge de estado más pequeño */}
      <div className="absolute top-6 right-6 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
        Certificado
      </div>
    </div>
  )
}

export default CertificadoModerno

