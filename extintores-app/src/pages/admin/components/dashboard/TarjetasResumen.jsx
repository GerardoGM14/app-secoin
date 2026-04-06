// src/pages/admin/components/dashboard/TarjetasResumen.jsx
import { useEffect, useState } from 'react';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { BuildingStorefrontIcon, ClipboardDocumentCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

function TarjetasResumen() {
  const [cantidadEmpresas, setCantidadEmpresas] = useState(0);
  const [cantidadInspecciones, setCantidadInspecciones] = useState(0);
  const [cantidadInformes, setCantidadInformes] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      const empresasSnap = await getDocs(collection(db, 'usuarios'));
      const empresas = empresasSnap.docs.filter(doc => doc.data().rol === 'empresa');
      setCantidadEmpresas(empresas.length);

      const inspeccionesSnap = await getDocs(collection(db, 'inspecciones'));
      setCantidadInspecciones(inspeccionesSnap.size);

      const informesSnap = await getDocs(collection(db, 'informes'));
      setCantidadInformes(informesSnap.size);
    };

    cargarDatos();
  }, []);

  const tarjetas = [
    {
      icono: <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />,
      titulo: 'Empresas Registradas',
      cantidad: cantidadEmpresas,
      color: 'bg-blue-50',
    },
    {
      icono: <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-600" />,
      titulo: 'Inspecciones Subidas',
      cantidad: cantidadInspecciones,
      color: 'bg-green-50',
    },
    {
      icono: <DocumentTextIcon className="h-8 w-8 text-purple-600" />,
      titulo: 'Informes Subidos',
      cantidad: cantidadInformes,
      color: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
      {tarjetas.map((t, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className={`${t.color} p-6 rounded-xl shadow-md flex flex-col items-center text-center`}
        >
          {t.icono}
          <h3 className="text-lg font-bold text-gray-800 mt-4">{t.titulo}</h3>
          <p className="text-3xl font-bold text-gray-700 mt-2">{t.cantidad}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default TarjetasResumen;
