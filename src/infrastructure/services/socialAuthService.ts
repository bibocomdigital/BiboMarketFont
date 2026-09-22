
/**
 * Service dedicated to handling social authentication methods
 */

// Get backend URL from environment or use default
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api';

export interface GooglePopupResult {
  type?: string;
  token?: string;
  needsCompletion?: boolean;
  error?: string;
}

/**
 * Initiates Google OAuth login flow through a popup
 * The popup lets the user pick a Google account, then posts the token back
 * to this page via postMessage (no full-page redirect).
 */
export const initiateGoogleLogin = (
  onPopupResult?: (result: GooglePopupResult) => void,
): void => {
  const origin = encodeURIComponent(window.location.origin);
  const authUrl = `${backendUrl}/auth/google?mode=popup&origin=${origin}`;

  const popup = window.open(
    authUrl,
    'google-auth-popup',
    'width=520,height=640,left=200,top=150',
  );

  // Popup bloquée par le navigateur : repli sur la redirection classique
  if (!popup) {
    window.location.href = authUrl;
    return;
  }

  const allowedOrigins = new Set(
    [
      new URL(backendUrl).origin,
      window.location.origin,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return value;
        }
      }),
  );

  const handleMessage = (event: MessageEvent) => {
    if (!allowedOrigins.has(event.origin)) {
      return;
    }
    const data = event.data as GooglePopupResult | null;
    if (!data || data.type !== 'bibocom-google-auth') {
      return;
    }
    window.removeEventListener('message', handleMessage);
    popup.close();
    onPopupResult?.(data);
  };

  window.addEventListener('message', handleMessage);
};

/**
 * Initiates Facebook OAuth login flow
 * Redirects the user to Facebook's authentication page
 */
export const initiateFacebookLogin = (): void => {
  try {
    console.log('🔄 [SOCIAL-AUTH] Starting Facebook authentication flow');
    
    // Store the current URL for redirection after authentication
    const redirectUrl = window.location.origin + '/redirect';
    localStorage.setItem('auth_redirect_url', redirectUrl);
    
    // Build Facebook auth URL
    const authUrl = `${backendUrl}/auth/facebook`;
    console.log(`🔄 [SOCIAL-AUTH] Redirecting to Facebook authentication: ${authUrl}`);
    
    // Redirect to Facebook auth
    window.location.href = authUrl;
  } catch (error) {
    console.error('❌ [SOCIAL-AUTH] Error initiating Facebook login:', error);
    throw error;
  }
};

/**
 * Processes social authentication tokens received after OAuth flow
 * @param token The authentication token
 * @returns Whether the token was successfully processed
 */
export const processSocialAuthToken = (token: string): boolean => {
  try {
    console.log('🔄 [SOCIAL-AUTH] Processing social auth token');
    
    if (!token) {
      console.error('❌ [SOCIAL-AUTH] No token provided');
      return false;
    }
    
    // Store the token in localStorage
    localStorage.setItem('token', token);
    console.log('✅ [SOCIAL-AUTH] Token stored successfully');
    
    return true;
  } catch (error) {
    console.error('❌ [SOCIAL-AUTH] Error processing token:', error);
    return false;
  }
};

/**
 * Updates SocialLoginButton to use the social auth service
 * @param provider The OAuth provider ('google' | 'facebook')
 * @param onClose Optional function to close a modal or dialog
 * @param onPopupResult Optional callback receiving the Google popup result
 */
export const handleSocialLogin = (
  provider: 'google' | 'facebook',
  onClose?: () => void,
  onPopupResult?: (result: GooglePopupResult) => void,
): void => {
  // Close modal if provided
  if (onClose) {
    onClose();
  }

  if (provider === 'google') {
    initiateGoogleLogin(onPopupResult);
  } else {
    initiateFacebookLogin();
  }
};
