import CalculatorHPP from "./calculatorHPP";
import SkuList from "../sku/skuList";

export default async function Page({ params }) {
    const { id } = await params

    if (id === 'sku') {
        return <SkuList />
    }

    return (
        <CalculatorHPP calculatorId={id} />
    );
}