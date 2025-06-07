import LS_KEYS from "../constant/localStorage";

// Auth Token Helper
export const getUserAuthToken = () => localStorage.getItem(LS_KEYS.AUTH_TOKEN_KEY);

export const setUserAuthToken = (authToken) => {
  localStorage.setItem(LS_KEYS.AUTH_TOKEN_KEY, authToken);
};

export const removeUserAuthToken = () => {
  localStorage.removeItem(LS_KEYS.AUTH_TOKEN_KEY);
};

// User Details Helper
export const getLocalUserDetails = () => JSON.parse(localStorage.getItem(LS_KEYS.USER_DETAILS_KEY));

export const setLocalUserDetails = (userDetails) => {
  localStorage.setItem(LS_KEYS.USER_DETAILS_KEY, JSON.stringify(userDetails));
};

export const removeLocalUserDetails = () => {
  localStorage.removeItem(LS_KEYS.USER_DETAILS_KEY);
};
