import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FileText, FileX, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import * as XLSX from "xlsx"

export function FileUpload(props) {
    const { setSheetList } = props

    const [fileName, setFileName] = useState(null)
    const [fileSize, setFileSize] = useState(null)
    const {
        control,
        setError,
        clearErrors,
        formState: { errors }
    } = useFormContext()

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
                    <>
                        {fileName ? (
                            <div className="border rounded-md p-4 flex items-center justify-between bg-gray-50">
                                <div className="flex items-center space-x-3">
                                    <FileText className="text-blue-600 w-5 h-5" />
                                    <div>
                                        <p className="text-sm font-medium">{fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {fileSize} • Complete
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFileName(null)
                                        setFileSize(null)
                                        onChange(null)
                                        clearErrors("file")
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" />
                                </button>
                            </div>
                        ) : (
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
                                    CSV or XLSX (max. 10 MB)
                                </p>

                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const fileList = e.target.files;
                                        const file = fileList?.[0];
                                        const validationResult = validateFile(file);

                                        if (validationResult === true) {
                                            setFileName(file.name);
                                            setFileSize(`${Math.round(file.size / 1024)}kb`);
                                            clearErrors("file");
                                            onChange(fileList);

                                            // Read sheet names using xlsx
                                            const reader = new FileReader();
                                            reader.onload = (evt) => {
                                                const data = evt.target.result;
                                                const workbook = XLSX.read(data, { type: "binary" });
                                                const sheetNames = workbook.SheetNames;
                                                setSheetList(sheetNames)
                                            };
                                            reader.readAsBinaryString(file);
                                        } else {
                                            setFileName(null);
                                            setFileSize(null);
                                            onChange(null);
                                            setError("file", {
                                                type: "manual",
                                                message: validationResult,
                                            });
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </>
                )}
            />

            {errors.file && (
                <p className="text-sm text-red-600 mt-1">{errors.file.message}</p>
            )}
        </div>
    )
}
