'use client'

import NewUploadStep1 from "@/components/NewUpload/NewUploadStep1"
import NewUploadStep2 from "@/components/NewUpload/NewUploadStep2"
import NewUploadStep3 from "@/components/NewUpload/NewUploadStep3"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import Stepper from "@/components/ui/stepper"
import { H3 } from "@/components/ui/typography"
import _ from 'lodash'
import { useState } from "react"
import { useFormContext } from "react-hook-form"

const totalSteps = 3

const NewUpload = (props) => {
    const { watch, setError, clearErrors } = useFormContext()

    const { handleSubmit, onSubmit, register, errors, isLoading, setIsLoading } = props
    const file = watch("file")
    const name = watch("name")
    // Watch fields from Step 2
    const dateFormat = watch("dateFormat")
    const timeFormat = watch("timeFormat")

    // Watch fields from Step 3
    const sheetSelection = watch("sheetSelection")

    const [currentStep, setCurrentStep] = useState(1); // Starting from step 1
    const [sheetList, setSheetList] = useState([])
    const [uploadProgress, setUploadProgress] = useState(0);

    const goToNextStep = (e) => {
        e.preventDefault();   // stop the form from submitting
        clearErrors(); // Clear previous errors before validating again

        // --- Step 1 Validation ---
        if (currentStep === 1) {
            if (!file) {
                setError("file", { type: "manual", message: "Please upload a file before proceeding." });
                return;
            }
            if (_.isEmpty(name)) {
                setError("name", { type: "manual", message: "Please input a name for the dataset." });
                return;
            }
        }

        // --- Step 2 Validation (NEW) ---
        else if (currentStep === 2) {
            if (!dateFormat) {
                setError("dateFormat", { type: "manual", message: "Please select a date format." });
                return;
            }
            if (!timeFormat) {
                setError("timeFormat", { type: "manual", message: "Please select a time format." });
                return;
            }
        }

        else if (currentStep === 3) {
            if (!sheetSelection) {
                setError("sheetSelection", { type: "manual", message: "Please select a sheet." });
                return;
            }
        }

        clearErrors();
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
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
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                    setUploadProgress={setUploadProgress}
                    uploadProgress={uploadProgress}
                />;
            case 2:
                return <NewUploadStep2 />;
            case 3:
                return <NewUploadStep3
                    sheetList={sheetList}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
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
                        <Button disabled={isLoading ? true : false} id="buttonDiscard" variant="outline" type="button" className="cursor-pointer">Discard</Button>
                    </DialogClose>
                ) : (
                    <Button disabled={isLoading ? true : false} id="buttonBack" type="button" className="cursor-pointer" onClick={goToPreviousStep}>Back</Button>

                )}
                {currentStep !== 3 ? (
                    <Button disabled={isLoading ? true : false} id="buttonNext" type="button" className="cursor-pointer" onClick={goToNextStep}>Next</Button>
                ) : (
                    <Button disabled={isLoading ? true : false} id="buttonSubmit" type="submit" className="cursor-pointer">Add</Button>
                )}
            </DialogFooter>
        </form>
    )
}

export default NewUpload;