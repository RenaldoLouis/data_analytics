import client from '@/lib/apiClient'
import http from './http'

const handleError = (err) => ({ error: err.response ?? err.message })

// All requests through /next-api/ use the cookie-authed client
const get    = (path)         => client.get(path).then(r => r.data).catch(handleError)
const post   = (path, body)   => client.post(path, body).then(r => r.data).catch(handleError)
const put    = (path, body)   => client.put(path, body).then(r => r.data).catch(handleError)
const del    = (path)         => client.delete(path).then(r => r.data).catch(handleError)
const postForm = (path, body) => client.post(path, body, {
    headers: { 'Content-Type': undefined }, // let axios set multipart boundary
}).then(r => r.data).catch(handleError)

// Direct-to-backend requests (public, no cookie needed)
const directPost = (path, body) => http.post(path, body).then(r => r.data).catch(handleError)
const directGet  = (path)       => http.get(path).then(r => r.data).catch(handleError)

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    auth: {
        register:           (payload) => post('/next-api/register', payload),
        pricingPlans:       ()        => get('/next-api/pricing-plans'),
        verifyEmail:        (token)   => get(`/next-api/verify-email?token=${token}`),
        resendVerification: (email)   => directPost('/auth/resend-verification', email),
        upgradePlan:        (email)   => directPost('/auth/upgrade-plan', email),
        authenticate:       ()        => post('/next-api/authenticate'),
    },
    aws: {
        postSignedUrl: (directoryname, fileName) =>
            directPost(`/next-api/v1/apcs/signed-url-images?directoryname=${directoryname}&fileName=${fileName}`),
        downloadFiles: (files) =>
            http.post('/next-api/v1/apcs/download-files-aws', files, { responseType: 'blob' })
                .then(r => r.data).catch(handleError),
    },
    dataset: {
        addNewDataSet:          (files) => postForm('/next-api/dataset', files),
        getAllDataset:           ()      => get('/next-api/dataset'),
        getAllDatasetById:       (id, limit, page) => get(`/next-api/dataset/${id}?limit=${limit}&page=${page}`),
        updateDatasetContents:  (id, body) => put(`/next-api/dataset/updateDatasetContents/${id}`, body),
        updateDataset:          (id, body) => put(`/next-api/dataset/updateDataset/${id}`, body),
        deleteDataset:          (id)       => del(`/next-api/dataset/${id}`),
        searchDataset:          (name)     => get(`/next-api/dataset/searchDataset/?name=${name}`),
    },
    chart: {
        getChart:       ()     => get('/next-api/chart'),
        getChartData:   (data) => post('/next-api/chart', data),
        getChartRecords:(id)   => get(`/next-api/records/${id}`),
        postChartRecords:(data)=> post('/next-api/records', data),
    },
    dashboard: {
        getDashboard:           (layoutNumber) => get(`/next-api/dashboard/${layoutNumber}`),
        postSaveDashboardRecord:(data)         => post('/next-api/dashboard', data),
        deleteDashboardChart:   (id)           => del(`/next-api/dashboard/chart/${id}`),
    },
    pl: {
        getPls:             ()          => get('/next-api/pl'),
        getBrands:          ()          => get('/next-api/pl/brand'),
        getPlById:          (plId)      => get(`/next-api/pl/${plId}`),
        createPl:           (payload)   => post('/next-api/pl', payload),
        updatePl:           (plId, payload) => put(`/next-api/pl/${plId}`, payload),
        deletePl:           (plId)      => del(`/next-api/pl/${plId}`),
        getMonthlyByBrand:  (brandId)   => get(`/next-api/pl/brands/${brandId}/monthly`),
        getMonthlyById:     (updateId)  => get(`/next-api/pl/monthly/${updateId}`),
        getPreviousMonthly: (params)    => get(`/next-api/pl/monthly/previous?brandId=${params.brandId}&skuId=${params.skuId}&periodMonth=${params.periodMonth}&periodYear=${params.periodYear}`),
        getTakenMonths:     (brandId, year) => get(`/next-api/pl/monthly/taken-months?brandId=${brandId}&periodYear=${year}`),
        getMonthlyByPeriod: (brandId, skuId, periodMonth, periodYear) => get(`/next-api/pl/monthly/by-period?brandId=${brandId}&skuId=${skuId}&periodMonth=${periodMonth}&periodYear=${periodYear}`),
        createMonthly:      (payload)   => post('/next-api/pl/monthly', payload),
        updateMonthly:      (updateId, payload) => put(`/next-api/pl/monthly/${updateId}`, payload),
        deleteMonthly:      (updateId)  => del(`/next-api/pl/monthly/${updateId}`),
    },
    sku: {
        getSkus:                    ()           => get('/next-api/sku'),
        getSkuById:                 (skuId)      => get(`/next-api/sku/${skuId}`),
        createSku:                  (payload)    => post('/next-api/sku', payload),
        updateSku:                  (skuId, payload) => put(`/next-api/sku/${skuId}`, payload),
        deleteSku:                  (skuId)      => del(`/next-api/sku/${skuId}`),
        getCategories:              ()           => get('/next-api/sku/categories'),
        getCategoryById:            (categoryId) => get(`/next-api/sku/categories/${categoryId}`),
        getSubCategories:           ()           => get('/next-api/sku/subcategories'),
        getSubCategoriesByCategory: (categoryId) => get(`/next-api/sku/subcategories?categoryId=${categoryId}`),
    },
}
