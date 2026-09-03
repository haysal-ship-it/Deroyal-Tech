import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  bgColor?: string;
  textColor?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
}

export function CustomDropdown({ options, value, onChange, placeholder = "Select...", className, dropdownClassName }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-full px-3 rounded-xl border border-[#E5E5E5] bg-white text-[14px] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] flex items-center justify-between transition-all hover:bg-gray-50",
          !selectedOption ? "text-[#A1A1AA]" : "text-[#1A1A1A]",
          isOpen ? "ring-2 ring-gray-100 border-gray-300" : ""
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
             <span className={cn(
                "flex-shrink-0 transition-colors",
                isOpen && selectedOption.iconColor ? selectedOption.iconColor : ""
             )}>
               {selectedOption.icon}
             </span>
          )}
          <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={16} className={cn("text-[#A1A1AA] flex-shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen && (
        <div className={cn("absolute z-50 top-full mt-2 w-full sm:min-w-[220px] bg-white rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-[#E5E5E5] p-2 animate-in fade-in slide-in-from-top-2 duration-200", dropdownClassName)}>
          <div className="flex flex-col gap-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors w-full text-left",
                    isSelected 
                      ? option.bgColor || "bg-[#FFF4ED]" 
                      : "hover:bg-gray-50 bg-transparent",
                    isSelected 
                      ? option.textColor || "text-[#F15F36]" 
                      : "text-[#4B5563]"
                  )}
                >
                  {option.icon && (
                    <span 
                      className={cn(
                        "flex-shrink-0 w-5 h-5 flex items-center justify-center", 
                         isSelected 
                           ? option.iconColor || "text-[#F15F36]" 
                           : "text-[#9CA3AF]"
                      )}
                    >
                      {option.icon}
                    </span>
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
