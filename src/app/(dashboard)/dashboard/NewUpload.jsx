'use client'

import NewUploadStep1 from "@/components/NewUpload/NewUploadStep1"
import NewUploadStep2 from "@/components/NewUpload/NewUploadStep2"
import NewUploadStep3 from "@/components/NewUpload/NewUploadStep3"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import Stepper from "@/components/ui/stepper"
import { H3 } from "@/components/ui/typography"
import { useState } from "react"
import { useFormContext } from "react-hook-form"

const totalSteps = 3

const NewUpload = (props) => {
    const { watch, setError } = useFormContext()

    const { handleSubmit, onSubmit, register, errors } = props
    const file = watch("file")
    const name = watch("name")

    const [currentStep, setCurrentStep] = useState(1); // Starting from step 1
    const [sheetList, setSheetList] = useState([])

    const goToNextStep = (e) => {
        e.preventDefault();   // stop the form from submitting
        if (currentStep === 1 && !file) {
            setError("file", {
                type: "manual",
                message: "Please upload a file before proceeding.",
            });
            return;
        } else if (currentStep === 1 && !name) {
            setError("name", {
                type: "manual",
                message: "Please input name for the dataset.",
            });
            return;
        } else {
            if (currentStep < totalSteps) {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const goToPreviousStep = (e) => {
        e.preventDefault();   // stop the form from submitting
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
                    setSheetList={setSheetList}
                />;
            case 2:
                return <NewUploadStep2 />;
            case 3:
                return <NewUploadStep3
                    sheetList={sheetList}
                />;
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
            </div>
            <DialogFooter className="px-6 py-3">
                {currentStep === 1 ? (
                    <DialogClose asChild>
                        <Button id="buttonDiscard" variant="outline" type="button" className="cursor-pointer">Discard</Button>
                    </DialogClose>
                ) : (
                    <Button id="buttonBack" type="button" className="cursor-pointer" onClick={goToPreviousStep}>Back</Button>

                )}
                {currentStep !== 3 ? (
                    <Button id="buttonNext" type="button" className="cursor-pointer" onClick={goToNextStep}>Next</Button>
                ) : (
                    <Button id="buttonSubmit" type="submit" className="cursor-pointer">Add</Button>
                )}
            </DialogFooter>
        </form>
    )
}

export default NewUpload;