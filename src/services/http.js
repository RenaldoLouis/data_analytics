import config from '@/config';
import { STATUS_CODES } from '@/lib/apiHelper';
import { getUserAuthToken, removeLocalUserDetails, removeUserAuthToken } from '@/lib/authHelper';
import axios from 'axios';

class HttpService {
  constructor() {
    this.baseURL = config.api.baseURL;
    this.authToken = getUserAuthToken();
    this.createAxiosInstance();

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === STATUS_CODES.ERROR.UNAUTHORIZED) {
          this.removeAuthTokenHeader();
          removeLocalUserDetails();
          removeUserAuthToken();
          window.open(`${window.location.origin}/login?ref=${window.location.pathname}`, '_self');
        }

        return Promise.reject(error);
      }
    );
  }

  createAxiosInstance() {
    this.axios = axios.create({
      baseURL: this.baseURL ?? '',
      headers: {
        'auth-token': this.authToken ?? '',
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthTokenHeader(authToken) {
    this.authToken = authToken;
    this.createAxiosInstance();
  }

  removeAuthTokenHeader() {
    this.authToken = null;
    this.createAxiosInstance();
  }

  get(url) {
    return this.axios.get(url);
  }

  post(url, payload) {
    return this.axios.post(url, payload);
  }
  postBlob(url, payload) {
    return this.axios.post(url, payload, { responseType: 'blob' });
  }

  put(url, payload) {
    return this.axios.put(url, payload);
  }

  patch(url, payload) {
    return this.axios.patch(url, payload);
  }

  delete(url, payload) {
    return this.axios.delete(url, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken ?? '',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
  }
}

const http = new HttpService();

export default http;
