import CalculatorHPP from "./calculatorHPP";

export default async function Page({ params }) {
    const { id } = await params

    return (
        <CalculatorHPP calculatorId={id} />
    );
}