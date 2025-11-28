// utils/permissions.js or hooks/usePermissions.js

import { useDashboardContext } from "@/context/dashboard-context";
import { useMemo } from "react";

export const FEATURES = {
    DOWNLOAD: 'download',
    UPLOAD_DATASET: 'upload_dataset',
    EXPORT_DATA: 'export_data',
    // Add more features as needed
};

export class PermissionService {
    constructor(userPricingPlanId, pricingPlans) {
        this.userPlan = pricingPlans.find(plan => plan.id === userPricingPlanId);
    }

    canDownload(currentDownloads = 0) {
        if (!this.userPlan) return false;

        // -1 means unlimited
        if (this.userPlan.max_downloads === -1) return true;

        return currentDownloads < this.userPlan.max_downloads;
    }

    canCreateDataset(currentDatasets = 0) {
        if (!this.userPlan) return false;
        return currentDatasets < this.userPlan.max_datasets;
    }

    canProcessRows(rowCount) {
        if (!this.userPlan) return false;
        return rowCount <= this.userPlan.max_rows;
    }

    getRemainingDownloads(currentDownloads = 0) {
        if (!this.userPlan) return 0;
        if (this.userPlan.max_downloads === -1) return Infinity;
        return Math.max(0, this.userPlan.max_downloads - currentDownloads);
    }

    getRemainingDatasets(currentDatasets = 0) {
        if (!this.userPlan) return 0;
        return Math.max(0, this.userPlan.max_datasets - currentDatasets);
    }

    getPlanLimits() {
        return {
            maxRows: this.userPlan?.max_rows || 0,
            maxDownloads: this.userPlan?.max_downloads || 0,
            maxDatasets: this.userPlan?.max_datasets || 0,
            planName: this.userPlan?.name || 'Unknown',
        };
    }
}

// React Hook version
export const usePermissions = () => {
    const { pricingPlans, userInfo } = useDashboardContext();

    return useMemo(() => {
        return new PermissionService(userInfo?.pricing_plan_id, pricingPlans);
    }, [userInfo?.pricing_plan_id, pricingPlans]);
};