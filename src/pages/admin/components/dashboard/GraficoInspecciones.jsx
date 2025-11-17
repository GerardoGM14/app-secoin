// src/pages/admin/components/dashboard/GraficoInspecciones.jsx
import { useEffect, useState } from 'react';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

function GraficoInspecciones() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const snap = await getDocs(collection(db, 'inspecciones'));
      const datosMes = {};

      snap.docs.forEach(doc => {
        const fecha = doc.data().fecha?.toDate();
        if (fecha) {
          const mes = fecha.toLocaleString('default', { month: 'long' });
          datosMes[mes] = (datosMes[mes] || 0) + 1;
        }
      });

      const datosFormateados = Object.keys(datosMes).map(mes => ({
        mes,
        cantidad: datosMes[mes],
      }));

      setDatos(datosFormateados);
    };

    cargarDatos();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-md mt-8"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Inspecciones Subidas por Mes</h2>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default GraficoInspecciones;
