// src/pages/validacion/ValidarCertificado.jsx
import { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

function ValidarCertificado() {
  const [codigo, setCodigo] = useState('');
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState('');

  const buscarCertificado = async () => {
    if (!codigo.trim()) {
      setError('Debe ingresar un código de certificado.');
      setCertificado(null);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'certificados', codigo.trim()));
      if (snap.exists()) {
        setCertificado(snap.data());
        setError('');
      } else {
        setCertificado(null);
        setError('Certificado no encontrado.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al buscar el certificado.');
      setCertificado(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto p-6 mt-10 bg-white rounded-lg shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 text-center">Validar Certificado</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ingrese el código del certificado"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={buscarCertificado}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {certificado && (
        <div className="mt-6 space-y-2">
          <p><strong>Nombre:</strong> {certificado.nombreAlumno}</p>
          <p><strong>Curso:</strong> {certificado.nombreCurso}</p>
          <p><strong>Fecha de emisión:</strong> {certificado.fecha}</p>
          <p><strong>Estado:</strong> {certificado.estado}</p>
          <a
            href={certificado.urlPDF}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline block mt-4"
          >
            Ver certificado
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default ValidarCertificado;
