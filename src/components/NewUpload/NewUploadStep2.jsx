import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const NewUploadStep2 = () => {
    const { setValue, watch, register, formState: { errors } } = useFormContext();

    const dateFormat = watch("dateFormat");
    const timeFormat = watch("timeFormat");

    // Register fields with validation rules
    useEffect(() => {
        register("dateFormat", { required: "Please select a date format." });
        register("timeFormat", { required: "Please select a time format." });
    }, [register]);

    return (
        <div className="grid gap-6 w-full">
            {/* Date Format */}
            <div className="grid gap-3 w-full">
                <Label>Date Format</Label>
                <Select
                    onValueChange={(v) => setValue("dateFormat", v)}
                    value={dateFormat}
                >
                    {/* make the trigger full width */}
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    {/* make the dropdown content at least as wide as the trigger */}
                    <SelectContent className="w-full">
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                    </SelectContent>
                </Select>
                {errors.dateFormat && (
                    <p className="text-sm text-red-500">{errors.dateFormat.message}</p>
                )}
            </div>

            {/* Time Format */}
            <div className="grid gap-3 w-full">
                <Label>Time Format</Label>
                <Select
                    onValueChange={(v) => setValue("timeFormat", v)}
                    value={timeFormat}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectItem value="HH:mm">14:30 (24-hour)</SelectItem>
                        <SelectItem value="hh:mm A">02:30 PM (12-hour)</SelectItem>
                    </SelectContent>
                </Select>
                {errors.timeFormat && (
                    <p className="text-sm text-red-500">{errors.timeFormat.message}</p>
                )}
            </div>
        </div>
    )
}

export default NewUploadStep2
