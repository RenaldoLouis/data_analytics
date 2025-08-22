
const LoadingScreen = (isGlobal = true) => {
    if (isGlobal)
        return (
            <div className="fixed inset-0 z-60 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                < div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" ></div >
            </div >
        )

    return (
        <>
            <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-sm"></div>
            <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </>
    )
}

export default LoadingScreen;