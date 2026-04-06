// src/pages/publico/CertificadoPorId.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import CertificadoVista from './CertificadoVista';
import formatearFecha from '../../utils/format';

function CertificadoPorId() {
  const { id } = useParams();
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const obtenerCertificado = async () => {
      try {
        const snap = await getDoc(doc(db, 'certificados', id));
        if (snap.exists()) {
          const data = snap.data();
          setCertificado({
            nombreAlumno: data.nombreAlumno,
            nombreCurso: data.nombreCurso,
            fecha: formatearFecha(data.fecha),
            estado: data.estado,
            codigo: id
          });
        } else {
          setError('Certificado no encontrado.');
        }
      } catch (err) {
        console.error(err);
        setError('Ocurrió un error al consultar el certificado.');
      }
    };

    obtenerCertificado();
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 font-semibold">
        {error}
      </div>
    );
  }

  return certificado ? <CertificadoVista {...certificado} /> : null;
}

export default CertificadoPorId;
