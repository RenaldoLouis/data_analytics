"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { H3 } from "@/components/ui/typography";
import { ItemTypes } from "@/constant/DragTypes";
import { useDatasetRightContent } from "@/hooks/useDatasetRightContent";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDrag } from "react-dnd";

const testGetterObj = {
    firstName: "bob",
    lastName: "sagot",
    get name() {
        return `${this.firstName} ${this.lastName}`
    }
}


const DraggableItem = ({ item, type }) => {
    const [, drag] = useDrag(() => ({
        type,
        item,
    }));

    return (
        <li
            ref={drag}
            className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
        >
            <span>{item.icon}</span> {item.name}
        </li>
    );
};

export default function DatasetRightContent() {
    const pathname = usePathname();
    const [isShowsideContent, setIsShowsideContent] = useState(false);
    const [datasetId, setDatasetId] = useState(null);

    useEffect(() => {
        if (pathname !== "/dashboard") {
            const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/);

            if (match) {
                const datasetId = match[1];
                setDatasetId(datasetId)
            }
        }
    }, [pathname]);

    const {
        availableDimensions,
        availableMeasures,
        loading
    } = useDatasetRightContent(datasetId);

    useEffect(() => {
        setIsShowsideContent(pathname !== "/dashboard");
    }, [pathname]);

    return (
        <AnimatePresence>
            {isShowsideContent && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 w-full max-w-sm h-full bg-white border-l"
                >
                    {/* Header */}
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <H3 className="text-lg font-bold leading-snug">
                                Penjualan dan Pembelian Januari 2025
                            </H3>
                            <Button variant="outline" size="icon" className="h-7 w-7">
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <Switch id="show-dashboard" defaultChecked />
                            <Label
                                htmlFor="show-dashboard"
                                className="text-sm font-medium text-gray-800"
                            >
                                Show to Dashboard
                            </Label>
                        </div>
                    </CardHeader>

                    {/* Dimensions and Measures */}
                    <CardContent className="pb-2">
                        <div className="mb-5">
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                Dimensions
                            </p>
                            {loading ? (
                                <div className="flex flex-col space-y-3">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                    </div>
                                </div>
                            ) : (
                                //  <ScrollArea className="h-auto max-h-28 rounded-md p-2">
                                < ul id="dimensionList" className="space-y-1">
                                    {availableDimensions.map((dim) => (
                                        <DraggableItem key={dim.name} item={dim} type={ItemTypes.DIMENSION} />
                                    ))}
                                </ul>
                                // </ScrollArea> 
                            )}

                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                Measures
                            </p>
                            {loading ? (
                                <div className="flex flex-col space-y-3">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                    </div>
                                </div>
                            ) : (
                                // <ScrollArea className="h-auto max-h-28 rounded-md p-2"> 
                                < ul id="measuresList" className="space-y-1">
                                    {availableMeasures.map((m) => (
                                        <DraggableItem key={m.name} item={m} type={ItemTypes.MEASURE} />
                                    ))}
                                </ul>
                                // </ScrollArea> 
                            )}
                        </div>
                    </CardContent>

                    {/* Footer: Details & Actions */}
                    <CardFooter className="flex flex-col items-start gap-4 border-t pt-4 text-sm text-gray-600">
                        <div className="space-y-1 w-full">
                            <p>
                                <span className="font-medium">Data Source:</span>{" "}
                                <a href="#" className="text-blue-600 underline">
                                    Data_Penjualan_P...
                                </a>
                            </p>
                            <p>
                                <span className="font-medium">Created on:</span> 04/05/2025
                            </p>
                            <p>
                                <span className="font-medium">Last edited on:</span> -
                            </p>
                            <p>
                                <span className="font-medium">Last edited by:</span> Renaldo
                            </p>
                            <p>
                                <span className="font-medium">Data status:</span>{" "}
                                <span className="text-green-600">Ready for Visualization</span>
                            </p>
                            <p>
                                <span className="font-medium">Quality Score:</span>{" "}
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    100%
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button variant="secondary" className="flex-1">
                                🔄 Sync Changes
                            </Button>
                            <Button variant="destructive" className="flex-1">
                                Delete Data Set
                            </Button>
                        </div>
                    </CardFooter>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
}
