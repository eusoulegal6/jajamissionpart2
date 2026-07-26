
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow, maxHeight = 200, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Combine the external ref with our internal ref
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);
    
    // Function to resize the textarea
    const resizeTextarea = React.useCallback(() => {
      if (autoGrow && textareaRef.current) {
        // Reset the height to auto so we can calculate the actual height
        textareaRef.current.style.height = 'auto';
        
        // Get the computed scroll height
        const scrollHeight = textareaRef.current.scrollHeight;
        
        // Set the height to either the scroll height or max height
        textareaRef.current.style.height = 
          `${Math.min(scrollHeight, maxHeight)}px`;
        
        // Set overflow to auto if content exceeds max height
        textareaRef.current.style.overflowY = 
          scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
    }, [autoGrow, maxHeight]);
    
    // Handle textarea change
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) onChange(e);
      resizeTextarea();
    }, [onChange, resizeTextarea]);
    
    // Resize on initial render
    React.useEffect(() => {
      resizeTextarea();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
          className
        )}
        ref={textareaRef}
        onChange={autoGrow ? handleChange : onChange}
        rows={1}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
