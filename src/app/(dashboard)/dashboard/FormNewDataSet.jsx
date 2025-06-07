'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UploadStatus } from "@/constant/UploadStatus"
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

    const onSubmit = (data) => {
        console.log("Form submitted:", data)
        // TO DO: juat uplaod file to backend
        // services.dataset.addNewDataSet("file").then((res) => {
        //     if (res.status === 200) {
        //         toast("Event has been created", {
        //             description: "Sunday, December 03, 2023 at 9:00 AM",
        //             action: {
        //                 label: "Undo",
        //                 onClick: () => console.log("Undo"),
        //             },
        //         })
        //     } else {
        //         throw new Error("Email sending failed with status " + res.status);
        //     }
        // })

        toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
            action: {
                label: "Undo",
                onClick: () => console.log("Undo"),
            },
        })

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