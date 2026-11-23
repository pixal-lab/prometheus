import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';
import { useTranslation } from '../core/i18n/useTranslation';

describe('NotFoundPage', () => {
  beforeEach(() => {
    useTranslation.getState().setLanguage('es');
  });

  it('renders 404 title, code and description in Spanish', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(html).toContain('404');
    expect(html).toContain('Página no encontrada');
    expect(html).toContain('La página que buscas no existe');
    expect(html).toContain('/ruta-inexistente');
    expect(html).toContain('Volver al Inicio');
    expect(html).toContain('Página anterior');
  });

  it('renders quick navigation links to main app areas', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/otra-ruta']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/timetable"');
    expect(html).toContain('href="/lesson-planner"');
    expect(html).toContain('href="/gradebook"');
    expect(html).toContain('href="/proof-correction"');
  });

  it('supports English translation', () => {
    useTranslation.getState().setLanguage('en');

    const html = renderToString(
      <MemoryRouter initialEntries={['/invalid-path']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(html).toContain('Page Not Found');
    expect(html).toContain('The page you are looking for does not exist');
    expect(html).toContain('Return to Home');
    expect(html).toContain('Go Back');
    expect(html).toContain('/invalid-path');
  });
});
