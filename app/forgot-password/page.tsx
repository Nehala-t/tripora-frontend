'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import {
    clearPasswordResetState,
    forgotPassword,
} from '../../redux/slices/passwordResetSlice';
import {
    FiArrowLeft,
    FiMail,
    FiCheckCircle,
    FiAlertCircle,
    FiSend,
    FiShield,
    FiKey,
} from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, successMessage, error } = useSelector(
        (state: RootState) => state.passwordReset
    );

    const [email, setEmail] = useState('');

    useEffect(() => {
        dispatch(clearPasswordResetState());
    }, [dispatch]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) return;

        await dispatch(forgotPassword({ email: normalizedEmail }));
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/80 px-4 py-12 font-sans text-slate-800">
            {/* Decorative ambient background blur objects */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative w-full max-w-md">
                {/* Back navigation button */}
                <div className="mb-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
                    >
                        <FiArrowLeft size={16} />
                        Back to login
                    </Link>
                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-blue-950/10 backdrop-blur-xl sm:p-10">
                    {/* Header Icon */}
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
                        <FiKey size={26} />
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        Forgot password?
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                        No worries! Enter the email address associated with your
                        account, and we&apos;ll send you a link to reset your
                        Tripora password.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                            >
                                Email address
                            </label>

                            <div className="relative flex items-center">
                                <FiMail
                                    className="absolute left-4 text-slate-400"
                                    size={18}
                                />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="you@example.com"
                                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/15"
                                />
                            </div>
                        </div>

                        {/* Success alert message */}
                        {successMessage && (
                            <div
                                role="status"
                                className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-900 backdrop-blur-md"
                            >
                                <FiCheckCircle
                                    className="mt-0.5 shrink-0 text-emerald-600"
                                    size={18}
                                />
                                <span className="leading-5">
                                    {successMessage}
                                </span>
                            </div>
                        )}

                        {/* Error alert message */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-xs font-semibold text-rose-900 backdrop-blur-md"
                            >
                                <FiAlertCircle
                                    className="mt-0.5 shrink-0 text-rose-600"
                                    size={18}
                                />
                                <span className="leading-5">{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Sending reset link...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Reset Link</span>
                                    <FiSend
                                        className="transition-transform group-hover:translate-x-1"
                                        size={16}
                                    />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Navigation */}
                    <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs font-medium text-slate-500">
                        Remembered your password?{' '}
                        <Link
                            href="/login"
                            className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                        >
                            Log in instead
                        </Link>
                    </div>
                </div>

                {/* Security badge footer */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                    <FiShield size={16} className="text-emerald-500" />
                    <span>Secure password recovery powered by Tripora</span>
                </div>
            </div>
        </main>
    );
}
