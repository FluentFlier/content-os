import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#1A1714] rounded-[7px] px-3 py-2 text-[13px] font-['Space_Grotesk'] placeholder:text-[#8C857D] focus:outline-none focus:border-[rgba(26,23,20,0.40)] ${className}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';
export { Input };
