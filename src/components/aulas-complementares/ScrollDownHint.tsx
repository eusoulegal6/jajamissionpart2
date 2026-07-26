import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollDownHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      // Hide only when user is near the bottom of the page
      setVisible(scrolled < total - 200);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollBy({ top: window.innerHeight * 1.4, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Rolar para baixo"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-center rounded-full bg-sky-600 p-3 text-white shadow-xl animate-[bounce_1.6s_ease-in-out_infinite]">
        <ChevronDown className="h-6 w-6" />
      </div>
    </button>
  );
}
