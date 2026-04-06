import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

function GenerarCertificadoPrueba() {
  const generar = async () => {
    const nuevoID = uuidv4().slice(0, 20); // Máximo 20 caracteres para evitar URLs feas

    const data = {
      nombreAlumno: 'Gerardo Gonzalez',
      nombreCurso: 'Capacitación en Seguridad',
      fecha: Timestamp.now(),
      estado: 'Activo',
      urlPDF: '', // por ahora vacío, luego lo completamos con Firebase Storage
    };

    try {
      await setDoc(doc(db, 'certificados', nuevoID), data);
      alert(`Certificado creado con ID:\n${nuevoID}`);
    } catch (e) {
      console.error('Error al crear certificado:', e);
    }
  };

  return (
    <div className="p-6">
      <button onClick={generar} className="bg-green-600 text-white px-4 py-2 rounded">
        Generar Certificado de Prueba
      </button>
    </div>
  );
}

export default GenerarCertificadoPrueba;
