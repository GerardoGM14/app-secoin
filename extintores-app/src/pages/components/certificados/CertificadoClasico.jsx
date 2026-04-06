const CertificadoClasico = ({ datos }) => {
  return (
    <div className="w-[842px] h-[595px] bg-white relative overflow-hidden shadow-2xl border border-gray-200">
      {/* Fondo con patrón sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-white"></div>

      {/* Bordes ornamentales principales */}
      <div className="absolute inset-6 border-4 border-red-600 rounded-lg">
        <div className="absolute inset-3 border-2 border-red-300 rounded-lg">
          <div className="absolute inset-3 border border-red-200 rounded-lg"></div>
        </div>
      </div>

      {/* Esquinas decorativas más pequeñas */}
      <div className="absolute top-10 left-10 w-12 h-12 border-l-4 border-t-4 border-red-600 rounded-tl-lg"></div>
      <div className="absolute top-10 right-10 w-12 h-12 border-r-4 border-t-4 border-red-600 rounded-tr-lg"></div>
      <div className="absolute bottom-10 left-10 w-12 h-12 border-l-4 border-b-4 border-red-600 rounded-bl-lg"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 border-r-4 border-b-4 border-red-600 rounded-br-lg"></div>

      {/* Contenido principal - MEJOR DISTRIBUIDO */}
      <div className="relative z-10 h-full flex flex-col p-20">
        {/* Header compacto */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-700 mb-2" style={{ fontFamily: "serif" }}>
            CERTIFICADO
          </h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-3"></div>
          <p className="text-lg text-gray-700 italic" style={{ fontFamily: "serif" }}>
            de Finalización de Curso
          </p>
        </div>

        {/* Contenido central - MÁS COMPACTO */}
        <div className="flex-1 flex flex-col justify-center text-center space-y-6">
          <p className="text-lg text-gray-800">Por medio del presente se certifica que</p>

          {/* Nombre destacado */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mx-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "serif" }}>
              {datos.nombreCompleto}
            </h2>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
              <span>
                <strong>DNI:</strong> {datos.dni}
              </span>
              <span>
                <strong>Cargo:</strong> {datos.cargo}
              </span>
            </div>
          </div>

          <p className="text-lg text-gray-800">
            de la empresa <span className="font-semibold text-red-700">{datos.empresa}</span>
          </p>

          <p className="text-lg text-gray-800">ha completado satisfactoriamente el curso de</p>

          <div className="mx-8">
            <h3 className="text-2xl font-bold text-red-700 mb-4" style={{ fontFamily: "serif" }}>
              "{datos.tituloCurso}"
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto"></div>
          </div>

          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-red-600">{datos.nota}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Calificación</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-green-600">✓</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Aprobado</p>
            </div>
          </div>
        </div>

        {/* Footer compacto */}
        <div className="flex justify-between items-end mt-8">
          <div className="text-left">
            <div className="w-40 border-t-2 border-gray-400 pt-2">
              <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "serif" }}>
                Director Académico
              </p>
              <p className="text-xs text-gray-600">Firma Autorizada</p>
            </div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 border-2 border-red-200 rounded-lg flex items-center justify-center mb-2">
              <span className="text-xs text-gray-600">QR</span>
            </div>
            <p className="text-xs text-gray-500">Validar certificado</p>
            <p className="text-xs text-gray-400 font-mono">{datos.idCertificado}</p>
          </div>

          <div className="text-right">
            <div className="w-40 border-t-2 border-gray-400 pt-2">
              <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "serif" }}>
                {datos.fechaEvaluacion}
              </p>
              <p className="text-xs text-gray-600">Fecha de emisión</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sello decorativo más pequeño */}
      <div className="absolute top-16 right-16 w-16 h-16 rounded-full border-3 border-red-600 flex items-center justify-center bg-red-50">
        <div className="text-center">
          <p className="text-xs font-bold text-red-700 leading-tight">APROBADO</p>
          <p className="text-xs text-red-600 leading-tight">{new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

export default CertificadoClasico

