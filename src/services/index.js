import { apiClient } from "@/lib/apiClient";
import http from "./http";

const handleErrors = (err /* path  payload */) => {
    // const errorMessageKey = err.response?.data?.error.Message;
    const errorMessageKey = err.response;
    return { error: errorMessageKey };
};


const getRequest = async (path) => {
    try {
        return apiClient(path, {
            method: 'GET',
            form: false,
        });
    } catch (err) {
        return handleErrors(err);
    }
};

const postAPIRequest = async (path, payload = {}) => {
    try {
        return apiClient(path, {
            method: 'POST',
            body: payload,
            form: false,
        });
    } catch (err) {
        return handleErrors(err);
    }
};

const postRequest = async (path, payload) => {
    try {
        const res = await http.post(path, payload);
        return res;
    } catch (err) {
        return handleErrors(err);
    }
};

const getAPIRequest = async (path) => {
    try {
        const res = await http.get(path);
        return res;
    } catch (err) {
        return handleErrors(err);
    }
};

const postFormRequest = async (path, payload) => {
    try {
        return apiClient(path, {
            method: 'POST',
            body: payload,
            form: true,
        });
    } catch (err) {
        return handleErrors(err);
    }
};

const putRequestMiddleware = async (path, payload) => {
    try {
        return apiClient(path, {
            method: 'PUT',
            body: payload,
            form: false,
        });
    } catch (err) {
        return handleErrors(err);
    }
};

const deleteRequestMiddleware = async (path) => {
    try {
        return apiClient(path, {
            method: 'DELETE',
            form: false,
        });
    } catch (err) {
        return handleErrors(err);
    }
};

const postBlobRequest = async (path, payload) => {
    try {
        const res = await http.postBlob(path, payload);
        return res;
    } catch (err) {
        return handleErrors(err);
    }
};

const putRequest = async (path, payload) => {
    try {
        const res = await http.put(path, payload);
        return res;
    } catch (err) {
        return handleErrors(err);
    }
};

const patchRequest = async (path, payload) => {
    try {
        return await http.patch(path, payload);
    } catch (err) {
        return handleErrors(err);
    }
};

const deleteRequest = async (path) => {
    try {
        return await http.delete(path);
    } catch (err) {
        return handleErrors(err);
    }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    auth: {
        register: (payload) => postRequest('/auth/register', payload),
        pricingPlans: () => getAPIRequest('/pricing-plans'),
        verifyEmail: (token) => getAPIRequest(`/auth/verify-email?token=${token}`),
        resendVerification: (email) => postRequest('/auth/resendVerification', email),
        authenticate: () => postAPIRequest('/next-api/authenticate'),
    },
    aws: {
        postSignedUrl: (directoryname, fileName) => postRequest(`/next-api/v1/apcs/signed-url-images?directoryname=${directoryname}&fileName=${fileName}`),
        downloadFiles: (files) => postBlobRequest(`/next-api/v1/apcs/download-files-aws`, files),
    },
    dataset: {
        addNewDataSet: (files) => postFormRequest(`/next-api/dataset`, files),
        getAllDataset: () => getRequest(`/next-api/dataset`),
        getAllDatasetById: (id, limit, page) => getRequest(`/next-api/dataset/${id}?limit=${limit}&page=${page}`),
        updateDatasetContents: (id, datasetContents) => putRequestMiddleware(`/next-api/dataset/updateDatasetContents/${id}`, datasetContents),
        updateDataset: (id, datasetContents) => putRequestMiddleware(`/next-api/dataset/updateDataset/${id}`, datasetContents),
        deleteDataset: (id) => deleteRequestMiddleware(`/next-api/dataset/${id}`),
        searchDataset: (name) => getRequest(`/next-api/dataset/searchDataset/?name=${name}`),
    },
    chart: {
        getChart: () => getRequest(`/next-api/chart`),
        getChartData: (data) => postAPIRequest(`/next-api/chart`, data),
        getChartRecords: (id) => getRequest(`/next-api/records/${id}`),
        postChartRecords: (data) => postAPIRequest(`/next-api/records`, data)
    },
    dashboard: {
        getDashboard: (layoutNumber) => getRequest(`/next-api/dashboard/${layoutNumber}`),
        postSaveDashboardRecord: (data) => postAPIRequest(`/next-api/dashboard`, data),
        deleteDashboardChart: (id) => deleteRequestMiddleware(`/next-api/dashboard/chart/${id}`),
    }
};
