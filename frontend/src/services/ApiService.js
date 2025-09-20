import axios from 'axios';

const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Gesture Mappings
  async getGestureMappings() {
    const response = await this.client.get('/gestures');
    return response.data;
  }

  async updateGestureMapping(gesture, action, params = {}) {
    const response = await this.client.post('/gestures', {
      gesture,
      action,
      params,
    });
    return response.data;
  }

  async deleteGestureMapping(gesture) {
    const response = await this.client.delete(`/gestures/${gesture}`);
    return response.data;
  }

  // Gesture Detection
  async sendGestureDetection(gesture, timestamp) {
    const response = await this.client.post('/detect-gesture', {
      gesture,
      timestamp,
    });
    return response.data;
  }

  // System Status
  async getSystemStatus() {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      // If status endpoint doesn't exist, return basic info
      return {
        status: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Available Actions
  async getAvailableActions() {
    try {
      const response = await this.client.get('/actions');
      return response.data;
    } catch (error) {
      // Return default actions if endpoint doesn't exist
      return [
        {
          name: 'open_tab',
          description: 'Open a new browser tab',
          params: { url: 'string (optional, defaults to Google)' },
        },
        {
          name: 'open_app',
          description: 'Open a system application',
          params: { appName: 'string (required)' },
        },
        {
          name: 'volume_up',
          description: 'Increase system volume',
          params: {},
        },
        {
          name: 'volume_down',
          description: 'Decrease system volume',
          params: {},
        },
        {
          name: 'spotify_play_pause',
          description: 'Play/pause Spotify music',
          params: {},
        },
        {
          name: 'spotify_next',
          description: 'Skip to next track in Spotify',
          params: {},
        },
        {
          name: 'notification',
          description: 'Send a system notification',
          params: { message: 'string (optional)' },
        },
        {
          name: 'custom_command',
          description: 'Execute a custom system command',
          params: { command: 'string (required)' },
        },
      ];
    }
  }

  // Test connection
  async testConnection() {
    try {
      await this.getGestureMappings();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Restart Python service
  async restartPythonService() {
    try {
      const response = await this.client.post('/restart-python');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to restart Python service');
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
