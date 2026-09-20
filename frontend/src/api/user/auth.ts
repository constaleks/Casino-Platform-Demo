import { apiClient, ensureCsrfCookie } from './client';

import type { User } from '@/types/model';

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface LoginPayload {
    email: string;
    password: string;
    remember: boolean;
}

export interface AuthResponse {
    user: User;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
    await ensureCsrfCookie();
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
    return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    await ensureCsrfCookie();
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return data;
}

export async function logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
}

export async function fetchCurrentUser(): Promise<AuthResponse> {
    const { data } = await apiClient.get<AuthResponse>('/api/auth/me');
    return data;
}
