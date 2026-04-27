import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPortfolio,
  getPortfolioById,
  getServices,
  getTestimonials,
  login,
  logout,
  verifyAuth,
  createProject,
  updateProject,
  deleteProject,
  createService,
  updateService,
  deleteService,
} from './api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// --- Public endpoints ---

describe('getPortfolio', () => {
  it('returns portfolio projects on success', async () => {
    const data = [{ id: '1', title: 'P1', description: 'd', image: 'i', createdAt: '', updatedAt: '' }];
    mockFetch.mockReturnValue(jsonResponse({ success: true, data }));

    const res = await getPortfolio();
    expect(res.success).toBe(true);
    expect(res.data).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/portfolio', expect.objectContaining({ credentials: 'include' }));
  });
});

describe('getPortfolioById', () => {
  it('returns a single project', async () => {
    const data = { id: '1', title: 'P1', description: 'd', image: 'i', createdAt: '', updatedAt: '' };
    mockFetch.mockReturnValue(jsonResponse({ success: true, data }));

    const res = await getPortfolioById('1');
    expect(res.success).toBe(true);
    expect(res.data).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/1', expect.anything());
  });
});

describe('getServices', () => {
  it('returns services on success', async () => {
    const data = [{ id: '1', title: 'S1', description: 'd', icon: 'ic', createdAt: '', updatedAt: '' }];
    mockFetch.mockReturnValue(jsonResponse({ success: true, data }));

    const res = await getServices();
    expect(res.success).toBe(true);
    expect(res.data).toEqual(data);
  });
});

describe('getTestimonials', () => {
  it('returns testimonials on success', async () => {
    const data = [{ id: '1', author: 'A', text: 'T', rating: 5, date: '2025-01-01' }];
    mockFetch.mockReturnValue(jsonResponse({ success: true, data }));

    const res = await getTestimonials();
    expect(res.success).toBe(true);
    expect(res.data).toEqual(data);
  });
});

// --- Auth endpoints ---

describe('login', () => {
  it('returns token on valid credentials', async () => {
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: { token: 'jwt-token' } }));

    const res = await login('admin', 'pass');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ token: 'jwt-token' });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'pass' }),
      })
    );
  });

  it('returns error on invalid credentials', async () => {
    mockFetch.mockReturnValue(jsonResponse({ error: 'Credenciales incorrectas' }, 401));

    const res = await login('bad', 'bad');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Credenciales incorrectas');
  });
});

describe('logout', () => {
  it('calls POST /auth/logout', async () => {
    mockFetch.mockReturnValue(jsonResponse({ success: true }));

    const res = await logout();
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });
});

describe('verifyAuth', () => {
  it('returns valid status', async () => {
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: { valid: true } }));

    const res = await verifyAuth();
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ valid: true });
  });
});

// --- Admin: Portfolio CRUD ---

describe('createProject', () => {
  it('sends POST with project data', async () => {
    const input = { title: 'New', description: 'Desc', image: '/img.jpg' };
    const created = { ...input, id: '1', createdAt: '', updatedAt: '' };
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: created }));

    const res = await createProject(input);
    expect(res.success).toBe(true);
    expect(res.data).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/portfolio',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
    );
  });
});

describe('updateProject', () => {
  it('sends PUT with partial data', async () => {
    const update = { title: 'Updated' };
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: { id: '1', ...update } }));

    const res = await updateProject('1', update);
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/portfolio/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(update) })
    );
  });
});

describe('deleteProject', () => {
  it('sends DELETE for project id', async () => {
    mockFetch.mockReturnValue(jsonResponse({ success: true }));

    const res = await deleteProject('1');
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/1', expect.objectContaining({ method: 'DELETE' }));
  });
});

// --- Admin: Services CRUD ---

describe('createService', () => {
  it('sends POST with service data', async () => {
    const input = { title: 'New Svc', description: 'Desc', icon: 'ic' };
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: { ...input, id: '1', createdAt: '', updatedAt: '' } }));

    const res = await createService(input);
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/services',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
    );
  });
});

describe('updateService', () => {
  it('sends PUT with partial data', async () => {
    const update = { title: 'Updated Svc' };
    mockFetch.mockReturnValue(jsonResponse({ success: true, data: { id: '1', ...update } }));

    const res = await updateService('1', update);
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/services/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(update) })
    );
  });
});

describe('deleteService', () => {
  it('sends DELETE for service id', async () => {
    mockFetch.mockReturnValue(jsonResponse({ success: true }));

    const res = await deleteService('1');
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/services/1', expect.objectContaining({ method: 'DELETE' }));
  });
});

// --- Error handling ---

describe('network error handling', () => {
  it('returns error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const res = await getPortfolio();
    expect(res.success).toBe(false);
    expect(res.error).toBe('Error de red: no se pudo conectar con el servidor');
  });
});

describe('API error response handling', () => {
  it('returns error from server error response', async () => {
    mockFetch.mockReturnValue(jsonResponse({ error: 'Not found' }, 404));

    const res = await getPortfolioById('nonexistent');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not found');
  });

  it('returns generic error when body has no error field', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
    );

    const res = await getPortfolio();
    expect(res.success).toBe(false);
    expect(res.error).toBe('Error 500');
  });

  it('handles non-JSON error response', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      })
    );

    const res = await getPortfolio();
    expect(res.success).toBe(false);
    expect(res.error).toBe('Error 502');
  });
});
