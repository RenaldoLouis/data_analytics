'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UploadStatus } from "@/constant/UploadStatus"
import services from "@/services"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import NewUpload from "./NewUpload"
import SuccessUpload from "./SuccesUpload"
import WarningUpload from "./WarningUpload"

const FormNewDataSet = () => {
    const methods = useForm({
        defaultValues: {
            name: "",
            file: null,
        },
    })
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = methods

    const [uploadDone, setUploadDone] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const createSingleSheetFile = async (file, selectedSheetIndex) => {
        // Read the file as ArrayBuffer
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        const sheetNames = workbook.SheetNames;
        const selectedSheetName = sheetNames[selectedSheetIndex];
        const selectedSheet = workbook.Sheets[selectedSheetName];

        // Create a new workbook with only the selected sheet
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, selectedSheet, selectedSheetName);

        // Write it to binary string
        const wbout = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });

        // Create a new Blob (or File)
        const newFile = new File([wbout], `sheet_${selectedSheetName}.xlsx`, {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        return newFile;
    };

    const onSubmit = async (data) => {
        setIsLoading(true)
        //recreate the sheet
        const selectedSheetIndex = parseInt(data.sheetSelection)
        const fileToSend = await createSingleSheetFile(data.file[0], selectedSheetIndex);

        const formData = new FormData();
        formData.append("file", fileToSend);
        formData.append("name", data.name);
        formData.append("dateFormat", data.dateFormat);
        formData.append("timeFormat", data.timeFormat);

        try {
            const res = await services.dataset.addNewDataSet(formData); // assumes this sends as multipart/form-data

            if (res.success) {
                toast("Dataset uploaded successfully", {
                    description: "File has been uploaded.",
                    action: {
                        label: "action",
                        onClick: () => console.log("action"),
                    },
                });
                setUploadDone(UploadStatus.dataClear);
            } else {
                setUploadDone(UploadStatus.dataNotClear);
                throw new Error("Upload failed with status " + res.status);
            }

            setIsLoading(false)
        } catch (error) {
            toast("Upload failed", {
                description: error.message,
            });

            setUploadDone(UploadStatus.dataNotClear);
            setIsLoading(false)
        }
    };

    const dialogContent = () => {
        switch (uploadDone) {
            case UploadStatus.dataClear:
                return <SuccessUpload
                    handleSubmit={handleSubmit}
                    onSubmit={onSubmit}
                    register={register}
                    errors={errors}
                    setUploadDone={setUploadDone}
                />;

            case UploadStatus.dataNotClear:
                return <WarningUpload
                    handleSubmit={handleSubmit}
                    onSubmit={onSubmit}
                    register={register}
                    errors={errors}
                    setUploadDone={setUploadDone}
                />;

            default:
                return <NewUpload
                    handleSubmit={handleSubmit}
                    onSubmit={onSubmit}
                    register={register}
                    errors={errors}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                />;
        }
    }

    return (
        <Dialog>
            <FormProvider {...methods}>
                <DialogTrigger asChild>
                    <Button onClick={() => setUploadDone(null)} variant="link" className="cursor-pointer">Add data sets</Button>
                </DialogTrigger>
                <DialogContent description="DialogContentAddNewDataSets" className="px-0 py-0" showCloseButton={false}>
                    {dialogContent()}
                </DialogContent>
            </FormProvider>
        </Dialog>

    )
}

export default FormNewDataSet;