'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            setOpen,
          })
        }
        return child
      })}
    </div>
  )
}

const DropdownMenuTrigger = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
}) => {
  return (
    <button
      onClick={() => setOpen?.(!open)}
      className="inline-flex items-center"
    >
      {children}
    </button>
  )
}

const DropdownMenuContent = ({
  children,
  open,
  setOpen,
  className,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
  className?: string
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen?.(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        className
      )}
    >
      <div className="py-1" role="menu">
        {children}
      </div>
    </div>
  )
}

const DropdownMenuItem = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2",
        className
      )}
      role="menuitem"
    >
      {children}
    </button>
  )
}

const DropdownMenuSeparator = () => {
  return <div className="my-1 h-px bg-gray-200" />
}

const DropdownMenuLabel = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn("px-4 py-2 text-sm font-semibold text-gray-900", className)}
    >
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
