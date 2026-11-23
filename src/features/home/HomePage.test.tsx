import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useTranslation } from '../../core/i18n/useTranslation';

describe('HomePage (Home Hub - Clean Dashboard)', () => {
  beforeEach(() => {
    useTranslation.getState().setLanguage('es');
  });

  it('renders clean header with dynamic greeting and date in Spanish', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Docente');
  });

  it('renders My Day Today section with schedule info', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Mi Jornada de Hoy');
    expect(html).toContain('Ver Horario');
  });

  it('renders Recent Lessons widget for quick work resumption in Spanish', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Planes de Lección Recientes');
    expect(html).toContain('Ver todos los planes');
  });

  it('renders Upcoming Assessments and Events widget in Spanish', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Evaluaciones y Eventos');
    expect(html).toContain('Ver Calendario');
  });

  it('does NOT render redundant vanity KPI cards or duplicate ecosystem cards', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Verify non-redundancy: no duplicate ecosystem cards grid or vanity KPIs
    expect(html).not.toContain('Herramientas del Ecosistema');
    expect(html).not.toContain('Acceder al módulo');
    expect(html).not.toContain('Cursos y Asignaturas');
  });

  it('supports switching dynamically between English and Spanish', () => {
    // 1. Switch to English
    useTranslation.getState().setLanguage('en');

    let html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Good');
    expect(html).toContain('Teacher');
    expect(html).not.toContain('Docente');
    expect(html).toContain('My Day Today');
    expect(html).toContain('View Timetable');
    expect(html).toContain('Recent Lesson Plans');
    expect(html).toContain('View all plans');
    expect(html).toContain('Assessments &amp; Events');
    expect(html).toContain('View Calendar');
    expect(html).not.toContain('Mi Jornada de Hoy');

    // 2. Switch back to Spanish
    useTranslation.getState().setLanguage('es');

    html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(html).toContain('Docente');
    expect(html).not.toContain('Teacher');
    expect(html).toContain('Mi Jornada de Hoy');
    expect(html).toContain('Ver Horario');
    expect(html).toContain('Planes de Lección Recientes');
    expect(html).toContain('Ver todos los planes');
    expect(html).toContain('Evaluaciones y Eventos');
    expect(html).toContain('Ver Calendario');
  });
});
