'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiCompass, FiHelpCircle, FiArrowLeft } from 'react-icons/fi';
import HelpSupportModal from '@/components/HelpSupportModal';

export default function HelpPage() {
    // Modal is visible by default when navigating to this page
    const [isHelpOpen, setIsHelpOpen] = useState(true);

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pt-28 pb-20 font-sans">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
                {/* BACK TO HOME LINK */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                >
                    <FiArrowLeft size={14} />
                    Back to Home
                </Link>

                {/* HERO HEADER */}
                <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                        <FiCompass size={28} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
                        Tripora Support Center
                    </h1>
                    <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                        Find answers to common questions or connect directly
                        with our 24/7 customer care team.
                    </p>
                </div>

                {/* RE-OPEN BUTTON IF MODAL IS CLOSED */}
                {!isHelpOpen && (
                    <button
                        type="button"
                        onClick={() => setIsHelpOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
                    >
                        <FiHelpCircle size={18} />
                        Open Help &amp; Support Modal
                    </button>
                )}
            </div>

            {/* AUTOMATICALLY DISPLAYED MODAL */}
            <HelpSupportModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </main>
    );
}
