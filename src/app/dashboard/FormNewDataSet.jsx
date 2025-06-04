'use client'

import { FileUpload } from "@/components/fileUpload"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form"

const FormNewDataSet = () => {
    const methods = useForm({
        defaultValues: {
            name: "",
            file: null,
        },
    })

    const onSubmit = (data) => {
        console.log("Form submitted:", data)
    }

    return (
        <Dialog>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <DialogTrigger asChild>
                        <Button variant="link" className="cursor-pointer">Button</Button>
                    </DialogTrigger>
                    <DialogContent className="px-0">
                        <DialogHeader>
                            <DialogTitle className="px-6">
                                New Data Set
                                <Separator />
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 px-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" {...methods.register("name")} />
                            </div>
                            <FileUpload />
                        </div>
                        <DialogFooter className="px-6">
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </FormProvider>
        </Dialog>
    )
}

export default FormNewDataSet;