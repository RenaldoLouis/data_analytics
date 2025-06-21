"use client";

import { ItemTypes } from "@/constant/DragTypes";

export function transformForPieChart(rawData, dimension, measure) {
    if (!dimension || !measure) return [];

    const dimensionKey = dimension.name;
    const measureKey = measure.name;
    const isSumming = measure.type === ItemTypes.MEASURE;

    const grouped = {};

    rawData.forEach((item) => {
        const dimensionValue = item[dimensionKey];
        if (!dimensionValue) return;

        if (!grouped[dimensionValue]) {
            grouped[dimensionValue] = 0;
        }

        if (isSumming) {
            grouped[dimensionValue] += Number(item[measureKey]) || 0;
        } else {
            // If the measure is a dimension, we count it.
            grouped[dimensionValue] += 1;
        }
    });

    return Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
    }));
}

export function transformChartData(rawData, selectedRow, selectedColumn) {
    if (selectedRow.length === 0 || selectedColumn.length === 0) return [];

    // Access the name and type from the selectedRow object
    const rowField = selectedRow[0].name; // The field name its Metrics / Values (e.g., 'Customer Age', 'Quantity')
    const rowType = selectedRow[0].type; // The type (e.g., ItemTypes.DIMENSION, ItemTypes.MEASURE)
    const colKey = selectedColumn[0].name; // The field name for the column (always a dimension/grouping)

    const grouped = {};
    // Determine aggregation type based on the ItemType of the field in 'Rows'
    const isSumming = rowType === ItemTypes.MEASURE; // True if it's a measure, false if it's a dimension

    rawData.forEach((item) => {
        const xAxisDimensionValue = item[colKey];
        const measureValue = item[rowField]; // Use rowField here

        if (!grouped[xAxisDimensionValue]) {
            grouped[xAxisDimensionValue] = 0; // Initialize for both sum and count
        }

        if (isSumming) {
            // Aggregate by summing for MEASURES
            grouped[xAxisDimensionValue] += Number(measureValue) || 0;
        } else {
            // Aggregate by counting for DIMENSIONS (when they are in the 'Rows' slot)
            grouped[xAxisDimensionValue] += 1;
        }
    });

    const aggregatedKeySuffix = isSumming ? '_Sum' : '_Count';
    const finalAggregatedKey = rowField + aggregatedKeySuffix; // Use rowField here

    return Object.entries(grouped).map(([xAxisValue, aggregatedValue]) => ({
        [colKey]: xAxisValue,
        [finalAggregatedKey]: aggregatedValue,
    }));
}