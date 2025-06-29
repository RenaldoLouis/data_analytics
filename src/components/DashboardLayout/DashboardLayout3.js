



"use client"

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";

export default function DashboardLayout3() {
    return (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-6 md:gap-6 lg:p-6">
            <div className="md:col-span-3">
                <DashboardCard />
            </div>
            <div className="md:col-span-3">
                <DashboardCard />
            </div>

            <div className="md:col-span-2">
                <DashboardCard />
            </div>
            <div className="md:col-span-2">
                <DashboardCard />
            </div>
            <div className="md:col-span-2">
                <DashboardCard />
            </div>

            <div className="md:col-span-6 md:row-span-2">
                <DashboardCard className="min-h-96" />
            </div>

            <div className="md:col-span-3">
                <DashboardCard />
            </div>
            <div className="md:col-span-3">
                <DashboardCard />
            </div>
        </div>
    );
}
