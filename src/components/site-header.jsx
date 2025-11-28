import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useDashboardContext } from "@/context/dashboard-context";
import { useTranslations } from "next-intl";
import { NavUser } from "./nav-user";
import { SearchBar } from "./searchBar";

export function SiteHeader() {
  const t = useTranslations()

  const { isMobile } = useSidebar()
  const { userInfo } = useDashboardContext();

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 justify-between">
        <div className="flex w-full items-center ">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <SearchBar placeholder={t("searchDatasets")} />
        </div>

        <div className="flex w-full items-center justify-end">
          {/* <IconSettings className="size-6 mr-6" />
          <IconBell className="size-6" /> */}
          {/* {!isMobile && (<Separator orientation="vertical" className="mx-5 data-[orientation=vertical]:h-8" />)} */}
          <NavUser user={userInfo} />
        </div>
      </div>
    </header>
  );
}
