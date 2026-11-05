'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiCompass,
    FiMail,
    FiLock,
    FiEye,
    FiEyeOff,
    FiArrowRight,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { loginUser } from '@/redux/slices/authSlice';
import { toast } from 'react-toastify';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password) {
            const message = 'Please fill in all required fields.';
            setError(message);
            toast.error(message);
            return;
        }

        setIsLoading(true);

        try {
            const user = await dispatch(
                loginUser({
                    email: email.trim().toLowerCase(),
                    password,
                })
            ).unwrap();

            const role = String(user?.role ?? '').toLowerCase();

            toast.success('Login successful!', {
                autoClose: 2000,
            });

            if (role === 'admin') {
                router.replace('/adminDashboard');
            } else if (role === 'operator') {
                router.replace('/operator/dashboard');
            } else if (role === 'user') {
                router.replace('/toures&activities');
            } else {
                setError(
                    'Unable to identify your account role. Please log in again.'
                );
            }
        } catch (err: unknown) {
            const message =
                typeof err === 'string'
                    ? err
                    : err instanceof Error
                      ? err.message
                      : 'Login failed. Please try again.';

            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-blue-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Tripora Logo */}
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 group"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:rotate-12 group-hover:bg-blue-700">
                        <FiCompass size={26} />
                    </span>

                    <span className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                        tripora<span className="text-blue-600">.</span>
                    </span>
                </Link>

                <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#0F172A]">
                    Welcome back
                </h2>

                <p className="mt-2 text-center text-sm text-gray-600">
                    Don&apos;t have an account yet?{' '}
                    <Link
                        href="/signUp"
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Sign up
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="bg-white py-8 px-6 shadow-xl shadow-blue-900/5 rounded-3xl border border-gray-100 sm:px-10">
                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() =>
                                toast.info(
                                    'Google login is not configured yet.'
                                )
                            }
                            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-2xl text-xs font-semibold text-[#0F172A] hover:bg-gray-50 transition-colors"
                        >
                            <FcGoogle size={18} /> Google
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                toast.info('Apple login is not configured yet.')
                            }
                            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-2xl text-xs font-semibold text-[#0F172A] hover:bg-gray-50 transition-colors"
                        >
                            <FaApple size={18} className="text-[#0F172A]" />
                            Apple
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>

                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-gray-400 font-medium">
                                Or log in with email
                            </span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100"
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                            >
                                Email Address
                            </label>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <FiMail size={17} />
                                </div>

                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-[#0F172A]"
                                >
                                    Password
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <FiLock size={17} />
                                </div>

                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <FiEyeOff size={17} />
                                    ) : (
                                        <FiEye size={17} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />

                                <label
                                    htmlFor="remember-me"
                                    className="ml-2 text-xs font-medium text-gray-600"
                                >
                                    Remember me for 30 days
                                </label>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Log In <FiArrowRight size={17} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
