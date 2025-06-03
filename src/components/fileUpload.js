"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

export function FileUpload() {
    const [fileName, setFileName] = useState(null)

    function handleChange(e) {
        const file = e.target.files?.[0]
        if (file) {
            setFileName(file.name)
            console.log("File uploaded:", file)
        }
    }

    return (
        <div className="grid w-full max-w-md gap-1.5">
            <Label htmlFor="file-upload">Upload File</Label>

            <label
                htmlFor="file-upload"
                className={cn(
                    "flex flex-col items-center justify-center w-full h-48 rounded-md border border-dashed border-gray-300 text-sm text-muted-foreground cursor-pointer transition hover:bg-muted/20"
                )}
            >
                <Upload className="h-6 w-6 text-blue-600 mb-2" />
                <p>
                    <span className="text-blue-600 underline">Link</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                    {fileName || "CSV or XLSX (max. 10 MB)"}
                </p>

                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                />
            </label>
        </div>
    )
}
