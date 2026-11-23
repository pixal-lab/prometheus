import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SettingsModal } from './SettingsModal';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';

describe('SettingsModal', () => {
  beforeEach(() => {
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
  });

  it('renders modal dialog when open', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="general" />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('General');
    expect(html).toContain('Hemisferio Escolar');
  });

  it('does not render when isOpen is false', () => {
    const html = renderToString(<SettingsModal isOpen={false} onClose={() => {}} />);
    expect(html).toBe('');
  });

  it('renders courses tab with top creation form and list of registered courses', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="courses" />);
    // Tab navigation
    expect(html).toContain('Cursos y Asignaturas');
    // Creation form
    expect(html).toContain('Crear Nuevo Curso');
    expect(html).toContain('Días en que se imparte:');
    expect(html).toContain('Añadir');
    // Existing courses
    expect(html).toContain('Matemáticas');
    expect(html).toContain('Historia');
    expect(html).toContain('Cursos Registrados');
  });

  it('renders school years tab with add year form and current year badge', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="years" />);
    expect(html).toContain('Años Escolares');
    expect(html).toContain('2026');
    expect(html).toContain('Activo');
  });

  it('renders shortcuts tab with key combinations', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="shortcuts" />);
    expect(html).toContain('Atajos de Teclado');
    expect(html).toContain('Ctrl + Z');
    expect(html).toContain('Ctrl + Y');
  });
});
