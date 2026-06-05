import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-stone-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-stone-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#1761a0] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1a1a1a] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
