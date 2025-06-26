
import { LoginRequest, LoginResponse } from '@/types/auth';

const API_BASE_URL = 'https://service.maxtravel.al';
const LOGIN_ENDPOINT = '/api/authenticationservice/login';

// Hardcoded credentials
const HARDCODED_CREDENTIALS: LoginRequest = {
  Agency: 'B2B',
  User: 'GPT',
  Password: '158258@3aA'
};

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private credentials: LoginRequest = HARDCODED_CREDENTIALS;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials?: LoginRequest): Promise<LoginResponse> {
    console.log('Attempting to authenticate with TourVisio API...');
    
    const loginCredentials = credentials || this.credentials;
    
    try {
      const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginCredentials),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const loginResponse: LoginResponse = await response.json();
      
      if (!loginResponse.header.success) {
        const errorMessage = loginResponse.header.messages[0]?.message || 'Authentication failed';
        throw new Error(errorMessage);
      }

      // Store authentication data
      this.token = loginResponse.body.token;
      this.tokenExpiry = new Date(loginResponse.body.expiresOn);
      this.credentials = loginCredentials;

      console.log('Authentication successful. Token expires at:', this.tokenExpiry);
      
      return loginResponse;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Auto-login with hardcoded credentials
  async autoLogin(): Promise<string> {
    const loginResponse = await this.login();
    return loginResponse.body.token;
  }

  async getValidToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    // If token is expired or missing, re-authenticate
    console.log('Token expired or missing, re-authenticating...');
    const loginResponse = await this.login();
    return loginResponse.body.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getTokenExpiry(): Date | null {
    return this.tokenExpiry;
  }

  isTokenValid(): boolean {
    return this.token !== null && 
           this.tokenExpiry !== null && 
           new Date() < this.tokenExpiry;
  }

  logout(): void {
    this.token = null;
    this.tokenExpiry = null;
    this.credentials = HARDCODED_CREDENTIALS;
    console.log('Logged out successfully');
  }
}

export default AuthService;
