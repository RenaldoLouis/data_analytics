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
            form: true,
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

const postFormRequest = async (path, payload /* this is FormData */) => {
    try {
        // const res = await fetch(path, {
        //     method: 'POST',
        //     body: payload, // This is your FormData object
        //     credentials: 'include', // Ensures cookies (like HttpOnly token) are sent
        //     // headers: {
        //     //     'Content-Type': 'multipart/form-data',
        //     // },
        // });

        // const json = await res.json();
        // if (!res.ok) throw new Error(json.message || 'Something went wrong');

        // return json;
        return apiClient(path, {
            method: 'POST',
            body: payload,
            form: true,
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
    },
    aws: {
        postSignedUrl: (directoryname, fileName) => postRequest(`/api/v1/apcs/signed-url-images?directoryname=${directoryname}&fileName=${fileName}`),
        downloadFiles: (files) => postBlobRequest(`/api/v1/apcs/download-files-aws`, files),
    },
    dataset: {
        addNewDataSet: (files) => postFormRequest(`/api/dataset`, files),
        getAllDataset: () => getRequest(`/api/dataset`),
    }
};
