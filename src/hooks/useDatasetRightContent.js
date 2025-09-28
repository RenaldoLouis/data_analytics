// src/hooks/useDatasetRightContent.js
import DimensionStringIcon from "@/assets/logo/dimensionStringIcon.svg";
import MeasureIcon from "@/assets/logo/measureIcon.svg";
import { ItemTypes } from '@/constant/DragTypes';
import services from '@/services';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

export function useDatasetRightContent(datasetId) {
    // const [data, setData] = useState([]);
    const [availableMeasures, setAvailableMeasures] = useState([]);
    const [availableDimensions, setAvailableDimensions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDataset = useCallback(async () => {
        if (!datasetId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await services.dataset.getAllDatasetById(
                datasetId,
                1,
                1
            );

            const cleanedArray = res.data.datasets.map((item) => ({
                ...item.data,
                id: item.id,
            }));

            const dimensions = [];
            const measures = [];

            for (const [key, value] of Object.entries(cleanedArray[0])) {
                const isNumeric = value !== null && !isNaN(Number(value));

                if (isNumeric) {
                    const tempObject = {
                        name: key,
                        icon: <Image src={MeasureIcon} alt="Measure icon" className="w-5 h-5" />,
                        type: ItemTypes.MEASURE
                    };
                    measures.push(tempObject);
                } else {
                    const tempObject = {
                        name: key,
                        icon: <Image src={DimensionStringIcon} alt="Measure icon" className="w-5 h-5" />,
                        type: ItemTypes.DIMENSION
                    };
                    dimensions.push(tempObject);
                }
            }

            setAvailableMeasures(measures)
            setAvailableDimensions(dimensions)

        } catch (err) {
            console.error("Failed to fetch dataset:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [datasetId]);

    useEffect(() => {
        fetchDataset();
    }, [fetchDataset]);

    return {
        availableMeasures,
        availableDimensions,
        loading,
        error
    };
}
