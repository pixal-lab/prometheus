import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SettingsDrawer } from './SettingsDrawer';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';

describe('SettingsDrawer render', () => {
  it('renders courses section with top creation form and list of registered courses', () => {
    useCalendarStore.setState({
      subjects: {
        'Matemáticas': { color: '#1abc9c', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
        'Historia': { color: '#e67e22', visible: true, availableDays: ['L', 'X', 'V'] },
      },
      subjectOrder: ['Matemáticas', 'Historia'],
      schoolYears: [
        { id: 1, name: 'Año 2026', startDate: '2026-03-01', endDate: '2026-12-15' },
      ],
      activeSchoolYearId: 1,
    });

    const html = renderToString(<SettingsDrawer isOpen={true} onClose={() => {}} initialSection="courses" />);
    // Header & Section
    expect(html).toContain('Cursos y Asignaturas');
    // Top Form
    expect(html).toContain('Crear Nuevo Curso');
    expect(html).toContain('Días en que se imparte:');
    expect(html).toContain('Añadir');
    // Courses List
    expect(html).toContain('Matemáticas');
    expect(html).toContain('Historia');
    expect(html).toContain('Cursos Registrados');
    // Form appears before existing courses in DOM
    const formIndex = html.indexOf('<form');
    const matIndex = html.indexOf('Matemáticas');
    expect(formIndex).toBeGreaterThan(-1);
    expect(matIndex).toBeGreaterThan(formIndex);
  });
});
