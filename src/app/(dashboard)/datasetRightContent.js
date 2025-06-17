"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { H3 } from "@/components/ui/typography";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const availableDimensions = [
    { name: "Tanggal Beli", icon: "📅" },
    { name: "Tanggal Jual", icon: "📅" },
    { name: "Kategori", icon: "🏷️" },
    { name: "Metode Pembayaran", icon: "💳" },
    { name: "Menu Item", icon: "🔘" },
];

const availableMeasures = [
    { name: "Jumlah Qty", icon: "🔢" },
    { name: "Harga", icon: "🔢" },
    { name: "Jumlah Order", icon: "🔢" },
    { name: "Menu Item", icon: "🔢" },
];

export default function DatasetRightContent() {
    const pathname = usePathname();
    const [isShowsideContent, setIsShowsideContent] = useState(false);

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
                            <ScrollArea className="h-auto max-h-28 rounded-md p-2">
                                <ul className="space-y-1">
                                    {availableDimensions.map((dim) => (
                                        <li
                                            key={dim.name}
                                            className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>{dim.icon}</span> {dim.name}
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                Measures
                            </p>
                            <ScrollArea className="h-auto max-h-28 rounded-md p-2">
                                <ul className="space-y-1">
                                    {availableMeasures.map((m) => (
                                        <li
                                            key={m.name}
                                            className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>{m.icon}</span> {m.name}
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
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
            )}
        </AnimatePresence>
    );
}
