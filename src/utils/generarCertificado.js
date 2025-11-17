// src/utils/generarCertificado.js
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Función para generar el Certificado PDF
 * @param {Object} datos 
 * @param {string} datos.nombreAlumno
 * @param {string} datos.nombreCurso
 * @param {string} datos.fecha
 * @param {string} datos.codigoUnico
 * @param {string} datos.urlValidacion
 */
export async function generarCertificadoPDF({ nombreAlumno, nombreCurso, fecha, codigoUnico, urlValidacion }) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  // Generar QR
  const qrDataURL = await QRCode.toDataURL(urlValidacion);

  // Fondo opcional blanco
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 842, 595, 'F');

  // Título
  doc.setFontSize(28);
  doc.setTextColor(40, 40, 40);
  doc.text('Certificado de Aprobación', 421, 100, { align: 'center' });

  // Nombre
  doc.setFontSize(22);
  doc.text(`Otorgado a:`, 421, 180, { align: 'center' });

  doc.setFontSize(30);
  doc.setTextColor(0, 102, 204);
  doc.text(nombreAlumno, 421, 230, { align: 'center' });

  // Curso
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Por haber aprobado el curso:`, 421, 300, { align: 'center' });

  doc.setFontSize(24);
  doc.text(nombreCurso, 421, 340, { align: 'center' });

  // Fecha
  doc.setFontSize(16);
  doc.setTextColor(70, 70, 70);
  doc.text(`Fecha de Emisión: ${fecha}`, 421, 400, { align: 'center' });

  // Código único
  doc.setFontSize(14);
  doc.text(`Código de Validación: ${codigoUnico}`, 421, 430, { align: 'center' });

  // Código QR
  doc.addImage(qrDataURL, 'PNG', 720, 450, 80, 80);

  // Retornar PDF
  return doc;
}
