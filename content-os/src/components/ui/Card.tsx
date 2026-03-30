interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-[#FFFFFF] rounded-[12px] border-[0.5px] border-[rgba(26,23,20,0.12)] px-[14px] py-[13px] transition-colors duration-100 hover:border-[rgba(26,23,20,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}
