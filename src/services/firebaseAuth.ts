import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const createGoogleProvider = (includeGmb: boolean = false): GoogleAuthProvider => {
  const customProvider = new GoogleAuthProvider();
  // Request the combined scopes we enabled via set_up_oauth
  customProvider.addScope('https://www.googleapis.com/auth/forms.body');
  customProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
  customProvider.addScope('https://www.googleapis.com/auth/drive.file');
  customProvider.addScope('https://www.googleapis.com/auth/gmail.send');
  
  if (includeGmb) {
    customProvider.addScope('https://www.googleapis.com/auth/business.manage');
  }

  // Do not force select_account every single time; Google will reuse the session automatically 
  // if already authorized, creating a fast and seamless 1-click silent-like refresh!
  customProvider.setCustomParameters({});
  return customProvider;
};

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Cleanly verify if the cached Google access token is still valid (less than 55 minutes old)
const isTokenExpired = (): boolean => {
  try {
    const savedTime = localStorage.getItem('g_token_acquired_at');
    if (!savedTime) return true;
    const elapsed = Date.now() - parseInt(savedTime, 10);
    // Token is valid for 1 hour (3600s). We mark it expired at 55 minutes to be safe.
    return elapsed > 55 * 60 * 1000;
  } catch {
    return true;
  }
};

// Attempt to load from localStorage on service module evaluation if not expired
try {
  if (isTokenExpired()) {
    localStorage.removeItem('g_access_token');
    localStorage.removeItem('g_token_acquired_at');
    cachedAccessToken = null;
  } else {
    cachedAccessToken = localStorage.getItem('g_access_token');
  }
} catch (e) {
  console.warn('Failed to load cached access token from localStorage:', e);
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        try {
          if (isTokenExpired()) {
            localStorage.removeItem('g_access_token');
            localStorage.removeItem('g_token_acquired_at');
            cachedAccessToken = null;
          } else {
            cachedAccessToken = localStorage.getItem('g_access_token');
          }
        } catch (e) {
          console.warn('Failed to recover access token from localStorage:', e);
        }
      }

      if (cachedAccessToken && !isTokenExpired()) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        cachedAccessToken = null;
        try {
          localStorage.removeItem('g_access_token');
          localStorage.removeItem('g_token_acquired_at');
        } catch (e) {
          console.warn(e);
        }
        // Fallback: the user is logged in, but we have no valid cached OAuth token yet.
        // We still trigger success to avoid force logging out, but with fallback empty string
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem('g_access_token');
        localStorage.removeItem('g_token_acquired_at');
      } catch (e) {
        console.warn(e);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (includeGmb: boolean = false): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const dynamicProvider = createGoogleProvider(includeGmb);
    const result = await signInWithPopup(auth, dynamicProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('g_access_token', cachedAccessToken);
      localStorage.setItem('g_token_acquired_at', Date.now().toString());
    } catch (e) {
      console.warn('Failed to write access token to localStorage:', e);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    localStorage.removeItem('g_access_token');
    localStorage.removeItem('g_token_acquired_at');
  } catch (e) {
    console.warn(e);
  }
};
