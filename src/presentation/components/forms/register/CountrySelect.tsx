"use client";

import { useState, useEffect } from "react";
import { Country, countries, getDefaultCountry } from "@/data/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "../RegisterForm";
import { Globe } from "lucide-react";

interface CountrySelectProps {
  form: UseFormReturn<RegisterFormValues>;
  onCountryChange?: (country: Country) => void;
}

const CountrySelect = ({ form, onCountryChange }: CountrySelectProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    getDefaultCountry()
  );

  // Set the form country value on component initialization
  useEffect(() => {
    form.setValue("country", selectedCountry.name);
  }, []);

  const handleCountryChange = (value: string) => {
    const country = countries.find((c) => c.code === value);
    if (country) {
      setSelectedCountry(country);
      form.setValue("country", country.name);

      if (onCountryChange) {
        onCountryChange(country);
      }
    }
  };

  return (
    <FormField
      control={form.control}
      name="country"
      render={({ field }) => (
        <div className="relative">
          <Select
            onValueChange={handleCountryChange}
            defaultValue={selectedCountry.code}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez votre pays">
                <div className="flex items-center">
                  <span className="mr-2">{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                  <span className="ml-2 text-gray-500">
                    {selectedCountry.dialCode}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center">
                    <span className="mr-2">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-2 text-gray-500">
                      {country.dialCode}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Globe
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
      )}
    />
  );
};

export default CountrySelect;
