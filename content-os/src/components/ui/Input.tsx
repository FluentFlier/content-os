import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#0F172A] rounded-[7px] px-3 py-2 text-[13px] font-['Space_Grotesk'] placeholder:text-[#94A3B8] focus:outline-none focus:border-[rgba(26,23,20,0.40)] ${className}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';
export { Input };
