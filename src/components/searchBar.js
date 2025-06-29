"use client";

import { Input } from "@/components/ui/input"; // Assuming you have shadcn's Input component
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";

export function SearchBar({
    className,
    placeholder = "Search...", // Default placeholder
    ...props
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleClear = () => {
        setSearchTerm("");
    };

    const handleChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className={cn("relative w-full max-w-md", className)}>
            <div className="relative flex items-center">
                {/* Search Icon */}
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                {/* Input Field */}
                <Input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full rounded-md bg-background pl-9 pr-8" // Add padding for icons
                    {...props}
                />

                {/* Clear Button (only shows when there is text) */}
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