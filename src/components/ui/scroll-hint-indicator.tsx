import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export const ScrollHintIndicator = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000); // Disappears after 4 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-[bounce_1s_ease-in-out_infinite] pointer-events-none">
      <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <span className="font-medium text-sm">Questions</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
};
