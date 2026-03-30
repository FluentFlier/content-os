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
        className={`w-full bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#1A1714] rounded-[7px] px-3 py-2 text-[13px] font-['Space_Grotesk'] placeholder:text-[#8C857D] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none ${className}`}
        {...rest}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
