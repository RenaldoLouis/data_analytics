"use client"


const Stepper = (props) => {
    const { currentStep } = props

    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                {[1, 2, 3].map(step => (
                    <div
                        key={step}
                        className={`h-1.5 rounded-full ${step <= currentStep ? "bg-blue-400" : "bg-gray-300"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Stepper;
