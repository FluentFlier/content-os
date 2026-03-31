import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] text-[#FAFAFA] rounded-[7px] px-3 py-2 text-[13px] font-body placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] ${className}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';
export { Input };
