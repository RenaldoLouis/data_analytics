
const LoadingScreen = () => {

    return (
        <div className="absolute inset-0 z-10 bg-white/05 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
}

export default LoadingScreen;