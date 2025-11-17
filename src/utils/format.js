// src/utils/format.js

export default function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
  
    // Si es Timestamp de Firebase
    if (typeof fecha?.toDate === 'function') {
      return fecha.toDate().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  
    // Si ya es string u otro formato
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  