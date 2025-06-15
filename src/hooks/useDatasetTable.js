// src/hooks/useDatasetTable.js
import services from '@/services';
import { useCallback, useEffect, useState } from 'react';

export function useDatasetTable(datasetId, pagination) {
    const [data, setData] = useState([]);
    const [dataTable, setDataTable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDataset = useCallback(async () => {
        if (!datasetId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await services.dataset.getAllDatasetById(
                datasetId,
                pagination.pageLimit,
                pagination.pageIndex
            );

            const cleanedArray = res.data.datasets.map((item) => ({
                ...item.data,
                id: item.id,
            }));

            setData(res.data.datasets);
            setDataTable(cleanedArray);
        } catch (err) {
            console.error("Failed to fetch dataset:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [datasetId, pagination]);

    // Automatically fetch when datasetId or pagination changes
    useEffect(() => {
        fetchDataset();
    }, [fetchDataset]);

    return {
        data,
        dataTable,
        loading,
        error,
        refetch: fetchDataset,
    };
}
