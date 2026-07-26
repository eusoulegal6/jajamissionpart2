
import { BookOpen, Headphones, Video } from "lucide-react";

export const getLessonIcon = (description: string) => {
  // Check if the description is exactly "video" (case-insensitive)
  if (description.toLowerCase() === "video") {
    return Video;
  }
  
  // Check if the description contains "headphone" (case-insensitive)
  if (description.toLowerCase().includes("headphone")) {
    return Headphones;
  }
  
  // Default to book icon for all other lessons
  return BookOpen;
};
