const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getCurrentUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function signup(name: string, email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signin(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    // Persist session locally
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
}

export async function forgetPassword(email: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process forget password request');
    }
    return data;
  } catch (error) {
    console.error('Forget password error:', error);
    throw error;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

export async function updateAccount(fields: { name?: string; email?: string; password?: string }) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/auth/update-account`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update account');
    }
    
    // Update local storage user details if changed
    if (data.user) {
      const currentUser = getCurrentUser();
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return data;
  } catch (error) {
    console.error('Update account error:', error);
    throw error;
  }
}

export function signout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
