

import { FileUpload } from "@/components/fileUpload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const NewUploadStep1 = (props) => {
    const { register, errors, setSheetList } = props
    return (
        <>
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
            <FileUpload setSheetList={setSheetList} />
        </>
    )
}

export default NewUploadStep1;