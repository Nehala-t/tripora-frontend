'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    FiLock,
    FiEye,
    FiEyeOff,
    FiCheckCircle,
    FiAlertCircle,
    FiLoader,
    FiArrowLeft,
} from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    resetPassword,
    clearPasswordResetState,
} from '@/redux/slices/passwordResetSlice';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const dispatch = useAppDispatch();

    const { loading, successMessage, error } = useAppSelector(
        (state) => state.passwordReset
    );

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        dispatch(clearPasswordResetState());

        return () => {
            dispatch(clearPasswordResetState());
        };
    }, [dispatch]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setValidationError('');

        if (!token) {
            setValidationError(
                'Your password reset link is invalid. Please request a new link.'
            );
            return;
        }

        if (newPassword.length < 8) {
            setValidationError(
                'Your password must contain at least 8 characters.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setValidationError('Passwords do not match.');
            return;
        }

        await dispatch(
            resetPassword({
                token,
                newPassword,
                confirmPassword,
            })
        );
    };

    const displayError =
        validationError ||
        error ||
        (!token
            ? 'The password reset token is missing. Please request a new reset link.'
            : '');

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
                    <FiLock className="h-8 w-8 text-blue-600" />
                </div>

                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    Reset Your Password
                </h1>

                <p className="mb-7 text-sm leading-6 text-slate-600">
                    Create a new password for your Tripora account. Choose a
                    strong password that you have not used before.
                </p>

                {successMessage ? (
                    <div className="space-y-5">
                        <div
                            role="status"
                            className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
                        >
                            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>{successMessage}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Continue to Login
                        </button>
                    </div>
                ) : (
                    <>
                        {displayError && (
                            <div
                                role="alert"
                                className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm leading-5 text-red-700"
                            >
                                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                <p>{displayError}</p>
                            </div>
                        )}

                        {token && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        New Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            name="newPassword"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={newPassword}
                                            onChange={(event) => {
                                                setNewPassword(
                                                    event.target.value
                                                );
                                                setValidationError('');
                                                if (error || successMessage) {
                                                    dispatch(
                                                        clearPasswordResetState()
                                                    );
                                                }
                                            }}
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                            minLength={8}
                                            required
                                            disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-600"
                                        >
                                            {showPassword ? (
                                                <FiEyeOff className="h-5 w-5" />
                                            ) : (
                                                <FiEye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Use at least 8 characters.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Confirm New Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={confirmPassword}
                                            onChange={(event) => {
                                                setConfirmPassword(
                                                    event.target.value
                                                );
                                                setValidationError('');
                                            }}
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            required
                                            disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? 'Hide confirm password'
                                                    : 'Show confirm password'
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-600"
                                        >
                                            {showConfirmPassword ? (
                                                <FiEyeOff className="h-5 w-5" />
                                            ) : (
                                                <FiEye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <FiLoader className="h-5 w-5 animate-spin" />
                                            Resetting Password...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        )}
                    </>
                )}

                <p className="mt-6 text-center text-sm text-slate-500">
                    Remember your password?{' '}
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

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                    <div className="flex items-center gap-3 text-slate-600">
                        <FiLoader className="h-5 w-5 animate-spin" />
                        Loading reset password page...
                    </div>
                </main>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
