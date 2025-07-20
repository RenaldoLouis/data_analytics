"use client";
import { createContext, useContext, useState } from "react";

// 1. Create context
const DashboardContext = createContext();

// 2. Custom hook for convenience
export const useDashboardContext = () => useContext(DashboardContext);

// 3. Provider
export const DashboardProvider = ({ children }) => {
    const [selectedColumn, setSelectedColumn] = useState([]);
    const [selectedRow, setSelectedRow] = useState([]);
    const [isDialogOpenAddNewDataset, setIsDialogOpenAddNewDataSet] = useState(false);
    const [isFetchDataSetLists, setIsFetchDataSetLists] = useState(false);
    const [isFetchDataSetContents, setIsFetchDataSetContents] = useState(false);
    const [dataToUpdate, setDataToUpdate] = useState([]);
    const [dataSetsList, setDataSetsList] = useState([]);
    const [selectedChartType, setSelectedChartType] = useState(null);
    const [chartDrawData, setChartDrawData] = useState([]);
    const [chartListType, setChartListType] = useState([]);
    const [selectedLayout, setSelectedLayout] = useState("layout1");


    return (
        <DashboardContext.Provider value={{ selectedLayout, setSelectedLayout, chartListType, setChartListType, chartDrawData, setChartDrawData, selectedChartType, setSelectedChartType, dataSetsList, setDataSetsList, setDataToUpdate, dataToUpdate, setIsFetchDataSetContents, isFetchDataSetContents, selectedColumn, setSelectedColumn, selectedRow, setSelectedRow, setIsDialogOpenAddNewDataSet, isDialogOpenAddNewDataset, setIsFetchDataSetLists, isFetchDataSetLists }}>
            {children}
        </DashboardContext.Provider>
    );
};
