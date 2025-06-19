
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyle = "font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle = "bg-sky-500 hover:bg-sky-600 focus:ring-sky-500 text-white";
  } else if (variant === 'secondary') {
    variantStyle = "bg-gray-600 hover:bg-gray-500 focus:ring-gray-500 text-gray-100";
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;