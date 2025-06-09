'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UploadStatus } from "@/constant/UploadStatus"
import services from "@/services"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
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
        formState: { errors },
    } = methods

    const [uploadDone, setUploadDone] = useState(null);

    const onSubmit = async (data) => {
        const formData = new FormData();
        formData.append("file", data.file[0]); // Assuming file input is handled via react-hook-form or similar
        formData.append("name", data.name);     // e.g., from a text input field

        try {
            const res = await services.dataset.addNewDataSet(formData); // assumes this sends as multipart/form-data

            if (res.status === 200) {
                // toast("Dataset uploaded successfully", {
                //     description: "File has been uploaded.",
                //     action: {
                //         label: "action",
                //         onClick: () => console.log("action"),
                //     },
                // });
                setUploadDone(UploadStatus.dataClear);
            } else {
                throw new Error("Upload failed with status " + res.status);
            }

        } catch (error) {
            toast("Upload failed", {
                description: error.message,
            });

            setUploadDone(UploadStatus.dataClear);
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
                />;
        }
    }

    return (
        <Dialog>
            <FormProvider {...methods}>
                <DialogTrigger asChild>
                    <Button onClick={() => setUploadDone(null)} variant="link" className="cursor-pointer">Button</Button>
                </DialogTrigger>
                <DialogContent className="px-0 py-0" showCloseButton={false}>
                    {dialogContent()}
                </DialogContent>
            </FormProvider>
        </Dialog>

    )
}

export default FormNewDataSet;