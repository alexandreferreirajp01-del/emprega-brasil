"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

const MobileSelect = ({ children, value, onValueChange, placeholder, label, ...props }) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleValueChange = (val) => {
    setSelectedValue(val)
    onValueChange?.(val)
    setOpen(false)
  }

  // Extract options from children
  const options = React.Children.toArray(children)
    .filter(child => child.type?.displayName === 'SelectItem')
    .map(child => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled
    }))

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] touch-feedback"
        >
          <span className={selectedValue ? '' : 'text-muted-foreground'}>
            {selectedLabel}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{label || 'Selecione uma opção'}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 max-h-[60vh] overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => !option.disabled && handleValueChange(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors min-h-[44px]",
                    "hover:bg-accent focus:bg-accent focus:outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-[0.98] touch-feedback",
                    selectedValue === option.value && "bg-accent"
                  )}
                >
                  <span>{option.label}</span>
                  {selectedValue === option.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  // Desktop: use normal Select
  return (
    <SelectPrimitive.Root value={selectedValue} onValueChange={handleValueChange} {...props}>
      {children}
    </SelectPrimitive.Root>
  )
}

export { MobileSelect }