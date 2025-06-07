import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export const metadata = {
    title: "Dashboard",
    description: "Dashboard section layout",
};

export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            }}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div
                    className="flex flex-1 flex-col"
                    style={{ background: "#f2f2f2" }}
                >
                    <div
                        className="@container/main flex flex-1 flex-col gap-2"
                        style={{
                            background: "white",
                            margin: 50,
                            borderRadius: 12,
                            border: "1px solid black",
                        }}
                    >
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
