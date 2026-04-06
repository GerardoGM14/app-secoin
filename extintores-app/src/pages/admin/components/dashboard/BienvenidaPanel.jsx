// src/pages/admin/components/dashboard/BienvenidaPanel.jsx
import { motion } from 'framer-motion';

function BienvenidaPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white p-8 rounded-lg shadow-md mb-6"
    >
      <h1 className="text-3xl font-bold text-blue-700 mb-2">Bienvenido, Administrador 🎉</h1>
      <p className="text-gray-600 text-lg">
        Este es tu panel general. Desde aquí podrás tener una visión rápida de toda la actividad del sistema.
      </p>
    </motion.div>
  );
}

export default BienvenidaPanel;
