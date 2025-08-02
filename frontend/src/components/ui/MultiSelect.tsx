import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'
import { SelectOption } from '@/types'

export interface MultiSelectProps {
  options: SelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxDisplayed?: number
  searchable?: boolean
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className,
  maxDisplayed = 3,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const selectedOptions = options.filter(option => value.includes(option.value))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleRemoveOption = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onChange(value.filter(v => v !== optionValue))
  }

  const handleClearAll = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange([])
  }

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-gray-500">{placeholder}</span>
    }

    if (selectedOptions.length <= maxDisplayed) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-800 text-xs font-medium"
            >
              {option.label}
              <button
                onClick={(e) => handleRemoveOption(option.value, e)}
                className="ml-1 hover:text-primary-600"
                type="button"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-1">
        <span className="text-sm">
          {selectedOptions.length} selected
        </span>
        <button
          onClick={handleClearAll}
          className="text-gray-400 hover:text-gray-600"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full min-h-[2.5rem] px-3 py-2 text-left bg-white border border-gray-300 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'flex items-center justify-between'
        )}
      >
        <div className="flex-1 min-w-0">
          {displayText()}
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            'ml-2 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    disabled={option.disabled}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-sm text-left',
                      'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                      'disabled:text-gray-400 disabled:cursor-not-allowed',
                      isSelected && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check size={16} className="text-primary-600" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelect