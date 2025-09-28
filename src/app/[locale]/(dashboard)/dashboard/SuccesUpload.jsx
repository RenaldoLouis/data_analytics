'use client'

import checkMark from "@/assets/logo/checkmark.svg"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { H3 } from "@/components/ui/typography"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef } from "react"

const SuccessUpload = (props) => {
    const t = useTranslations("datasetpage");
    const closeRef = useRef(null)

    const router = useRouter();

    const { setUploadDone, emptyData } = props

    const handleClickNext = () => {
        closeRef.current?.click()
        // router.push(SideMenubarUrl.DataSets);
    }

    return (
        <div className=" content-center">
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
                    {t("dataUploadedSubtitle")} With total of {emptyData} empty data.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-6 py-3">
                <DialogClose asChild>
                    <Button className="w-full sm:flex-1" style={{ color: "#2168AB", fontWeight: "700" }} ref={closeRef} variant="outline" type="button">Close</Button>
                </DialogClose>
                {/* <Button onClick={handleClickNext} type="submit" className="cursor-pointer">Next</Button> */}
            </DialogFooter>
        </div>
    )
}

export default SuccessUpload;