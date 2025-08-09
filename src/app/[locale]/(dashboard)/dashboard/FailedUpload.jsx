'use client'

import warning from "@/assets/logo/warning.svg"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { H3 } from "@/components/ui/typography"
import Image from "next/image"

const FailedUpload = (props) => {
    const { setUploadDone } = props

    return (
        <div className="py-8 content-center">
            <DialogHeader className="items-center">
                <Image src={warning} alt="warning" />
                <DialogTitle className="">
                    <div className="px-6">
                        <H3>
                            Upload Failed!
                        </H3>
                    </div>
                </DialogTitle>
                <DialogDescription>
                    Something went wrong when uploading, please try again.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-6 py-3">
                <DialogClose asChild>
                    <Button variant="outline" type="button" className="cursor-pointer">Close</Button>
                </DialogClose>
                {/* <Button type="submit" className="cursor-pointer">Next</Button> */}
            </DialogFooter>
        </div>
    )
}

export default FailedUpload;