import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"

const NewUploadStep3 = ({ sheetList, isLoading }) => {
    const { setValue, watch } = useFormContext()

    const sheetSelection = watch("sheetSelection") ?? ""

    // Use useMemo to safely compute selected sheet name
    const selectedSheetLabel = useMemo(() => {
        const index = parseInt(sheetSelection)
        return isNaN(index) ? "" : sheetList[index]
    }, [sheetSelection, sheetList])

    return (
        <div className="grid gap-6 w-full">
            {isLoading && (
                <LoadingScreen />
            )}
            <div className="grid gap-3 w-full">
                <Label>Sheet Selection</Label>
                <Select
                    onValueChange={(v) => setValue("sheetSelection", v)}
                    value={sheetSelection}
                >
                    <SelectTrigger className="w-full">
                        {/* Customize the label displayed in the trigger */}
                        <SelectValue placeholder="Select a sheet">
                            {selectedSheetLabel}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        {sheetList.map((sheet, index) => (
                            <SelectItem key={index} value={String(index)}>
                                {sheet}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default NewUploadStep3
