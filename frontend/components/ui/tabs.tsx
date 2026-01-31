import * as React from "react"

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<{
  value: string
  setValue: (value: string) => void
}>({
  value: "",
  setValue: () => {},
})

export function Tabs({ defaultValue, children, className = "" }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
  const { value: selectedValue, setValue } = React.useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <button
      onClick={() => setValue(value)}
      className={`px-4 py-2 font-medium transition-colors ${
        isSelected
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-600 hover:text-gray-900"
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext)

  if (selectedValue !== value) return null

  return <div className={`mt-4 ${className}`}>{children}</div>
}
