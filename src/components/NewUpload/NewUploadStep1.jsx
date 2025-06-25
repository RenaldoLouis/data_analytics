

import { FileUpload } from "@/components/fileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NewUploadStep1 = (props) => {
    const { register, errors, setSheetList, setIsLoading, isLoading } = props;

    return (
        <div className="relative">
            {/* {isLoading && (
                <LoadingScreen />
            )} */}

            <div className={`grid gap-3 mb-3 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
            </div>

            <FileUpload setSheetList={setSheetList} setIsLoading={setIsLoading} />
        </div>
    );
};

export default NewUploadStep1;