// src/pages/publico/CertificadoVista.jsx
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import formatearFecha from '../../utils/format'; // 👈 Asegúrate de que este path esté bien

function CertificadoVista({ nombreAlumno, nombreCurso, fecha, codigo, estado }) {
  const fechaFormateada = fecha?.toDate
    ? format(fecha.toDate(), "d 'de' MMMM 'del' yyyy", { locale: es })
    : fecha;// ✅ formato seguro

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white border-4 border-blue-600 rounded-xl shadow-lg p-10 w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-2 uppercase tracking-wider">
          Certificado de Finalización
        </h1>

        <p className="text-gray-600 text-lg mb-2">Otorgado a</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{nombreAlumno}</h2>

        <p className="text-gray-600 text-lg mb-2">Por completar satisfactoriamente el curso</p>
        <h3 className="text-xl font-semibold text-blue-600 mb-4">{nombreCurso}</h3>

        <p className="text-md text-gray-500 mb-2">
          Fecha de emisión: {fechaFormateada || 'Fecha no disponible'}
        </p>
        <p className="text-sm text-gray-500 mb-2">Código de verificación: <span className="font-mono">{codigo}</span></p>
        <p className={`text-lg font-semibold mt-2 ${estado === 'Activo' ? 'text-green-600' : 'text-red-600'}`}>
          Estado: {estado}
        </p>

        <hr className="my-6 border-gray-300" />
        <p className="text-xs text-gray-400">Este documento ha sido generado por el sistema SECOIN - Gerardo ©</p>
      </div>
    </div>
  );
}

export default CertificadoVista;

