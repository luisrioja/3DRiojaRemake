import type { ApiResponse, PortfolioProject, Service, Testimonial, AboutSection } from '../types';

const API_BASE = '/api';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: body?.error ?? `Error ${response.status}`,
      };
    }

    return body as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: 'Error de red: no se pudo conectar con el servidor',
    };
  }
}

// --- Public endpoints ---

export async function getPortfolio(): Promise<ApiResponse<PortfolioProject[]>> {
  return request<PortfolioProject[]>('/portfolio');
}

export async function getPortfolioById(id: string): Promise<ApiResponse<PortfolioProject>> {
  return request<PortfolioProject>(`/portfolio/${id}`);
}

export async function getServices(): Promise<ApiResponse<Service[]>> {
  return request<Service[]>('/services');
}

export async function getTestimonials(): Promise<ApiResponse<Testimonial[]>> {
  return request<Testimonial[]>('/testimonials');
}

// --- Auth endpoints ---

export async function login(
  username: string,
  password: string
): Promise<ApiResponse<{ token: string }>> {
  return request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  return request<void>('/auth/logout', { method: 'POST' });
}

export async function verifyAuth(): Promise<ApiResponse<{ valid: boolean }>> {
  return request<{ valid: boolean }>('/auth/verify');
}

// --- Admin: Portfolio CRUD ---

export async function createProject(
  data: Omit<PortfolioProject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<PortfolioProject>> {
  return request<PortfolioProject>('/portfolio', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: string,
  data: Partial<Omit<PortfolioProject, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<PortfolioProject>> {
  return request<PortfolioProject>(`/portfolio/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/portfolio/${id}`, { method: 'DELETE' });
}

// --- Admin: Services CRUD ---

export async function createService(
  data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Service>> {
  return request<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(
  id: string,
  data: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<Service>> {
  return request<Service>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/services/${id}`, { method: 'DELETE' });
}

// --- Admin: About CRUD ---

export async function getAboutSections(): Promise<ApiResponse<AboutSection[]>> {
  return request<AboutSection[]>('/about');
}

export async function createAboutSection(
  data: Omit<AboutSection, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<AboutSection>> {
  return request<AboutSection>('/about', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAboutSection(
  id: string,
  data: Partial<Omit<AboutSection, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<AboutSection>> {
  return request<AboutSection>(`/about/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAboutSection(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/about/${id}`, { method: 'DELETE' });
}
