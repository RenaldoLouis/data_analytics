// src/hooks/useDatasetTable.js
import services from '@/services';
import { useCallback, useEffect, useState } from 'react';

export function useDatasetTable(datasetId, pagination) {
    const [data, setData] = useState([]);
    const [dataTable, setDataTable] = useState([]);
    const [chartData, setChartdata] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDataset = useCallback(async () => {
        if (!datasetId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await services.dataset.getAllDatasetById(
                datasetId,
                pagination.pageSize,
                pagination.pageIndex + 1
            );

            const cleanedArray = res.data.datasets.map((item) => ({
                ...item.data,
                id: item.id,
            }));

            setData(res.data);
            setDataTable(cleanedArray);

            //TO DO: might be remove later only to mock to test draw chart on FE before
            if (chartData.length <= 0) {
                const res = await services.dataset.getAllDatasetById(
                    datasetId,
                    10,
                    1
                );

                const cleanedArray = res.data.datasets.map((item) => ({
                    ...item.data,
                    id: item.id,
                }));
                setChartdata(cleanedArray)
            }

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
        chartData,
        dataTable,
        loading,
        error,
        refetch: fetchDataset,
    };
}
