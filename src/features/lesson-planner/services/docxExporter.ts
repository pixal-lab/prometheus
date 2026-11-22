import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { LessonItem } from '../../../core/types/lesson.types';

export async function exportLessonToDocx(lesson: LessonItem, fullPath: string[]): Promise<void> {
  const c = lesson.content;
  const breadcrumb = fullPath.join(' > ');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Prometheus Educational Suite - Plan de Lección',
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Prometheus Suite',
                size: 18,
                color: '888888',
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            text: lesson.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Ruta Jerárquica: ', bold: true }),
              new TextRun({ text: breadcrumb }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha: ', bold: true }),
              new TextRun({ text: lesson.date || 'Sin fecha asignada' }),
            ],
            spacing: { after: 240 },
          }),

          createSection('1. Objetivos de Aprendizaje', c.objectives),
          createSection('2. Lecturas / Páginas de Referencia', c.readings),
          createSection('3. Inicio / Warm-up (Activación de Conocimientos)', c.warmUp),
          createSection('4. Presentación de Contenidos (Instrucción Directa)', c.presentation),
          createSection('5. Práctica Guiada', c.guidedPractice),
          createSection('6. Práctica Independiente', c.independentPractice),
          createSection('7. Cierre de la Sesión / Evaluación Formativa', c.closure),
          createSection('8. Adecuaciones Curriculares (DUA)', c.accommodations),
        ].flat(),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function createSection(title: string, text: string): Paragraph[] {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      text: text || '(Sin información registrada)',
      spacing: { after: 160 },
    }),
  ];
}

