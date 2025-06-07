import { Alert, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H3 } from "@/components/ui/typography";
import FormNewDataSet from "./FormNewDataSet";

export default function Page() {
  return (
    <>
      <div className="flex justify-between px-4 lg:px-6">
        <H3>All chart</H3>
        <Tabs defaultValue="account" className="w-[400px] items-end">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="px-4 lg:px-6">
        <Separator />
      </div>
      <div className="px-4 lg:px-6">
        <Alert variant="default" className="flex justify-between items-center">
          <AlertTitle>
            You don’t have any data sets. Add data sets first in order to make chart
          </AlertTitle>
          <FormNewDataSet />
        </Alert>
      </div>
    </>
  );
}
