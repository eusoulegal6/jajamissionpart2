
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8 max-w-md animate-fade-in">
        <h1 className="text-6xl font-bold mb-8 text-[#202123]">404</h1>
        <p className="text-xl text-[#6e6e80] mb-10 leading-relaxed">
          Oops! We couldn't find the page you're looking for.
        </p>
        <a 
          href="/" 
          className="text-[#10a37f] hover:text-[#0e8e6d] transition-colors duration-200 underline text-lg py-2 px-4 rounded-lg hover:bg-[#f0f0f0]"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
