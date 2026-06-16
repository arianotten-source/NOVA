import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NovaAccordionProps {
  id: string;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function NovaAccordion({
  id,
  title,
  count,
  defaultOpen = false,
  children,
  className,
}: NovaAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn('nova-panel overflow-hidden', className)}>
      <button
        type="button"
        className="w-full flex items-center gap-2 min-h-[48px] px-4 py-3 text-left touch-manipulation"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((p) => !p)}
      >
        <ChevronRight
          className={cn('w-4 h-4 text-nova-cyan shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span className="text-sm font-semibold text-gray-100">{title}</span>
        {count != null ? (
          <span className="ml-auto text-xs text-nova-muted">({count})</span>
        ) : null}
      </button>
      {open ? (
        <div id={id} className="px-4 pb-4 pt-0 space-y-3 border-t border-nova-border/60">
          {children}
        </div>
      ) : null}
    </section>
  );
}
