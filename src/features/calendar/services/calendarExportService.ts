import { ClassBlock, SchoolYear } from '../../../core/types/calendar.types';

export class CalendarExportService {
  /**
   * Exporta la lista de clases a formato CSV compatible con Microsoft Excel (con BOM UTF-8)
   */
  static exportCalendarToExcel(classBlocks: ClassBlock[], filename = 'calendario-clases.csv'): void {
    const headers = ['Fecha', 'Asignatura', 'Tema / Actividad', 'Evaluación', 'Detalles de Evaluación', 'Notas'];
    const rows = classBlocks
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(b => [
        `"${b.date}"`,
        `"${(b.subject || '').replace(/"/g, '""')}"`,
        `"${(b.topic || '').replace(/"/g, '""')}"`,
        `"${b.evaluation ? 'Sí' : 'No'}"`,
        `"${(b.evaluationDetails || '').replace(/"/g, '""')}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta el calendario de clases a documento compatible con Word (.doc) con tabla HTML formateada
   */
  static exportCalendarToWord(classBlocks: ClassBlock[], schoolYear?: SchoolYear, filename = 'planificacion-calendario.doc'): void {
    const sorted = classBlocks.slice().sort((a, b) => a.date.localeCompare(b.date));
    const yearTitle = schoolYear ? schoolYear.name : 'Año Escolar';

    let tableRows = sorted
      .map(
        b => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${b.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #d35400;">${b.subject}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${b.topic}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${b.evaluation ? 'Sí' : 'No'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${b.notes || '-'}</td>
      </tr>`
      )
      .join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Planificación - Prometheus</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          h1 { color: #d35400; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Prometheus - Planificación Escolar (${yearTitle})</h1>
        <p>Total de clases planificadas: ${sorted.length}</p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Asignatura</th>
              <th>Tema / Actividad</th>
              <th>Evaluación</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta planes de lección a Word
   */
  static exportLessonPlansToWord(classBlocks: ClassBlock[], filename = 'planes-de-leccion.doc'): void {
    const withPlans = classBlocks.filter(b => b.lessonPlan || b.lessonPlanId);
    let htmlContent = withPlans
      .map(b => {
        const lp = b.lessonPlan || {};
        return `
        <div style="margin-bottom: 30px; page-break-after: always;">
          <h2 style="color: #2980b9;">${b.subject} - ${b.topic} (${b.date})</h2>
          <h3>Objetivos:</h3>
          <p>${lp.objectives || 'No especificados'}</p>
          <h3>Materiales y Recursos:</h3>
          <p>${lp.materials || lp.readings || 'No especificados'}</p>
          <h3>Actividades / Desarrollo:</h3>
          <p>${lp.activities || lp.presentation || 'No especificadas'}</p>
          <h3>Evaluación:</h3>
          <p>${lp.assessment || (b.evaluation ? b.evaluationDetails : 'Formativa continua')}</p>
          <h3>Notas y Adaptaciones (DUA):</h3>
          <p>${lp.notes || lp.accommodations || '-'}</p>
        </div>`;
      })
      .join('<hr style="border: 1px solid #ccc; margin: 20px 0;"/>');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Planes de Lección</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1>Planes de Lección - Prometheus</h1>
        ${htmlContent || '<p>No hay planes de lección vinculados en este periodo.</p>'}
      </body>
      </html>`;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
