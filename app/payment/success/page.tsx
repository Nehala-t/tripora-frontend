'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    ArrowRight,
    CalendarCheck,
    ShieldCheck,
    Sparkles,
    CreditCard,
} from 'lucide-react';

import { useAppDispatch } from '@/lib/hooks';
import { verifyCheckoutSession } from '@/redux/slices/bookingSlice';

// ============================================
// PAYMENT SUCCESS CONTENT
// ============================================

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const sessionId = searchParams.get('session_id');

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState(
        'Verifying your payment securely...'
    );

    const verificationStarted = useRef(false);

    useEffect(() => {
        if (verificationStarted.current) return;

        verificationStarted.current = true;

        const verifyPayment = async () => {
            if (!sessionId) {
                setMessage('Payment session ID is missing.');
                setLoading(false);
                return;
            }

            try {
                const result = await dispatch(
                    verifyCheckoutSession(sessionId)
                ).unwrap();

                if (result.success && result.paymentStatus === 'paid') {
                    setSuccess(true);
                    setMessage('Your payment was successful!');
                } else {
                    setMessage(
                        result.message || 'Payment has not been confirmed yet.'
                    );
                }
            } catch (error: unknown) {
                console.error('Payment verification error:', error);

                setMessage(
                    typeof error === 'string'
                        ? error
                        : 'We could not verify your payment. Please check your bookings.'
                );
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [sessionId, dispatch]);

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
            {/* BACKGROUND DECORATION */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

            <div className="relative w-full max-w-lg">
                {/* BRAND */}
                <div className="mb-7 text-center">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>

                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                            Tripora
                            <span className="text-blue-600">.</span>
                        </span>
                    </Link>

                    <p className="mt-2 text-sm text-slate-500">
                        Your journey starts here
                    </p>
                </div>

                {/* MAIN CARD */}
                <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-blue-900/10">
                    {/* TOP SECTION */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-8 text-center text-white sm:px-10">
                        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[25px] border-white/10" />
                        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full border-[25px] border-white/10" />

                        <div className="relative">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                                {loading ? (
                                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                                ) : success ? (
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                ) : (
                                    <AlertCircle className="h-8 w-8 text-white" />
                                )}
                            </div>

                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                                Tripora Payments
                            </p>

                            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                {loading
                                    ? 'Verifying Payment'
                                    : success
                                      ? 'Payment Successful!'
                                      : 'Verification Pending'}
                            </h1>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-blue-100">
                                {loading
                                    ? 'Please wait while we securely verify your transaction.'
                                    : success
                                      ? 'Your payment has been received and verified successfully.'
                                      : "We couldn't confirm your payment yet. Please check your booking details."}
                            </p>
                        </div>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="px-6 py-8 sm:px-10">
                        {/* LOADING */}
                        {loading ? (
                            <div className="py-5 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>

                                <p className="mt-5 font-semibold text-slate-800">
                                    Processing your payment
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    {message}
                                </p>

                                <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
                                </div>

                                <p className="mt-4 text-xs text-slate-400">
                                    Please do not close this page.
                                </p>
                            </div>
                        ) : success ? (
                            <>
                                {/* SUCCESS DETAILS */}
                                <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                            <ShieldCheck className="h-5 w-5 text-green-600" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-green-800">
                                                Payment Verified
                                            </p>
                                            <p className="text-xs text-green-700">
                                                Transaction completed
                                            </p>
                                        </div>
                                    </div>

                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                        PAID
                                    </span>
                                </div>

                                {/* PAYMENT INFORMATION */}
                                <div className="mt-6">
                                    <h2 className="text-sm font-bold text-slate-800">
                                        Payment Information
                                    </h2>

                                    <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
                                        <div className="flex items-center justify-between py-4">
                                            <span className="flex items-center gap-2 text-sm text-slate-500">
                                                <CreditCard className="h-4 w-4" />
                                                Payment method
                                            </span>

                                            <span className="text-sm font-semibold text-slate-800">
                                                Stripe
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-4">
                                            <span className="text-sm text-slate-500">
                                                Payment status
                                            </span>

                                            <span className="text-sm font-semibold text-green-600">
                                                Successful
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-4">
                                            <span className="text-sm text-slate-500">
                                                Booking status
                                            </span>

                                            <span className="text-sm font-semibold text-amber-600">
                                                Pending confirmation
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BOOKING NOTICE */}
                                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                        <div>
                                            <p className="text-sm font-bold text-blue-900">
                                                Booking Created Successfully
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-blue-700">
                                                Your payment is complete. Your
                                                booking is now awaiting operator
                                                confirmation. You can track its
                                                status from your bookings page.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION */}
                                <Link
                                    href="/my-bookings"
                                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
                                >
                                    View My Bookings
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <Link
                                    href="/"
                                    className="mt-4 block text-center text-sm font-medium text-slate-500 transition hover:text-blue-600"
                                >
                                    Back to Home
                                </Link>

                                <p className="mt-6 text-center text-xs text-slate-400">
                                    Thank you for choosing Tripora. Have a
                                    wonderful journey!
                                </p>
                            </>
                        ) : (
                            <>
                                {/* PENDING / ERROR */}
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                                        <div>
                                            <p className="text-sm font-bold text-amber-900">
                                                Payment Not Verified
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/my-bookings"
                                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                                >
                                    Check My Bookings
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                                    If your payment was deducted, please check
                                    your booking status before attempting
                                    another payment.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <p className="mt-6 text-center text-xs text-slate-400">
                    Secure payments powered by Stripe
                </p>
            </div>
        </main>
    );
}

// ============================================
// PAGE
// ============================================

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </main>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    );
}
