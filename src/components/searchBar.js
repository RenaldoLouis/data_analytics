"use client";

import { Input } from "@/components/ui/input";
import { predefinedColors } from "@/constant/SidebarColor";
import { useDashboardContext } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";
import services from "@/services"; // Assuming your API services are exported from here
import debounce from 'lodash/debounce';
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function SearchBar({
    className,
    placeholder = "Search...",
    ...props
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const { setDataSetsList } = useDashboardContext();

    // Use a ref to store the original list to restore it when the search is cleared
    const originalListRef = useRef(null);

    // This function fetches the initial, full list of datasets
    const fetchInitialList = useCallback(async () => {
        try {
            const res = await services.dataset.getAllDataset(); // Assumes you have this service
            if (res.success) {
                const dataWithColors = res.data.map((item, index) => ({
                    ...item,
                    color: predefinedColors[index % predefinedColors.length], // cycle through colors
                }));
                setDataSetsList(dataWithColors);
                originalListRef.current = dataWithColors;
            }
        } catch (error) {
            console.error("Failed to fetch initial dataset list:", error);
        }
    }, [setDataSetsList]);

    // Fetch the initial list when the component mounts
    useEffect(() => {
        fetchInitialList();
    }, [fetchInitialList]);

    // This function is called to perform the search
    const performSearch = async (query) => {
        if (!query) {
            // If the search is empty, restore the original full list
            if (originalListRef.current) {
                setDataSetsList(originalListRef.current);
            }
            return;
        }

        try {
            // Call your search API endpoint
            const res = await services.dataset.searchDataset(query);
            if (res.success) {
                // Update the context with the search results
                const dataWithColors = res.data.map((item, index) => ({
                    ...item,
                    color: predefinedColors[index % predefinedColors.length], // cycle through colors
                }));
                setDataSetsList(dataWithColors);
            }
        } catch (error) {
            console.error("Search failed:", error);
            // Optionally, set an error state or show a toast
        }
    };

    // Create a debounced version of the search function
    const debouncedSearch = useCallback(debounce(performSearch, 500), []);

    const handleChange = (event) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
        // Call the debounced function every time the input changes
        debouncedSearch(newSearchTerm);
    };

    const handleClear = () => {
        setSearchTerm("");
        // When clearing, immediately restore the original list
        if (originalListRef.current) {
            setDataSetsList(originalListRef.current);
        }
    };

    return (
        <div className={cn("relative w-full max-w-md", className)}>
            <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full rounded-md bg-background pl-9 pr-8"
                    {...props}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </button>
                )}
            </div>
        </div>
    );
}
