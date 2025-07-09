'use client'

import checkMark from "@/assets/logo/checkmark.svg"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { H3 } from "@/components/ui/typography"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef } from "react"

const SuccessUpload = (props) => {
    const closeRef = useRef(null)

    const router = useRouter();

    const { setUploadDone } = props

    const handleClickNext = () => {
        closeRef.current?.click()
        // router.push(SideMenubarUrl.DataSets);
    }

    return (
        <div className="pt-8 pb-2 content-center">
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
                    <Button ref={closeRef} variant="outline" type="button" className="cursor-pointer">Close</Button>
                </DialogClose>
                {/* <Button onClick={handleClickNext} type="submit" className="cursor-pointer">Next</Button> */}
            </DialogFooter>
        </div>
    )
}

export default SuccessUpload;