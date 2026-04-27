import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuthContext } from './AuthContext';

// Mock the api module
vi.mock('../services/api', () => ({
  verifyAuth: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import * as api from '../services/api';

const mockedApi = api as {
  verifyAuth: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('starts with isLoading=true and isAuthenticated=false', () => {
    mockedApi.verifyAuth.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isAuthenticated=true when verifyAuth returns valid session', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: true, data: { valid: true } });
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(mockedApi.verifyAuth).toHaveBeenCalledOnce();
  });

  it('sets isAuthenticated=false when verifyAuth returns invalid session', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: false, error: 'No token' });
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isAuthenticated=false when verifyAuth throws', async () => {
    mockedApi.verifyAuth.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login() sets isAuthenticated=true on success', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: false });
    mockedApi.login.mockResolvedValue({ success: true, data: { token: 'abc' } });

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: { success: boolean; error?: string };
    await act(async () => {
      loginResult = await result.current.login('admin', 'password');
    });

    expect(loginResult!.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockedApi.login).toHaveBeenCalledWith('admin', 'password');
  });

  it('login() returns error on failure and stays unauthenticated', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: false });
    mockedApi.login.mockResolvedValue({ success: false, error: 'Credenciales incorrectas' });

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: { success: boolean; error?: string };
    await act(async () => {
      loginResult = await result.current.login('admin', 'wrong');
    });

    expect(loginResult!.success).toBe(false);
    expect(loginResult!.error).toBe('Credenciales incorrectas');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout() sets isAuthenticated=false', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: true, data: { valid: true } });
    mockedApi.logout.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockedApi.logout).toHaveBeenCalledOnce();
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuthContext());
    }).toThrow('useAuthContext must be used within an AuthProvider');
  });

  it('sets isAuthenticated=false when verifyAuth returns valid=false', async () => {
    mockedApi.verifyAuth.mockResolvedValue({ success: true, data: { valid: false } });
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
  });
});
