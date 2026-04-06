import { useEffect, useState } from 'react';
import { db, storage } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { mostrarNotificacion } from './components/Notificacion';

function Configuracion() {
  const [nombre, setNombre] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const obtenerConfiguracion = async () => {
    const docRef = doc(db, 'configuracion', 'sistema');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      setNombre(data.nombre || '');
      setLogoPreview(data.logoURL || null);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      let logoURL = logoPreview;

      if (logoFile) {
        const storageRef = ref(storage, `logos/logo.png`);
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'configuracion', 'sistema'), {
        nombre,
        logoURL
      });

      mostrarNotificacion({
        icon: 'success',
        titulo: 'Guardado',
        mensaje: 'Configuración actualizada correctamente.',
        posicion: 'top-end'
      });
    } catch (err) {
      console.error(err);
      mostrarNotificacion({
        icon: 'error',
        titulo: 'Error',
        mensaje: 'No se pudo guardar la configuración.',
        posicion: 'top-end'
      });
    }
  };

  useEffect(() => {
    obtenerConfiguracion();
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 mt-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Nombre del Sistema</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Logo</label>
        {logoPreview && (
          <img src={logoPreview} alt="Logo actual" className="h-20 mb-2 rounded-lg shadow" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
            }
          }}
          className="block"
        />
      </div>

      <button
        onClick={guardarConfiguracion}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Guardar Cambios
      </button>
    </div>
  );
}

export default Configuracion;
