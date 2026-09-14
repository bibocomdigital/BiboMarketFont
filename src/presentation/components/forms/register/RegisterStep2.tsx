"use client";


import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { RegisterFormValues } from '../RegisterForm';
import CountrySelect from './CountrySelect';
import { UserRole, USER_ROLE_LABELS } from '@/types/user';
import { Country } from '@/data/countries';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// interface RegisterStep2Props {
//   form: UseFormReturn<RegisterFormValues>;
//   prevStep: () => void;
//   isSubmitting?: boolean;
//   onCountryChange: (country: Country) => void;
// }

// const RegisterStep2 = ({ form, prevStep, isSubmitting = false, onCountryChange }: RegisterStep2Props) => {
  
//   const handleCountrySelectChange = (country: Country) => {
//     if (onCountryChange) {
//       onCountryChange(country);
//     }
//   };

//   // Afficher la valeur du rôle pour le débogage
//   useEffect(() => {
//     const currentRole = form.getValues().role;
//     console.log('🔍 [REGISTER_STEP2] Current role value:', currentRole);
//   }, [form]);
  
//   return (
//     <>
//       <FormField
//         control={form.control}
//         name="role"
//         render={({ field }) => (
//           <FormItem className="space-y-3">
//             <FormLabel>Je m'inscris en tant que*</FormLabel>
//             <FormControl>
//               <RadioGroup
//                 onValueChange={(value) => {
//                   console.log('🔄 [REGISTER_STEP2] Role changed to:', value);
//                   field.onChange(value);
//                   form.setValue('role', value as UserRole);
//                 }}
//                 value={field.value}
//                 className="flex flex-col space-y-1"
//               >
//                 {Object.values(UserRole).map((role) => (
//                   <FormItem key={role} className="flex items-center space-x-3 space-y-0">
//                     <FormControl>
//                       <RadioGroupItem value={role} />
//                     </FormControl>
//                     <FormLabel className="font-normal cursor-pointer">
//                       {USER_ROLE_LABELS[role as UserRole]}
//                     </FormLabel>
//                   </FormItem>
//                 ))}
//               </RadioGroup>
//             </FormControl>
//             <div className="text-xs text-muted-foreground">
//               * Veuillez sélectionner un rôle pour continuer
//             </div>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
      
//       <CountrySelect form={form} onCountryChange={handleCountrySelectChange} />
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name="city"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Ville</FormLabel>
//               <FormControl>
//                 <div className="relative">
//                   <Input 
//                     placeholder="Votre ville" 
//                     {...field} 
//                   />
//                   <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//                 </div>
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="department"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Département</FormLabel>
//               <FormControl>
//                 <div className="relative">
//                   <Input 
//                     placeholder="Votre département" 
//                     {...field} 
//                   />
//                   <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//                 </div>
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>
//       <FormField
//         control={form.control}
//         name="commune"
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel>Commune</FormLabel>
//             <FormControl>
//               <div className="relative">
//                 <Input 
//                   placeholder="Votre commune" 
//                   {...field} 
//                 />
//                 <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//               </div>
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//       <div className="flex gap-4 pt-4">
//         <Button 
//           type="button" 
//           variant="outline" 
//           onClick={(e) => {
//             e.preventDefault(); // Empêcher le comportement par défaut
//             prevStep();
//           }} 
//           className="w-1/2"
//         >
//           Retour
//         </Button>
//         <Button 
//           type="submit" 
//           className="w-1/2 bg-bibocom-primary text-white"
//           disabled={isSubmitting || !form.getValues().role}
//         >
//           {isSubmitting ? 'Inscription en cours...' : 'S\'inscrire'}
//         </Button>
//       </div>
//     </>
//   );
// };

// export default RegisterStep2;
