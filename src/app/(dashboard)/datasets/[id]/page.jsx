// import FormNewDataSet from "./FormNewDataSet"
import DataSetView from "./datasetView"

export default async function Page({ params }) {
    const { id } = await params

    return (
        <DataSetView datasetId={id} />
    );
}

