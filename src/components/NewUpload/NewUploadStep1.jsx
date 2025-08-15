

import { FileUpload } from "@/components/fileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

const NewUploadStep1 = (props) => {
    const { register, errors, setSheetList, setIsLoading, isLoading, setUploadProgress, uploadProgress } = props;
    const t = useTranslations("datasetpage");

    return (
        <div className="relative">
            {/* {isLoading && (
                <LoadingScreen />
            )} */}

            <div className={`grid gap-3 mb-3 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                <Label htmlFor="name">{t("datasetName")}</Label>
                <div>
                    <Input
                        id="name"
                        placeholder={t("datasetNamePlaceholder")}
                        {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                </div>
            </div>

            <FileUpload setSheetList={setSheetList} setIsLoading={setIsLoading} setUploadProgress={setUploadProgress} uploadProgress={uploadProgress} />
        </div>
    );
};

export default NewUploadStep1;