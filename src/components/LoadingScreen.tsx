
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set a timeout to hide the loading screen after content is presumed to be loaded
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500); // 1.5 seconds should be enough for initial load

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div className="w-24 h-auto mb-6 animate-scale-in">
        <img 
          src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png" 
          alt="Tutor Virtual" 
          className="w-full h-auto"
        />
      </div>
      
      <div className="flex items-center gap-2 text-[#6e6e80]">
        <Loader className="h-5 w-5 animate-spin" />
        <span className="text-base">Carregando...</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
