'use client'

import checkMark from "@/assets/logo/checkmark.svg"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { H3 } from "@/components/ui/typography"
import Image from "next/image"

const WarningUpload = (props) => {
    const { setUploadDone } = props

    return (
        <div className="py-8">
            <DialogHeader className="items-center">
                <Image src={checkMark} alt="checkMark" />
                <DialogTitle className="">
                    <div className="px-6">
                        <H3>
                            Successfully Uploaded
                        </H3>
                    </div>
                </DialogTitle>
                <DialogDescription>
                    All done! Your data is safely uploaded.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-6 py-3">
                <DialogClose asChild>
                    <Button onClick={() => setUploadDone(null)} variant="outline" type="button" className="cursor-pointer">Close</Button>
                </DialogClose>
                <Button onClick={() => setUploadDone(null)} type="submit" className="cursor-pointer">Next</Button>
            </DialogFooter>
        </div>
    )
}

export default WarningUpload;