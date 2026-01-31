import * as React from "react"

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className = "" }: ProgressProps) {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className="h-full bg-blue-600 transition-all"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}
