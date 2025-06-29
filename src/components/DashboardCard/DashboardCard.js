import { Plus } from "lucide-react";

// A simple placeholder for the "Add Chart" cards
export const DashboardCard = ({ className = "" }) => {
    return (
        <div className={`flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed bg-card shadow-sm ${className}`}>
            <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                <Plus size={16} />
                Add Chart
            </button>
        </div>
    );
};