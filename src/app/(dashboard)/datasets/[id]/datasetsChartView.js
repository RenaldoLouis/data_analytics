import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";

const DatasetsChartView = () => {

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white p-8 rounded shadow place-items-center">
                <H3 className="text-xl font-bold">
                    You will be able to create chart after all validation are clear and normalized
                </H3>
                <Button variant="link" className="font-bold cursor-pointer" style={{ color: "#2168AB" }}>
                    Edit Data Sets
                </Button>
            </div>
        </div>
    )
}

export default DatasetsChartView;