import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={`px-4 py-2 rounded-lg transition ${className}`} {...props}>
      {children}
    </button>
  )
);
Button.displayName = 'Button';