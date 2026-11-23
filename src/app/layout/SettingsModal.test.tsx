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

  it('renders modal dialog when open with tablist and tabpanel semantics', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="general" />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('General');
    expect(html).toContain('Hemisferio Escolar');
  });

  it('does not render when isOpen is false', () => {
    const html = renderToString(<SettingsModal isOpen={false} onClose={() => {}} />);
    expect(html).toBe('');
  });

  it('renders courses tab with top creation form, color presets, and list of registered courses', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="courses" />);
    // Tab navigation
    expect(html).toContain('Cursos y Asignaturas');
    // Creation form
    expect(html).toContain('Crear Nuevo Curso');
    expect(html).toContain('Días en que se imparte:');
    expect(html).toContain('Añadir');
    expect(html).toContain('Colores sugeridos');
    // Existing courses
    expect(html).toContain('Matemáticas');
    expect(html).toContain('Historia');
    expect(html).toContain('Cursos Registrados');
  });

  it('renders school years tab with add year form, active badge and edit button', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="years" />);
    expect(html).toContain('Años Escolares');
    expect(html).toContain('2026');
    expect(html).toContain('Activo');
    expect(html).toContain('title="Editar año escolar"');
  });

  it('renders shortcuts tab with key combinations and localized mouse actions', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="shortcuts" />);
    expect(html).toContain('Atajos de Teclado');
    expect(html).toContain('Ctrl + Z');
    expect(html).toContain('Ctrl + Y');
    expect(html).toContain('Clic Derecho');
    expect(html).toContain('Doble Clic');
  });

  it('renders backup tab with export and import options', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="backup" />);
    expect(html).toContain('Copia de Seguridad');
    expect(html).toContain('Exportar a JSON');
    expect(html).toContain('Importar JSON');
    expect(html).toContain('Descargar Copia');
  });

  it('renders diagnostics tab with live system metrics', () => {
    const html = renderToString(<SettingsModal isOpen={true} onClose={() => {}} initialSection="debug" />);
    expect(html).toContain('Diagnóstico y Salud');
    expect(html).toContain('Estado del Motor');
    expect(html).toContain('Registros Totales');
    expect(html).toContain('Chequeo de Salud');
    expect(html).toContain('Descargar Reporte');
  });
});
