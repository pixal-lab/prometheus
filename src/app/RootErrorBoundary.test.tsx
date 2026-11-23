import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { RootErrorBoundary } from './RootErrorBoundary';
import { useTranslation } from '../core/i18n/useTranslation';

// Mock react-router-dom error hooks
const mockUseRouteError = vi.fn();
const mockIsRouteErrorResponse = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useRouteError: () => mockUseRouteError(),
    isRouteErrorResponse: (err: unknown) => mockIsRouteErrorResponse(err),
  };
});

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTranslation.getState().setLanguage('es');
  });

  it('renders NotFoundPage when error is 404 response', () => {
    const error404 = { status: 404, statusText: 'Not Found' };
    mockUseRouteError.mockReturnValue(error404);
    mockIsRouteErrorResponse.mockImplementation((err: unknown) => (err as { status?: number })?.status === 404);

    const html = renderToString(
      <MemoryRouter initialEntries={['/missing']}>
        <RootErrorBoundary />
      </MemoryRouter>
    );

    expect(html).toContain('404');
    expect(html).toContain('Página no encontrada');
    expect(html).toContain('Prometheus');
  });

  it('renders unexpected error boundary when a generic Error is thrown', () => {
    const genericError = new Error('Database connection failed');
    mockUseRouteError.mockReturnValue(genericError);
    mockIsRouteErrorResponse.mockReturnValue(false);

    const html = renderToString(
      <MemoryRouter>
        <RootErrorBoundary />
      </MemoryRouter>
    );

    expect(html).toContain('Ha ocurrido un error inesperado');
    expect(html).toContain('Database connection failed');
    expect(html).toContain('Recargar aplicación');
    expect(html).toContain('Ir al Inicio');
  });
});
