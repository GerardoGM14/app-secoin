// src/utils/subirCertificado.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/firebaseConfig';

/**
 * Función para subir un PDF a Firebase Storage
 * @param {Blob} archivoPDF - archivo PDF generado
 * @param {string} pathDestino - ruta donde se guardará en Storage
 * @returns {string} - URL pública de descarga
 */
export async function subirCertificadoPDF(archivoPDF, pathDestino) {
  const storageRef = ref(storage, pathDestino);

  await uploadBytes(storageRef, archivoPDF);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}
