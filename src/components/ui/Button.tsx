interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300',
    secondary: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white disabled:border-gray-300 disabled:text-gray-300',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-700 disabled:text-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;