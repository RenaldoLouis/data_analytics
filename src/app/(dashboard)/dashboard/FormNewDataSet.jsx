'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UploadStatus } from "@/constant/UploadStatus"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
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

    const onSubmit = (data) => {
        console.log("Form submitted:", data)
        setUploadDone(UploadStatus.dataClear)
    }

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
                    <Button variant="link" className="cursor-pointer">Button</Button>
                </DialogTrigger>
                <DialogContent className="px-0 py-0" showCloseButton={false}>
                    {dialogContent()}
                </DialogContent>
            </FormProvider>
        </Dialog>

    )
}

export default FormNewDataSet;