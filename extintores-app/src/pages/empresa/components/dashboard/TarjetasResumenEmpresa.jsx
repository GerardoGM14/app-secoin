// src/pages/empresa/components/dashboard/TarjetasResumenEmpresa.jsx

import { useEffect, useState } from 'react';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ClipboardDocumentCheckIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

function TarjetasResumenEmpresa({ empresaId }) {
  const [cantidadInspecciones, setCantidadInspecciones] = useState(0);
  const [cantidadInformes, setCantidadInformes] = useState(0);
  const [cantidadCapacitaciones, setCantidadCapacitaciones] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!empresaId) return;

      const qInspecciones = query(collection(db, 'inspecciones'), where('empresaId', '==', empresaId));
      const snapInspecciones = await getDocs(qInspecciones);
      setCantidadInspecciones(snapInspecciones.size);

      const qInformes = query(collection(db, 'informes'), where('empresaId', '==', empresaId));
      const snapInformes = await getDocs(qInformes);
      setCantidadInformes(snapInformes.size);

      const snapCapacitaciones = await getDocs(collection(db, 'capacitaciones'));
      setCantidadCapacitaciones(snapCapacitaciones.size); // Recordemos que es general
    };

    cargarDatos();
  }, [empresaId]);

  const tarjetas = [
    {
      icono: <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />,
      titulo: 'Inspecciones',
      cantidad: cantidadInspecciones,
      color: 'bg-blue-50',
    },
    {
      icono: <DocumentTextIcon className="h-8 w-8 text-green-600" />,
      titulo: 'Informes',
      cantidad: cantidadInformes,
      color: 'bg-green-50',
    },
    {
      icono: <AcademicCapIcon className="h-8 w-8 text-purple-600" />,
      titulo: 'Capacitaciones',
      cantidad: cantidadCapacitaciones,
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

export default TarjetasResumenEmpresa;
