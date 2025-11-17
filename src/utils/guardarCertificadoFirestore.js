// src/utils/guardarCertificadoFirestore.js
import { db } from '../../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Guarda los datos de un certificado en Firestore.
 * @param {object} certificado - Datos del certificado
 */
export async function guardarCertificadoEnFirestore(certificado) {
  try {
    await setDoc(doc(db, 'certificados', certificado.codigoUnico), {
      nombreAlumno: certificado.nombreAlumno,
      nombreCurso: certificado.nombreCurso,
      fecha: certificado.fecha,
      urlPDF: certificado.urlPDF,
      estado: 'Activo', // Estado inicial del certificado
      fechaRegistro: new Date()
    });

    console.log('Certificado guardado en Firestore correctamente.');
  } catch (error) {
    console.error('Error guardando certificado:', error);
    throw error;
  }
}
