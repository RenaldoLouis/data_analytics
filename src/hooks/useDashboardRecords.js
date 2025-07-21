// /src/hooks/useDashboardRecords.js
import services from '@/services';
import { useCallback, useEffect, useState } from 'react';

// You can move this helper function into a utils file or keep it here
const transformApiDataToListOfChart = (apiData, chartTypeMap, layoutSize = 8) => {
    // Start with an empty grid (an array of nulls)
    const newListOfChart = Array(layoutSize).fill(null);

    // Iterate over each chart returned from the API
    apiData.forEach(chart => {
        // The API gives us a 1-based order, so we subtract 1 for the array index
        const gridIndex = chart.order - 1;

        // Make sure the order is within the bounds of our layout
        if (gridIndex >= 0 && gridIndex < layoutSize) {

            // Look up the chartType string (e.g., "bar") using the chart_id
            const chartType = chartTypeMap[chart.chart_id] || 'bar'; // Fallback to 'bar'

            // Place the formatted chart object into the correct slot in our array
            newListOfChart[gridIndex] = {
                chartType: chartType,
                data: chart.chart_content,
                name: chart.name,
                id: chart.id,
                dataset_id: chart.dataset_id
            };
        }
    });

    return newListOfChart;
};

export const useDashboardRecords = (selectedLayout, chartListType) => {
    const [listOfChart, setListOfChart] = useState(Array(8).fill(null));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // useCallback memoizes the fetch function, preventing unnecessary re-fetches
    const fetchDashboardRecords = useCallback(async () => {
        // Don't fetch if we don't have the necessary data
        if (!selectedLayout || chartListType.length === 0) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const numberString = selectedLayout.replace(/\D/g, '');
            const layoutNumber = parseInt(numberString, 10);
            const res = await services.dashboard.getDashboard(layoutNumber);

            if (res?.success && res.data) {
                const chartTypeMap = chartListType.reduce((acc, type) => {
                    acc[type.id] = type.name.toLowerCase();
                    return acc;
                }, {});

                const formattedList = transformApiDataToListOfChart(res.data, chartTypeMap, 8);
                setListOfChart(formattedList);
            } else {
                // If the API call was not successful, reset the chart list
                setListOfChart(Array(8).fill(null));
            }
        } catch (e) {
            console.error("Failed to fetch dashboard records:", e);
            setError(e);
            setListOfChart(Array(8).fill(null));
        } finally {
            setIsLoading(false);
        }
    }, [selectedLayout, chartListType]); // Dependencies for the fetch function

    useEffect(() => {
        fetchDashboardRecords();
    }, [fetchDashboardRecords]); // This effect runs when the fetch function is recreated

    // Return the state and the refetch function
    return { listOfChart, setListOfChart, isLoading, error, refetch: fetchDashboardRecords };
};