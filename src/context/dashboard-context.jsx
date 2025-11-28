"use client";
import services from "@/services";
import { createContext, useContext, useEffect, useRef, useState } from "react";

// 1. Create context
const DashboardContext = createContext();

// 2. Custom hook for convenience
export const useDashboardContext = () => useContext(DashboardContext);

// 3. Provider
export const DashboardProvider = ({ children }) => {
    const chartContainerRef = useRef(null);

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
    const [isChangesExistToSync, setIsChangesExistToSync] = useState(false);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [currentPricingPlans, setCurrentPricingPlans] = useState([]);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await services.auth.authenticate();
                setUserInfo(res.data)
            } catch (e) {
                console.error(e)
            }
        };

        checkAuth();
    }, [pricingPlans]);

    useEffect(() => {
        const currentUserPlan = pricingPlans.find(plan => plan.id === userInfo?.pricing_plan_id);
        setCurrentPricingPlans(currentUserPlan)
    }, [pricingPlans, userInfo]);

    useEffect(() => {
        const fetchPricingPlans = async () => {
            try {
                const res = await services.auth.pricingPlans();

                if (res.status === 200 || res.success) {
                    setPricingPlans(res.data.data.pricingPlans || []);
                }
            } catch (err) {
                console.error("Failed to fetch pricing plans:", err);
            }
        };
        fetchPricingPlans();
    }, []);

    return (
        <DashboardContext.Provider value={{ currentPricingPlans, userInfo, pricingPlans, isChangesExistToSync, setIsChangesExistToSync, chartContainerRef, selectedLayout, setSelectedLayout, chartListType, setChartListType, chartDrawData, setChartDrawData, selectedChartType, setSelectedChartType, dataSetsList, setDataSetsList, setDataToUpdate, dataToUpdate, setIsFetchDataSetContents, isFetchDataSetContents, selectedColumn, setSelectedColumn, selectedRow, setSelectedRow, setIsDialogOpenAddNewDataSet, isDialogOpenAddNewDataset, setIsFetchDataSetLists, isFetchDataSetLists }}>
            {children}
        </DashboardContext.Provider>
    );
};
