import jsPDF from 'jspdf';
import { LessonItem } from '../../../core/types/lesson.types';

export function exportLessonToPdf(lesson: LessonItem, fullPath: string[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const c = lesson.content;
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(230, 81, 0); // Orange Prometheus
  doc.text('Plan de Lección - Prometheus', 20, y);
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  doc.text(lesson.title, 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Ruta: ${fullPath.join(' > ')}`, 20, y);
  y += 6;
  doc.text(`Fecha: ${lesson.date || 'N/A'}`, 20, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 8;

  const sections = [
    { title: '1. Objetivos de Aprendizaje', text: c.objectives },
    { title: '2. Lecturas / Páginas de Referencia', text: c.readings },
    { title: '3. Inicio / Warm-up', text: c.warmUp },
    { title: '4. Presentación de Contenidos', text: c.presentation },
    { title: '5. Práctica Guiada', text: c.guidedPractice },
    { title: '6. Práctica Independiente', text: c.independentPractice },
    { title: '7. Cierre de la Sesión', text: c.closure },
    { title: '8. Adecuaciones DUA', text: c.accommodations },
  ];

  doc.setFontSize(11);

  sections.forEach(sec => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 81, 0);
    doc.text(sec.title, 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const splitText = doc.splitTextToSize(sec.text || '(Sin registrar)', 170);
    doc.text(splitText, 20, y);
    y += splitText.length * 5 + 6;
  });

  doc.save(`${lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function exportLessonToTxt(lesson: LessonItem, fullPath: string[]): void {
  const c = lesson.content;
  const lines = [
    `PROMETHEUS EDUCATIONAL SUITE - PLAN DE LECCIÓN`,
    `Título: ${lesson.title}`,
    `Ruta: ${fullPath.join(' > ')}`,
    `Fecha: ${lesson.date}`,
    `--------------------------------------------------`,
    ``,
    `1. OBJETIVOS DE APRENDIZAJE:`,
    c.objectives || 'N/A',
    ``,
    `2. LECTURAS Y PÁGINAS:`,
    c.readings || 'N/A',
    ``,
    `3. INICIO / WARM-UP:`,
    c.warmUp || 'N/A',
    ``,
    `4. PRESENTACIÓN DE CONTENIDOS:`,
    c.presentation || 'N/A',
    ``,
    `5. PRÁCTICA GUIADA:`,
    c.guidedPractice || 'N/A',
    ``,
    `6. PRÁCTICA INDEPENDIENTE:`,
    c.independentPractice || 'N/A',
    ``,
    `7. CIERRE DE LA SESIÓN:`,
    c.closure || 'N/A',
    ``,
    `8. ADECUACIONES CURRICULARES (DUA):`,
    c.accommodations || 'N/A',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

