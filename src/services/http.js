// might not need this anymore, this might still be used but only for api that does not need token authentication

import config from '@/config';
import { STATUS_CODES } from '@/lib/apiHelper';
import { getUserAuthTokenCookie } from '@/lib/cookieHelper';
import axios from 'axios';

class HttpService {
  constructor() {
    this.baseURL = config.api.baseURL;
    this.authToken = getUserAuthTokenCookie();
    this.createAxiosInstance();

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === STATUS_CODES.ERROR.UNAUTHORIZED) {
          this.removeAuthTokenHeader();
          // removeLocalUserDetails();
          // removeUserAuthTokenCookie();
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
    return this.axios.get(url, {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'application/json',
      },
    });
  }

  post(url, payload) {
    return this.axios.post(url, payload, {
      baseURL: this.baseURL,
      headers: {
        // Authorization: `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'application/json',
      }
    });
  }

  postFormData(url, payload) {
    return this.axios.post(url, payload, {
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  put(url, payload) {
    return this.axios.put(url, {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
  }

  patch(url, payload) {
    return this.axios.patch(url, {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
  }

  delete(url, payload) {
    return this.axios.delete(url, {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
  }

  postBlob(url, payload) {
    return this.axios.post(url, payload, { responseType: 'blob' });
  }
}

const http = new HttpService();

export default http;
