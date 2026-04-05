import CalculatorHPP from "./calculatorHPP";
import PlCalculator from "../pl/PlCalculator";
import SkuList from "../sku/skuList";

export default async function Page({ params }) {
    const { id } = await params

    if (id === 'sku') return <SkuList />
    if (id === 'pl') return <PlCalculator />

    return <CalculatorHPP calculatorId={id} />
}