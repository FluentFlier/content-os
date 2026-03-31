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
        className={`w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] text-[#FAFAFA] rounded-[7px] px-3 py-2 text-[13px] font-body placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] resize-none ${className}`}
        {...rest}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
