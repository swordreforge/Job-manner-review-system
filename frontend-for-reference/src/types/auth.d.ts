export interface OAuthLink {
  provider: string
  displayName: string
  providerUsername: string
}

export interface User {
  id: string
  username: string
  role: string
  oauthLinks?: OAuthLink[]
  hasPassword?: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface OAuthProviderInfo {
  name: string
  displayName: string
  icon: string
}

export interface OAuthCallbackResponse {
  newUser: boolean
  accessToken?: string
  refreshToken?: string
  user?: User
  pendingToken?: string
  suggestedUsername?: string
  providerUsername?: string
}

export interface FaceLoginResponse extends AuthResponse {
  similarity?: number
}

export interface OAuthProviderAdmin {
  id: string
  name: string
  displayName: string
  icon: string
  clientId: string
  clientSecretSet: boolean
  authorizationUri: string
  tokenUri: string
  userInfoUri: string
  redirectUri: string
  scopes: string
  userIdField: string
  usernameField: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}
