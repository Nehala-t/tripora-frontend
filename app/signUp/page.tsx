'use client';
import { toast } from 'react-toastify';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiLock,
    FiEye,
    FiEyeOff,
    FiCheck,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import type { AppDispatch } from '@/redux/store';
import { signupUser } from '@/redux/slices/authSlice';
import {
    signupSchema,
    type SignupFormValues,
} from '@/validations/signupSchema';

type SignupRole = 'TRAVELER' | 'OPERATOR';

export default function SignUpPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [apiError, setApiError] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: yupResolver(signupSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'TRAVELER',
            city: '',
            businessName: '',
            agreeTerms: false,
        },
        mode: 'onTouched',
    });

    const role = watch('role');

    const changeRole = (newRole: SignupRole) => {
        setValue('role', newRole, {
            shouldValidate: true,
            shouldDirty: true,
        });

        clearErrors(['role', 'city', 'businessName']);
        setApiError('');
    };

    const onSubmit = async (values: SignupFormValues) => {
        setApiError('');

        try {
            const response = await dispatch(
                signupUser({
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    email: values.email.trim().toLowerCase(),
                    phone: values.phone?.trim() || '',
                    password: values.password,
                    role: values.role,
                    ...(values.role === 'OPERATOR'
                        ? {
                              city: values.city?.trim() || '',
                              businessName: values.businessName?.trim() || '',
                          }
                        : {}),
                })
            ).unwrap();

            toast.success(
                response.message ||
                    'Account created successfully. Please sign in to continue.'
            );

            // Redirect according to the selected role
            if (values.role === 'TRAVELER') {
                router.push('/destinations');
            }
            if (values.role === 'OPERATOR') {
                router.push('/operator/dashboard');
            } else {
                router.push('/login?registered=true');
            }
        } catch (error: unknown) {
            const message =
                typeof error === 'string'
                    ? error
                    : error instanceof Error
                      ? error.message
                      : 'Registration failed. Please try again.';

            setApiError(message);
        }
    };

    const inputClass =
        'w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

    const passwordInputClass =
        'w-full rounded-xl border border-gray-200 py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

    const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

    const errorClass = 'mt-1 text-xs text-red-600';

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl lg:grid-cols-2">
                    {/* Left introduction panel */}
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white lg:flex">
                        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
                        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/10" />

                        <div className="relative z-10">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2"
                            >
                                <span className="text-3xl font-extrabold tracking-tight">
                                    tripora
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                                    EXPLORE MORE
                                </span>
                            </Link>

                            <h1 className="mt-20 text-4xl font-bold leading-tight xl:text-5xl">
                                Your next
                                <br />
                                adventure
                                <br />
                                starts here.
                            </h1>

                            <p className="mt-6 max-w-sm text-base leading-7 text-blue-50">
                                Discover unforgettable experiences, explore new
                                destinations, and create memories that last a
                                lifetime.
                            </p>
                        </div>

                        <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                            <p className="text-lg font-semibold">
                                One account. Endless experiences.
                            </p>
                            <p className="mt-2 text-sm leading-6 text-blue-50">
                                Join Tripora as a traveler or become a tour
                                operator and share your experiences with the
                                world.
                            </p>
                        </div>
                    </section>

                    {/* Signup form */}
                    <section className="w-full p-6 sm:p-10 lg:p-12">
                        <div className="mb-8 lg:hidden">
                            <Link
                                href="/"
                                className="text-3xl font-extrabold tracking-tight text-blue-700"
                            >
                                tripora
                            </Link>
                        </div>

                        <div className="mb-7">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                                Create your account
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Join Tripora and start exploring.
                            </p>
                        </div>

                        {/* Account type */}
                        <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => changeRole('TRAVELER')}
                                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                                    role === 'TRAVELER'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Traveler
                            </button>

                            <button
                                type="button"
                                onClick={() => changeRole('OPERATOR')}
                                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                                    role === 'OPERATOR'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Tour Operator
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="space-y-4"
                        >
                            {/* First name */}
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className={labelClass}
                                >
                                    First Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="firstName"
                                        autoComplete="given-name"
                                        placeholder="Enter your first name"
                                        {...register('firstName')}
                                        aria-invalid={!!errors.firstName}
                                        className={inputClass}
                                    />
                                </div>
                                {errors.firstName && (
                                    <p className={errorClass}>
                                        {errors.firstName.message}
                                    </p>
                                )}
                            </div>

                            {/* Last name */}
                            <div>
                                <label
                                    htmlFor="lastName"
                                    className={labelClass}
                                >
                                    Last Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="lastName"
                                        autoComplete="family-name"
                                        placeholder="Enter your last name"
                                        {...register('lastName')}
                                        aria-invalid={!!errors.lastName}
                                        className={inputClass}
                                    />
                                </div>
                                {errors.lastName && (
                                    <p className={errorClass}>
                                        {errors.lastName.message}
                                    </p>
                                )}
                            </div>

                            {/* Business name */}
                            {role === 'OPERATOR' && (
                                <div>
                                    <label
                                        htmlFor="businessName"
                                        className={labelClass}
                                    >
                                        Company / Tour Agency Name{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="businessName"
                                            placeholder="Enter your agency name"
                                            {...register('businessName')}
                                            aria-invalid={!!errors.businessName}
                                            className={inputClass}
                                        />
                                    </div>
                                    {errors.businessName && (
                                        <p className={errorClass}>
                                            {errors.businessName.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className={labelClass}>
                                    Email Address{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        {...register('email')}
                                        aria-invalid={!!errors.email}
                                        className={inputClass}
                                    />
                                </div>
                                {errors.email && (
                                    <p className={errorClass}>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className={labelClass}>
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="Enter your phone number"
                                        {...register('phone')}
                                        aria-invalid={!!errors.phone}
                                        className={inputClass}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className={errorClass}>
                                        {errors.phone.message}
                                    </p>
                                )}
                            </div>

                            {/* Operator city */}
                            {role === 'OPERATOR' && (
                                <div>
                                    <label
                                        htmlFor="city"
                                        className={labelClass}
                                    >
                                        Operating City / Destination{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="city"
                                            placeholder="e.g. Kozhikode, Kerala"
                                            {...register('city')}
                                            aria-invalid={!!errors.city}
                                            className={inputClass}
                                        />
                                    </div>
                                    {errors.city && (
                                        <p className={errorClass}>
                                            {errors.city.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className={labelClass}
                                >
                                    Password{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="new-password"
                                        placeholder="Minimum 8 characters"
                                        {...register('password')}
                                        aria-invalid={!!errors.password}
                                        className={passwordInputClass}
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
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <FiEyeOff />
                                        ) : (
                                            <FiEye />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className={errorClass}>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className={labelClass}
                                >
                                    Confirm Password{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        autoComplete="new-password"
                                        placeholder="Re-enter your password"
                                        {...register('confirmPassword')}
                                        aria-invalid={!!errors.confirmPassword}
                                        className={passwordInputClass}
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
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? (
                                            <FiEyeOff />
                                        ) : (
                                            <FiEye />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className={errorClass}>
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Terms and conditions */}
                            <div className="pt-1">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        {...register('agreeTerms')}
                                        className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
                                    />
                                    <span className="text-sm leading-5 text-gray-600">
                                        I agree to the{' '}
                                        <Link
                                            href="/terms"
                                            className="font-medium text-blue-700 hover:underline"
                                        >
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link
                                            href="/privacy"
                                            className="font-medium text-blue-700 hover:underline"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </span>
                                </label>
                                {errors.agreeTerms && (
                                    <p className={errorClass}>
                                        {errors.agreeTerms.message}
                                    </p>
                                )}
                            </div>

                            {/* Backend API error */}
                            {apiError && (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className="font-bold"
                                            aria-hidden="true"
                                        >
                                            !
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            {apiError
                                                .split('\n')
                                                .map((message, index) => (
                                                    <p
                                                        key={`${index}-${message}`}
                                                    >
                                                        {message}
                                                    </p>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? 'Creating your account...'
                                    : role === 'OPERATOR'
                                      ? 'Create Operator Account'
                                      : 'Create Account'}
                            </button>
                        </form>

                        {/* Social signup placeholders */}
                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs text-gray-400">
                                OR CONTINUE WITH
                            </span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setApiError(
                                        'Google signup is not configured yet.'
                                    )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                <FcGoogle size={20} />
                                Google
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setApiError(
                                        'Apple signup is not configured yet.'
                                    )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                <FaApple size={19} />
                                Apple
                            </button>
                        </div>

                        <p className="mt-7 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
