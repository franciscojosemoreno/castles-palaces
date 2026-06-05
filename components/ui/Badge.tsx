interface BadgeProps {
  label: string;
  variant?: 'default' | 'gold' | 'unesco' | 'type';
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles: Record<string, string> = {
    default: 'bg-stone-100 text-stone-700 border border-stone-200',
    gold: 'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30',
    unesco: 'bg-blue-50 text-blue-700 border border-blue-200',
    type: 'bg-[#1761a0]/5 text-[#1761a0] border border-[#1761a0]/15',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}
