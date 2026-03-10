import * as React from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/shared/utils"

interface TagsInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string[]
  onChange: (value: string[]) => void
}

export const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
  ({ className, value = [], onChange, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        const newTag = inputValue.trim()
        if (newTag && !value.includes(newTag)) {
          onChange([...value, newTag])
        }
        setInputValue("")
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        onChange(value.slice(0, -1))
      }
    }

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove))
    }

    return (
      <div className={cn("flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring", className)}>
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted"
            >
              <XIcon className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
        <input
          ref={ref}
          className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground min-w-[120px]"
          {...props}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    )
  }
)
TagsInput.displayName = "TagsInput"
