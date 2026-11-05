'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    resendVerificationEmail,
    clearEmailVerificationState,
} from '@/redux/slices/emailVerificationSlice';
import {
    FiMail,
    FiArrowLeft,
    FiCheckCircle,
    FiAlertCircle,
    FiLoader,
} from 'react-icons/fi';

export default function ResendVerificationEmailPage() {
    const dispatch = useAppDispatch();

    const { loading, successMessage, error } = useAppSelector(
        (state) => state.emailVerification
    );

    const [email, setEmail] = useState('');
    const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

    useEffect(() => {
        return () => {
            dispatch(clearEmailVerificationState());
        };
    }, [dispatch]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmittedSuccessfully(false);

        const result = await dispatch(resendVerificationEmail({ email }));

        if (resendVerificationEmail.fulfilled.match(result)) {
            setSubmittedSuccessfully(true);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10">
                <Link
                    href="/login"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
                >
                    <FiArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    <FiMail className="h-8 w-8 text-blue-600" />
                </div>

                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    Resend Verification Email
                </h1>

                <p className="mb-7 text-sm leading-6 text-slate-600">
                    Enter the email address you used to register. We&apos;ll
                    send you a new verification link if your account needs
                    verification.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setSubmittedSuccessfully(false);
                                dispatch(clearEmailVerificationState());
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {(successMessage || error) && (
                        <div
                            role="status"
                            className={`flex items-start gap-3 rounded-xl p-4 text-sm leading-5 ${
                                submittedSuccessfully
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {submittedSuccessfully ? (
                                <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            ) : (
                                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            )}

                            <p>
                                {submittedSuccessfully ? successMessage : error}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <FiLoader className="h-5 w-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Verification Email'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already verified?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Sign in
                    </Link>
                </p>
            </section>
        </main>
    );
}
