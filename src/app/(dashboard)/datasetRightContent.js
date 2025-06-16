"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { H3 } from "@/components/ui/typography";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const availableDimensions = [
    { name: "Tanggal Beli", icon: "📅" },
    { name: "Tanggal Jual", icon: "📅" },
    { name: "Kategori", icon: "🏷️" },
    { name: "Metode Pembayaran", icon: "💳" },
    { name: "Menu Item", icon: "📋" },
];

const availableMeasures = [
    { name: "Jumlah Qty", icon: "📊" },
    { name: "Harga", icon: "📊" },
    { name: "Jumlah Order", icon: "📊" },
    { name: "Menu Item", icon: "📊" },
];

export default function DatasetRightContent() {
    const pathname = usePathname();

    const [isShowsideContent, setIsShowsideContent] = useState(false);

    useEffect(() => {
        if (pathname === "/dashboard") {
            setIsShowsideContent(false)
        } else {
            setIsShowsideContent(true)
        }
    }, [pathname])

    return (
        <AnimatePresence>
            {isShowsideContent ? (
                <>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 w-full max-w-sm h-full bg-white"
                    >

                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <H3 className="text-lg font-semibold">Penjualan dan Pembelian Januari 2025</H3>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                    ✏️
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Switch id="show-dashboard" />
                                <Label htmlFor="show-dashboard" className="text-sm">Show to Dashboard</Label>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-2">
                            <div className="mb-4">
                                <p className="font-medium text-sm mb-1">Dimensions</p>
                                <ScrollArea className="h-24 border rounded-md p-2">
                                    {availableDimensions.map((dim) => (
                                        <div key={dim.name} className="text-sm text-muted-foreground">
                                            {dim.icon} {dim.name}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>

                            <div>
                                <p className="font-medium text-sm mb-1">Measures</p>
                                <ScrollArea className="h-24 border rounded-md p-2">
                                    {availableMeasures.map((m) => (
                                        <div key={m.name} className="text-sm text-muted-foreground">
                                            {m.icon} {m.name}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
                            <div>
                                <p><span className="font-medium">Data Source:</span> <a href="#" className="text-primary underline">Data_Penjualan_P...</a></p>
                                <p><span className="font-medium">Created on:</span> 04/05/2025</p>
                                <p><span className="font-medium">Last edited by:</span> Renaldo</p>
                                <p><span className="font-medium">Data status:</span> <span className="text-green-600">Ready for Visualization</span></p>
                                <p><span className="font-medium">Quality Score:</span> <span className="text-blue-600">100%</span></p>
                            </div>
                            <div className="flex gap-2 w-full">
                                <Button variant="secondary" className="flex-1">Sync Changes 🔄</Button>
                                <Button variant="destructive" className="flex-1">Delete Data Set</Button>
                            </div>
                        </CardFooter>
                    </motion.div>
                </>
            ) :
                null}
        </AnimatePresence>
    );
}
