"use client";

import { useEffect, useState } from "react";
import {
  FiX,
  FiMail,
  FiPhoneCall,
  FiMessageSquare,
  FiChevronDown,
  FiHelpCircle,
} from "react-icons/fi";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS = [
  {
    q: "How do I cancel or change my booking?",
    a: "Manage your reservation anytime under Profile > My Bookings. Free cancellation is available up to 24 hours before your trip starts.",
  },
  {
    q: "When will I receive my refund?",
    a: "Refunds are processed automatically and take 3–5 business days to appear in your account after cancellation.",
  },
  {
    q: "How do I contact my tour operator?",
    a: "Your tour voucher contains a direct chat link and phone number for your guide once your booking is confirmed.",
  },
];

export default function HelpSupportModal({
  isOpen,
  onClose,
}: HelpSupportModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      {/* MODAL CARD */}
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FiHelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Help &amp; Support
              </h2>
              <p className="text-xs font-medium text-slate-500">
                We&apos;re here to assist you
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* CONTACT CHANNELS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Live Chat */}
            <button
              type="button"
              onClick={() => alert("Connecting to chat support...")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <FiMessageSquare size={18} />
              </div>
              <span className="text-xs font-bold text-slate-900">Live Chat</span>
              <span className="text-[10px] font-medium text-slate-500">2 min response</span>
            </button>

            {/* Email */}
            <a
              href="mailto:support@tripora.com"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <FiMail size={18} />
              </div>
              <span className="text-xs font-bold text-slate-900">Email Us</span>
              <span className="text-[10px] font-medium text-slate-500 truncate max-w-[100px]">
                support@tripora.com
              </span>
            </a>

            {/* Call Support */}
            <a
              href="tel:+18005550199"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FiPhoneCall size={18} />
              </div>
              <span className="text-xs font-bold text-slate-900">Call Support</span>
              <span className="text-[10px] font-medium text-slate-500">
                +1 800 555-0199
              </span>
            </a>
          </div>

          {/* FAQS */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Common Questions
            </h3>

            <div className="space-y-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      <span>{faq.q}</span>
                      <FiChevronDown
                        size={16}
                        className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-indigo-600" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-right sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}