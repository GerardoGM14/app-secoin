import { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, getDoc, doc } from 'firebase/firestore';

function ValidarCertificadoPrueba() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const buscarCertificado = async () => {
    if (!codigo) {
      setError('Debe ingresar un código.');
      setResultado(null);
      return;
    }

    try {
      const docRef = doc(collection(db, 'certificados'), codigo);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();

        // Convertir fecha si viene como Timestamp
        const fechaFormateada = data.fecha?.toDate
          ? data.fecha.toDate().toLocaleDateString('es-PE')
          : data.fecha; // Si ya es string, usarlo tal cual

        setResultado({
          nombreAlumno: data.nombreAlumno,
          nombreCurso: data.nombreCurso,
          fecha: fechaFormateada,
          estado: data.estado,
          urlPDF: data.urlPDF,
        });
        setError('');
      } else {
        setResultado(null);
        setError('Certificado no encontrado.');
      }
    } catch (e) {
      console.error(e);
      setResultado(null);
      setError('Error al buscar certificado.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center text-gray-800">Validar Certificado</h1>

        <input
          type="text"
          placeholder="Ingrese código del certificado"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />

        <button
          onClick={buscarCertificado}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Buscar
        </button>

        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}

        {resultado && (
          <div className="mt-4 text-center">
            <p className="font-semibold">Alumno: {resultado.nombreAlumno}</p>
            <p className="font-semibold">Curso: {resultado.nombreCurso}</p>
            <p className="text-sm text-gray-600">Fecha: {resultado.fecha}</p>
            <p className="text-sm text-gray-600">Estado: {resultado.estado}</p>

            {resultado.urlPDF && (
              <a
                href={resultado.urlPDF}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-500 underline"
              >
                Ver Certificado
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidarCertificadoPrueba;
