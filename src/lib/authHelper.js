import LS_KEYS from "@/constant/localStorage";

// Utility function to check if running in browser
const isBrowser = () => typeof window !== "undefined";

// Auth Token Helper
export const getUserAuthToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(LS_KEYS.AUTH_TOKEN_KEY);
};

export const setUserAuthToken = (authToken) => {
  if (!isBrowser()) return;
  localStorage.setItem(LS_KEYS.AUTH_TOKEN_KEY, authToken);
};

export const removeUserAuthToken = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(LS_KEYS.AUTH_TOKEN_KEY);
};

// User Details Helper
export const getLocalUserDetails = () => {
  if (!isBrowser()) return null;
  const item = localStorage.getItem(LS_KEYS.USER_DETAILS_KEY);
  try {
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to parse user details from localStorage:", error);
    return null;
  }
};

export const setLocalUserDetails = (userDetails) => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LS_KEYS.USER_DETAILS_KEY, JSON.stringify(userDetails));
  } catch (error) {
    console.error("Failed to stringify user details for localStorage:", error);
  }
};

export const removeLocalUserDetails = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(LS_KEYS.USER_DETAILS_KEY);
};
