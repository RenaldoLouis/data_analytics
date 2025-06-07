'use client'

import { FileUpload } from "@/components/fileUpload"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { H3 } from "@/components/ui/typography"

const NewUpload = (props) => {
    const { handleSubmit, onSubmit, register, errors } = props

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