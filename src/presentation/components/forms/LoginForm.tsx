
import React from 'react';
import LoginFormContent from './login/LoginFormContent';

const LoginForm = ({ onClose }: { onClose?: () => void }) => {
  return <LoginFormContent onClose={onClose} />;
};

export default LoginForm;
