import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FileX, Upload } from "lucide-react"
import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

export function FileUpload() {
    const [fileName, setFileName] = useState(null)
    const { control, setError, clearErrors, formState: { errors } } = useFormContext()


    const validateFile = (file) => {
        if (!file) return "File is required"
        const validTypes = [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]
        if (!validTypes.includes(file.type)) {
            return "Unsupported file. Must be CSV or XLSX."
        }
        if (file.size > 10 * 1024 * 1024) {
            return "File size must be under 10MB"
        }
        return true
    }

    return (
        <div className="grid w-full max-w-md gap-1.5">
            <Label htmlFor="file-upload">Upload File</Label>

            <Controller
                name="file"
                control={control}
                rules={{
                    validate: (value) => {
                        const file = value?.[0]
                        return validateFile(file)
                    }
                }}
                render={({ field: { onChange } }) => (
                    <label
                        htmlFor="file-upload"
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-48 rounded-md border border-dashed text-sm cursor-pointer transition",
                            errors.file
                                ? "border-red-500 bg-red-50 text-red-600"
                                : "border-gray-300 text-muted-foreground hover:bg-muted/20"
                        )}
                    >
                        {errors.file ? (
                            <FileX className="h-6 w-6 mb-2 text-red-500" />
                        ) : (
                            <Upload className="h-6 w-6 text-blue-600 mb-2" />
                        )}

                        <p>
                            <span className={errors.file ? "text-red-600" : "text-blue-600 underline"}>
                                Link
                            </span>{" "}
                            or drag and drop
                        </p>
                        <p className="text-xs">
                            {fileName || "CSV or XLSX (max. 10 MB)"}
                        </p>

                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const fileList = e.target.files
                                const file = fileList?.[0]
                                const validationResult = validateFile(file)

                                if (validationResult === true) {
                                    setFileName(file.name)
                                    clearErrors("file")
                                    onChange(fileList)
                                } else {
                                    setFileName(null)
                                    setError("file", {
                                        type: "manual",
                                        message: validationResult,
                                    })
                                    onChange(null)
                                }
                            }}
                        />
                    </label>
                )}
            />

            {errors.file && (
                <p className="text-sm text-red-600 mt-1">{errors.file.message}</p>
            )}
        </div>
    )
}
