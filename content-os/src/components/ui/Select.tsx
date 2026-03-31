import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <select
        ref={ref}
        className={`bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] text-[#FAFAFA] rounded-[7px] px-3 py-2 text-[13px] font-body focus:outline-none focus:border-[rgba(255,255,255,0.40)] ${className}`}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
export { Select };
