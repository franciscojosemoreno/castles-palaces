'use client';

import { useState } from 'react';
import { FAQ } from '@/types';

interface CastleFAQProps {
  faqs: FAQ[];
}

export default function CastleFAQ({ faqs }: CastleFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => (
        <div key={index} className="border border-stone-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between gap-4 p-4 text-left bg-white hover:bg-stone-50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span className="font-medium text-[#1a1a1a] text-sm leading-snug">{faq.question}</span>
            <span className="text-[#c9a84c] text-lg flex-shrink-0">
              {openIndex === index ? '−' : '+'}
            </span>
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-stone-600 leading-relaxed bg-white border-t border-stone-100">
              <p className="pt-3">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
