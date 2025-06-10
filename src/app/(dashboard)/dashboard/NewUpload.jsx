'use client'

import { FileUpload } from "@/components/fileUpload"
import NewUploadStep1 from "@/components/NewUpload/NewUploadStep1"
import NewUploadStep2 from "@/components/NewUpload/NewUploadStep2"
import NewUploadStep3 from "@/components/NewUpload/NewUploadStep3"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Stepper from "@/components/ui/stepper"
import { H3 } from "@/components/ui/typography"
import { useState } from "react"

const NewUpload = (props) => {
    const { handleSubmit, onSubmit, register, errors } = props

    const [currentStep, setCurrentStep] = useState(1); // Starting from step 1

    const goToNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const NewUploadContent = () => {

        switch (currentStep) {
            case 1:
                return <NewUploadStep1
                    register={register}
                    errors={errors}
                />;
            case 2:
                return <NewUploadStep2 />;
            case 3:
                return <NewUploadStep3 />;
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
                <DialogTitle className="py-3">
                    <div className="px-6 p-3">
                        <H3>
                            New Data Set
                        </H3>
                    </div>
                    <Separator />
                </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 px-6">
                <Stepper
                    currentStep={currentStep}
                />
                {NewUploadContent()}
                {/* <>
                    <div className="grid gap-3">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...register("name", { required: "Name is required" })}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>
                    <FileUpload />
                </> */}
            </div>
            <DialogFooter className="px-6 py-3">
                <DialogClose asChild>
                    <Button variant="outline" type="button" className="cursor-pointer">Discard</Button>
                </DialogClose>
                <Button type="submit" className="cursor-pointer">Add</Button>
            </DialogFooter>
        </form>
    )
}

export default NewUpload;