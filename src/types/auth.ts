
export interface LoginRequest {
  Agency: string;
  User: string;
  Password: string;
}

export interface LoginResponse {
  header: {
    requestId: string;
    success: boolean;
    messages: Array<{
      id: number;
      code: string;
      messageType: number;
      message: string;
    }>;
  };
  body: {
    token: string;
    expiresOn: string;
    tokenId: number;
    userInfo: {
      code: string;
      name: string;
      agency: {
        code: string;
        name: string;
        registerCode: string;
      };
      office: {
        code: string;
        name: string;
      };
      operator: {
        code: string;
        name: string;
        thumbnail: string;
      };
      market: {
        code: string;
        name: string;
        favicon: string;
      };
    };
  };
}

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userInfo: LoginResponse['body']['userInfo'] | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
