import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', rows = 4, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#0F172A] rounded-[7px] px-3 py-2 text-[13px] font-['Space_Grotesk'] placeholder:text-[#94A3B8] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none ${className}`}
        {...rest}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
