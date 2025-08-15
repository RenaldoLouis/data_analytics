'use client'

import checkMark from "@/assets/logo/checkmark.svg"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { H3 } from "@/components/ui/typography"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { useTranslations } from "next-intl"

const SuccessUpload = (props) => {
    const t = useTranslations("datasetpage");
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
                            {t("datasetUploadedTitle")}
                        </H3>
                    </div>
                </DialogTitle>
                <DialogDescription>
                    {t("dataUploadedSubtitle")}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-6 py-3">
                <DialogClose asChild>
                    <Button className="w-full sm:flex-1" ref={closeRef} variant="outline" type="button">Close</Button>
                </DialogClose>
                {/* <Button onClick={handleClickNext} type="submit" className="cursor-pointer">Next</Button> */}
            </DialogFooter>
        </div>
    )
}

export default SuccessUpload;