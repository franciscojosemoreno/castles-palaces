import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-6">Contact</h1>
      <p className="text-stone-600 mb-8">
        For editorial inquiries, partnership proposals, or corrections to our castle information, get in touch via Instagram DM or email.
      </p>
      <div className="space-y-4 text-sm text-stone-600">
        <p>
          <strong className="text-[#1761a0]">Instagram:</strong>{' '}
          <a href="https://instagram.com/castlespalaces" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:underline">
            @castlespalaces
          </a>
        </p>
        <p>
          <strong className="text-[#1761a0]">Corrections &amp; updates:</strong> If you spot outdated information about opening hours, prices or access, please let us know via Instagram DM.
        </p>
      </div>
    </div>
  );
}
