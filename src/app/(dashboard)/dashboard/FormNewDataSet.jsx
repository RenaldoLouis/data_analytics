'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UploadStatus } from "@/constant/UploadStatus"
import { useDashboardContext } from "@/context/dashboard-context"
import services from "@/services"
import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import FailedUpload from "./FailedUpload"
import NewUpload from "./NewUpload"
import SuccessUpload from "./SuccesUpload"
import WarningUpload from "./WarningUpload"

const FormNewDataSet = (props) => {
    const { setIsDialogOpenAddNewDataSet, isDialogOpenAddNewDataset, setIsFetchDataSetLists, isFetchDataSetLists } = useDashboardContext();

    const { isShowText = true } = props

    const methods = useForm({
        defaultValues: {
            name: "",
            file: null,
        },
    })
    const {
        register,
        handleSubmit,
        clearErrors,
        watch,
        reset,
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
        const wbout = XLSX.write(newWorkbook, {
            bookType: "xlsx",
            type: "array",
            compression: true
        });

        // Create a new Blob (or File)
        const newFile = new File([wbout], `sheet_${selectedSheetName}.xlsx`, {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        return newFile;
    };

    const createSingleSheetCSV = async (file, selectedSheetIndex) => {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        const sheetNames = workbook.SheetNames;
        const selectedSheetName = sheetNames[selectedSheetIndex];
        const selectedSheet = workbook.Sheets[selectedSheetName];

        // 1. Convert the sheet to JSON first, telling it to skip blank rows.
        const jsonData = XLSX.utils.sheet_to_json(selectedSheet, {
            header: 1, // Use this if you want to preserve headers
            blankrows: false // The magic option to skip empty rows
        });

        // 2. Convert the clean JSON data back into a worksheet.
        const newSheet = XLSX.utils.json_to_sheet(jsonData, {
            skipHeader: true // We already have the headers
        });

        // 3. Convert the new, clean sheet into a CSV string.
        const csvString = XLSX.utils.sheet_to_csv(newSheet);
        // ----------------------

        // Create a new Blob/File from the clean CSV string
        const newFile = new File([csvString], `${selectedSheetName}.csv`, {
            type: "text/csv",
        });

        return newFile;
    };

    const onSubmit = async (data) => {
        setIsLoading(true)
        const selectedSheetIndex = parseInt(data.sheetSelection)
        const fileToSend = await createSingleSheetCSV(data.file[0], selectedSheetIndex);

        const formData = new FormData();
        formData.append("file", fileToSend);
        formData.append("name", data.name);
        formData.append("dateFormat", data.dateFormat);
        formData.append("timeFormat", data.timeFormat);

        try {
            const res = await services.dataset.addNewDataSet(formData); // assumes this sends as multipart/form-data

            if (res?.success) {
                toast("Dataset uploaded successfully", {
                    description: "File has been uploaded."
                });
                setUploadDone(UploadStatus.dataClear);
            } else {
                setUploadDone(UploadStatus.uploadFailed);
                throw new Error("Upload failed with status " + res.status);
            }

            setIsFetchDataSetLists(!isFetchDataSetLists)
            setIsLoading(false)
        } catch (error) {
            toast("Upload failed", {
                description: error.message,
            });

            setUploadDone(UploadStatus.uploadFailed);
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

            case UploadStatus.uploadFailed:
                return <FailedUpload
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

    useEffect(() => {
        if (!isDialogOpenAddNewDataset) {
            reset();
            clearErrors();
            setUploadDone(null);
        }
    }, [isDialogOpenAddNewDataset])

    return (
        <Dialog open={isDialogOpenAddNewDataset} onOpenChange={setIsDialogOpenAddNewDataSet} >
            <FormProvider {...methods}>
                <DialogTrigger style={{ display: !isShowText ? "none" : "" }} asChild>
                    <Button onClick={() => setUploadDone(null)} variant="link" className="cursor-pointer">Add data sets</Button>
                </DialogTrigger>
                <DialogContent description="DialogContentAddNewDataSets" className="px-0 py-0" showCloseButton={false} style={{ height: 500 }}>
                    {dialogContent()}
                </DialogContent>
            </FormProvider>
        </Dialog>
    )
}

export default FormNewDataSet;