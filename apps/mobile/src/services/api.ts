import axios from 'axios';
import { Platform } from 'react-native';
import { getAccessToken } from '../lib/session';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      console.log(`API [Request]: ${config.method?.toUpperCase()} ${config.url}`);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API [Auth]: Token attached');
      } else {
        // Skip warning for public auth routes
        const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
        if (!isAuthRoute) {
          console.warn('API [Auth]: No token found in session cache');
        }
      }
    } catch (error) {
      console.error('Error fetching token from session', error);
    }
    return config;
  },
  (error) => {
    console.error('API [Request Setup Error]:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API [Success]: ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`);

    // Automatically unwrap the standard backend envelope { success: true, data: T, message: string }
    if (response.data && typeof response.data === 'object' && response.data.success === true && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data
      };
    }

    return response;
  },
  (error) => {
    if (error.response) {
      // The backend responded with an error HTTP code (e.g. 400, 401, 500)
      console.warn(`API [Error]: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status ${error.response.status}`);
      console.warn('API [Error Data]:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // No response was received from the backend (server might be down or incorrect IP)
      console.warn(`API [Connection Error]: No response for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      error.message = 'Network error: Cannot connect to server. Please check your connection or backend server status.';
    } else {
      // Something triggered a config error
      console.warn('API [Unknown Error]: Cannot make request', error.message);
    }
    return Promise.reject(error);
  }
);

export const healthCheck = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.data;
  } catch (err) {
    throw new Error('Cannot connect to server. Backend might be down.');
  }
};

export default api;
