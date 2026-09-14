"use client";


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LoginForm from '@/components/forms/LoginForm';
import RegisterForm from '@/components/forms/RegisterForm';
import { UserRole } from '@/types/user';

type AuthModalProps = {
  type: 'login' | 'register';
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
};

const AuthModal: React.FC<AuthModalProps> = ({ type, isOpen, onClose, initialRole = UserRole.CLIENT }) => {
  console.log('🔄 [MODAL] AuthModal rendered with type:', type);
  console.log('👤 [MODAL] Initial role:', initialRole);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            {type === 'login' ? 'Connexion' : 'Inscription'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            {type === 'login' 
              ? 'Connectez-vous pour accéder à votre compte' 
              : initialRole === UserRole.MERCHANT 
                ? 'Inscrivez-vous en tant que commerçant pour créer votre boutique'
                : initialRole === UserRole.SUPPLIER
                  ? 'Inscrivez-vous en tant que fournisseur pour proposer vos services'
                  : 'Inscrivez-vous pour rejoindre notre marketplace'
            }
          </DialogDescription>
        </DialogHeader>
        
        {type === 'login' ? (
          <LoginForm onClose={onClose} />
        ) : (
          <RegisterForm onClose={onClose} initialRole={initialRole} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
