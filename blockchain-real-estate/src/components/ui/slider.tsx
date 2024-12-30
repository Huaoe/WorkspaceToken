import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer",
          "range-slider:h-5 range-slider:w-5 range-slider:rounded-full range-slider:border-2 range-slider:border-primary range-slider:bg-background",
          "range-slider:transition-colors range-slider:focus:outline-none range-slider:focus:ring-2 range-slider:focus:ring-ring range-slider:focus:ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
