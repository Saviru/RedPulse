import api from './api';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  role: 'USER' | 'ORGANIZATION' | 'HOSPITAL';
  // Shared / User fields
  fullName?: string;
  phone?: string;
  nic?: string;
  dob?: string;
  location?: string;
  bloodGroup?: string;
  weight?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  // Organization fields
  organizationName?: string;
  registrationNumber?: string;
  website?: string;
  orgType?: 'NGO' | 'GOVERNMENT' | 'PRIVATE' | 'OTHER';
  // Hospital fields
  hospitalName?: string;
  licenseNumber?: string;
  address?: string;
  emergencyContact?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    let requestData: any = data;
    let headers: any = {};

    if (data.avatarUrl) {
      requestData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'avatarUrl' && data.avatarUrl) {
          const uriParts = data.avatarUrl.split('/');
          const fileName = uriParts[uriParts.length - 1];
          const fileType = fileName.split('.').pop() || 'jpeg';
          requestData.append('avatar', {
            uri: data.avatarUrl,
            name: fileName,
            type: `image/${fileType}`,
          } as any);
        } else if (data[key as keyof RegisterData] !== undefined) {
          requestData.append(key, data[key as keyof RegisterData] as any);
        }
      });
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.post('/auth/register', requestData, { headers });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  deleteProfile: async () => {
    // just ping the request-delete
    const response = await api.post('/auth/request-delete');
    return response.data;
  },

  getDonors: async () => {
    const response = await api.get('/auth/donors');
    return response.data;
  },

  verifyRegistration: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-registration', { email, otp });
    return response.data;
  },

  resendOtp: async (email: string, purpose: 'REGISTER' | 'DELETE') => {
    const response = await api.post('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  requestDelete: async () => {
    const response = await api.post('/auth/request-delete');
    return response.data;
  },

  confirmDelete: async (otp: string) => {
    const response = await api.post('/auth/confirm-delete', { otp });
    return response.data;
  },
};
