import http from "./http";

const handleErrors = (err /* path  payload */) => {
    // const errorMessageKey = err.response?.data?.error.Message;
    const errorMessageKey = err.response;
    return { error: errorMessageKey };
};

const getRequest = async (path, params) => {
    try {
        return await http.get(path, params);
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
        login: (payload) => postRequest('/auth/login', payload),
        register: (payload) => postRequest('/auth/register', payload),
    },
    medicalStaff: {
        // getMedicalStaff: (status) => getRequest(`/secure/admin/staff?status=${status}`),
        getMedicalStaff: (status, role) => getRequest(`/secure/admin/staff`, { status, role }),
        editStaff: (status) => getRequest(`/secure/admin/staff?status=${status}`),
        approveStaff: (staffData) => putRequest(`/secure/admin/staff/approval`, staffData),
        updateStaff: (staffID, staffData) => patchRequest(`/secure/admin/staff/${staffID}`, staffData),
    },
    payment: {
        createPayment: (data) => postRequest(`/api/v1/apcs/createPayment`, data)
    },
    email: {
        sendEmail: (data) => postRequest(`/api/v1/apcs/sendEmail`, data),
        sendEmailWinner: (data) => postRequest(`/api/v1/apcs/sendEmailWinner`, data),
        sendEmailMarketing: (data) => postRequest(`/api/v1/apcs/sendEmailMarketing`, data),
    },
    galery: {
        getGalery: (eventName) => getRequest(`/api/v1/apcs/getGaleries?eventName=${eventName}`),
        getVideos: () => getRequest(`/api/v1/apcs/getVideos`)
    },
    aws: {
        postSignedUrl: (directoryname, fileName) => postRequest(`/api/v1/apcs/signed-url-images?directoryname=${directoryname}&fileName=${fileName}`),
        downloadFiles: (files) => postBlobRequest(`/api/v1/apcs/download-files-aws`, files),
    },
    dataset: {
        addNewDataSet: (files) => postBlobRequest(`/api/v1/apcs/download-files-aws`, files),
    }
};
