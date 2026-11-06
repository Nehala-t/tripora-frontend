'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    verifyEmail,
    clearEmailVerificationState,
} from '@/redux/slices/emailVerificationSlice';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const dispatch = useAppDispatch();

    const { verifying, successMessage, error } = useAppSelector(
        (state) => state.emailVerification
    );

    const requestStarted = useRef(false);

    useEffect(() => {
        if (requestStarted.current) return;

        if (!token) {
            return;
        }

        requestStarted.current = true;
        void dispatch(verifyEmail({ token }));

        return () => {
            dispatch(clearEmailVerificationState());
        };
    }, [token, dispatch]);

    const status = !token
        ? 'error'
        : verifying
          ? 'loading'
          : successMessage
            ? 'success'
            : error
              ? 'error'
              : 'loading';

    const message = !token
        ? 'The verification link is invalid because its token is missing.'
        : status === 'loading'
          ? 'Verifying your email address...'
          : status === 'success'
            ? successMessage
            : error;

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-10">
                <div className="mb-6 flex justify-center">
                    {status === 'loading' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                            <FiLoader className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                            <FiCheckCircle className="h-10 w-10 text-emerald-600" />
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                            <FiXCircle className="h-10 w-10 text-red-600" />
                        </div>
                    )}
                </div>

                <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-blue-700">
                    <FiMail className="h-4 w-4" />
                    TRIPORA ACCOUNT VERIFICATION
                </div>

                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    {status === 'loading'
                        ? 'Verifying your email'
                        : status === 'success'
                          ? 'Email verified!'
                          : 'Verification failed'}
                </h1>

                <p
                    aria-live="polite"
                    className="mb-8 text-sm leading-6 text-slate-600"
                >
                    {message}
                </p>

                {status === 'success' ? (
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Continue to Login
                    </button>
                ) : status === 'error' ? (
                    <div className="space-y-3">
                        <Link
                            href="/resend-verification-email"
                            className="block w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Request a New Verification Email
                        </Link>

                        <Link
                            href="/login"
                            className="block rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">
                        Please keep this page open while we verify your email.
                    </p>
                )}
            </section>
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                    <div className="flex items-center gap-3 text-slate-600">
                        <FiLoader className="h-5 w-5 animate-spin" />
                        Loading verification page...
                    </div>
                </main>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
