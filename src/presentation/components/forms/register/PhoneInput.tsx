"use client";


import { useState, useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ChevronDown, Phone } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { countries, Country, getDefaultCountry } from '@/data/countries';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  form: any;
  field?: { name?: string; value?: string; onChange?: (value: string) => void };
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
  className?: string;
}

function splitStoredPhone(value: string): { country: Country; local: string } | null {
  const trimmed = value.replace(/\s/g, "");
  const country = countries
    .filter((item) => trimmed.startsWith(item.dialCode))
    .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
  if (!country) return null;
  return { country, local: trimmed.slice(country.dialCode.length).replace(/\D/g, "") };
}

const PhoneInput = ({ 
  form, 
  field, 
  selectedCountry = getDefaultCountry(), 
  onCountryChange,
  className,
}: PhoneInputProps) => {
  const initial = field?.value ? splitStoredPhone(String(field.value)) : null;
  const [phoneWithoutCode, setPhoneWithoutCode] = useState(initial?.local ?? "");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<Country>(initial?.country ?? selectedCountry);

  // Update when selectedCountry prop changes
  useEffect(() => {
    if (selectedCountry) {
      setCurrentCountry(selectedCountry);
    }
  }, [selectedCountry]);

  // Initialize phone number from field value if it exists
  useEffect(() => {
    if (!field?.value || !String(field.value).includes("+")) return;
    const split = splitStoredPhone(String(field.value));
    if (!split) return;
    setCurrentCountry(split.country);
    setPhoneWithoutCode(split.local);
  }, [field?.value]);

  // Update when country changes
  useEffect(() => {
    if (!currentCountry) return;
    const stored = String(field?.value ?? "");
    if (!phoneWithoutCode && stored.length > currentCountry.dialCode.length) return;
    updateFullPhoneNumber(phoneWithoutCode);
  }, [currentCountry]);

  const updateFullPhoneNumber = (phoneNumber: string) => {
    const fullNumber = `${currentCountry.dialCode}${phoneNumber}`;
    field?.onChange?.(fullNumber);
    if (form?.setValue) {
      const fieldName = field?.name === 'login' ? 'login' : 'phoneNumber';
      form.setValue(fieldName, fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Garder seulement les chiffres
    setPhoneWithoutCode(value);
    updateFullPhoneNumber(value);
  };

  const handleCountrySelect = (country: Country) => {
    setCurrentCountry(country);
    setIsCountryDropdownOpen(false);
    if (onCountryChange) {
      onCountryChange(country);
    }
    updateFullPhoneNumber(phoneWithoutCode); // Mettre à jour avec le nouveau code pays
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setIsCountryDropdownOpen(false);
    };

    if (isCountryDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  return (
    <div className="relative">
      {/* Sélecteur de pays */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
        <div className="relative">
          <button
            type="button"
            className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2 py-1 transition-colors hover:bg-slate-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsCountryDropdownOpen(!isCountryDropdownOpen);
            }}
          >
            <span className="text-base">{currentCountry?.flag}</span>
            <span className="text-gray-600 text-sm font-medium">
              {currentCountry?.dialCode}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* Dropdown des pays */}
          {isCountryDropdownOpen && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 w-64 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-base">{country.flag}</span>
                  <span className="text-gray-600 text-sm font-medium">
                    {country.dialCode}
                  </span>
                  <span className="text-gray-700 text-sm flex-1">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Input 
        {...field}
        placeholder="Votre numéro de téléphone" 
        onChange={handlePhoneChange}
        value={phoneWithoutCode}
        className={cn("pl-32", className)}
        type="tel"
      />
      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
    </div>
  );
};


export default PhoneInput;
