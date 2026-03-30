'use client';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'pill';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default', className = '' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex gap-1 overflow-x-auto scrollbar-hide ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap px-4 py-[7px] text-[13px] font-['Space_Grotesk'] font-medium rounded-[20px] border-[0.5px] transition-all duration-100 shrink-0 ${
              activeTab === tab.id
                ? 'border-[#6366F1] text-[#6366F1] bg-[#EEF2FF]'
                : 'border-[rgba(26,23,20,0.12)] text-[#475569] hover:text-[#0F172A] bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 overflow-x-auto pb-[1px] scrollbar-hide border-b-[0.5px] border-[rgba(26,23,20,0.12)] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap px-4 py-2 font-['Space_Grotesk'] font-medium text-[13px] border-b-[1.5px] transition-colors duration-100 shrink-0 ${
            activeTab === tab.id
              ? 'border-[#0F172A] text-[#0F172A]'
              : 'border-transparent text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { Tab, TabsProps };
