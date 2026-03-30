import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <select
        ref={ref}
        className={`bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#0F172A] rounded-[7px] px-3 py-2 text-[13px] font-['Space_Grotesk'] focus:outline-none focus:border-[rgba(26,23,20,0.40)] ${className}`}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
export { Select };
