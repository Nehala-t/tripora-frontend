'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { AppDispatch, RootState } from '@/redux/store';
import { toast } from 'react-toastify';

import {
    fetchUserProfile,
    updateUserProfile,
    updateTravelPreferences,
    uploadProfileAvatar,
    updateOperatorBusinessDetails,
    clearProfileError,
    clearProfileSuccessMessage,
    fetchOperatorProfile,
} from '@/redux/slices/profileSlice';

import {
    profileSchema,
    travelPreferencesSchema,
    operatorSchema,
    type ProfileFormValues,
    type TravelPreferencesFormValues,
    type OperatorFormValues,
} from '@/validations/profileSchema';

import {
    Camera,
    User,
    Compass,
    Building2,
    ShieldCheck,
    Globe,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Mail,
    Phone,
    X,
    Shield,
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

type PreferredCurrency = TravelPreferencesFormValues['preferredCurrency'];

type TravelStyle = TravelPreferencesFormValues['travelStyle'];

type TravelInterest = TravelPreferencesFormValues['travelInterests'][number];

type TravelBudget = TravelPreferencesFormValues['budget'];

const TRAVEL_STYLES = [
    'adventure',
    'relaxation',
    'luxury',
    'budget',
    'cultural',
    'family',
    'solo',
] as const satisfies readonly TravelStyle[];

const TRAVEL_INTERESTS = [
    'adventure',
    'culture',
    'food',
    'nature',
    'sightseeing',
    'water_sports',
    'wildlife',
    'wellness',
] as const satisfies readonly TravelInterest[];

const CURRENCIES = [
    'INR',
    'USD',
    'EUR',
    'GBP',
    'AED',
] as const satisfies readonly PreferredCurrency[];

const TRAVEL_BUDGETS = [
    'Low',
    'Medium',
    'High',
] as const satisfies readonly TravelBudget[];

const isCurrency = (value: string): value is PreferredCurrency =>
    CURRENCIES.some((currency) => currency === value);

const isTravelStyle = (value: string): value is TravelStyle =>
    TRAVEL_STYLES.some((style) => style === value);

const isTravelInterest = (value: string): value is TravelInterest =>
    TRAVEL_INTERESTS.some((interest) => interest === value);

const isTravelBudget = (value: string): value is TravelBudget =>
    TRAVEL_BUDGETS.some((budget) => budget === value);

const INPUT_CLASS =
    'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-teal-500';

type ProfileTab = 'overview' | 'edit' | 'preferences' | 'operator';

// ============================================
// REUSABLE FIELD ERROR
// ============================================

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p role="alert" className="mt-1 text-sm text-red-400">
            {message}
        </p>
    );
}

// ============================================
// PROFILE PAGE
// ============================================

export default function ProfilePage() {
    const dispatch = useDispatch<AppDispatch>();

    const {
        profile,
        loading,
        updating,
        uploadingAvatar,
        error,
        successMessage,
    } = useSelector((state: RootState) => state.profile);

    const { user: authUser } = useSelector((state: RootState) => state.auth);

    // Prefer the latest profile returned by the profile API.
    const currentUser = profile ?? authUser;

    // Always use the authenticated user's role.
    // This prevents an old profile response from showing the wrong role.
    const userRole = authUser?.role ?? currentUser?.role;

    // ============================================
    // ROLE-BASED CONDITIONS
    // ============================================

    const isTraveler = userRole === 'user';
    const isOperator = userRole === 'operator';
    const isAdmin = userRole === 'admin';

    const roleLabel = isTraveler
        ? 'Traveler'
        : isOperator
          ? 'Operator'
          : isAdmin
            ? 'Administrator'
            : 'User';

    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    const [newDestinationInput, setNewDestinationInput] = useState('');

    // ============================================
    // ROLE-BASED TABS
    // ============================================

    const profileTabs = [
        {
            id: 'overview' as ProfileTab,
            label: 'Overview',
            icon: User,
        },
        {
            id: 'edit' as ProfileTab,
            label: 'Edit Profile',
            icon: Sparkles,
        },
        ...(isTraveler
            ? [
                  {
                      id: 'preferences' as ProfileTab,
                      label: 'Travel Preferences',
                      icon: Compass,
                  },
              ]
            : []),
        ...(isOperator
            ? [
                  {
                      id: 'operator' as ProfileTab,
                      label: 'Business Details',
                      icon: Building2,
                  },
              ]
            : []),
    ];

    // Reset to Overview if the logged-in user's role changes.
    useEffect(() => {
        setActiveTab('overview');
    }, [userRole]);

    // ============================================
    // FETCH ROLE-BASED PROFILE
    // ============================================

    useEffect(() => {
        if (!authUser) return;

        if (authUser.role === 'operator') {
            void dispatch(fetchOperatorProfile());
        } else {
            void dispatch(fetchUserProfile());
        }
    }, [authUser?.role, dispatch]);

    // ============================================
    // PERSONAL PROFILE FORM
    // ============================================

    const {
        register: registerProfile,
        handleSubmit: handleProfileFormSubmit,
        reset: resetProfile,
        formState: { errors: profileErrors },
    } = useForm<ProfileFormValues>({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            bio: '',
            country: '',
            city: '',
        },
        mode: 'onBlur',
    });

    // ============================================
    // TRAVEL PREFERENCES FORM
    // ============================================

    const {
        register: registerPreferences,
        handleSubmit: handlePreferencesFormSubmit,
        reset: resetPreferences,
        watch: watchPreferences,
        setValue: setPreferenceValue,
        formState: { errors: preferenceErrors },
    } = useForm<TravelPreferencesFormValues>({
        resolver: yupResolver(travelPreferencesSchema),
        defaultValues: {
            preferredLanguage: 'en',
            preferredCurrency: 'INR',
            preferredDestinations: [],
            travelStyle: 'adventure',
            budget: 'Medium',
            travelInterests: [],
        },
        mode: 'onBlur',
    });

    const selectedCurrency = watchPreferences('preferredCurrency');
    const selectedStyle = watchPreferences('travelStyle');
    const selectedBudget = watchPreferences('budget');
    const selectedInterests = watchPreferences('travelInterests') || [];
    const selectedDestinations =
        watchPreferences('preferredDestinations') || [];

    // ============================================
    // OPERATOR BUSINESS FORM
    // ============================================

    const {
        register: registerOperator,
        handleSubmit: handleOperatorFormSubmit,
        reset: resetOperator,
        formState: { errors: operatorErrors },
    } = useForm<OperatorFormValues>({
        resolver: yupResolver(operatorSchema),
        defaultValues: {
            businessName: '',
            businessDescription: '',
            businessEmail: '',
            businessPhone: '',
            website: '',
            businessAddress: '',
        },
        mode: 'onBlur',
    });

    // ============================================
    // POPULATE FORMS
    // ============================================

    useEffect(() => {
        if (!currentUser) return;

        resetProfile({
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            phone: currentUser.phone || '',
            bio: currentUser.bio || '',
            country: currentUser.country || '',
            city: currentUser.city || '',
        });

        resetPreferences({
            preferredLanguage: currentUser.preferredLanguage || 'en',

            preferredCurrency:
                typeof currentUser.preferredCurrency === 'string' &&
                isCurrency(currentUser.preferredCurrency)
                    ? currentUser.preferredCurrency
                    : 'INR',

            preferredDestinations: currentUser.preferredDestinations || [],

            travelStyle:
                typeof currentUser.travelStyle === 'string' &&
                isTravelStyle(currentUser.travelStyle)
                    ? currentUser.travelStyle
                    : 'adventure',

            budget:
                typeof currentUser.budget === 'string' &&
                isTravelBudget(currentUser.budget)
                    ? currentUser.budget
                    : 'Medium',

            travelInterests: (currentUser.travelInterests || []).filter(
                (interest): interest is TravelInterest =>
                    isTravelInterest(interest)
            ),
        });

        resetOperator({
            businessName: currentUser.operatorProfile?.businessName || '',
            businessDescription:
                currentUser.operatorProfile?.businessDescription || '',
            businessEmail: currentUser.operatorProfile?.businessEmail || '',
            businessPhone: currentUser.operatorProfile?.businessPhone || '',
            website: currentUser.operatorProfile?.website || '',
            businessAddress: currentUser.operatorProfile?.businessAddress || '',
        });
    }, [currentUser, resetProfile, resetPreferences, resetOperator]);

    // ============================================
    // SUBMIT PERSONAL PROFILE
    // ============================================

    const handleProfileSubmit = async (values: ProfileFormValues) => {
        try {
            await dispatch(updateUserProfile(values)).unwrap();

            toast.success('Profile updated successfully!');

            // Navigate to Overview after successful update.
            setActiveTab('overview');
        } catch (error) {
            toast.error(
                typeof error === 'string'
                    ? error
                    : 'Failed to update profile. Please try again.'
            );
        }
    };

    // ============================================
    // UPLOAD PROFILE AVATAR
    // ============================================

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const input = e.currentTarget;
        const file = input.files?.[0];

        // Allow selecting the same file again.
        input.value = '';

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            window.alert('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            window.alert('Please select an image smaller than 5 MB.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('profileImage', file);

        try {
            await dispatch(uploadProfileAvatar(uploadData)).unwrap();

            if (authUser?.role === 'operator') {
                await dispatch(fetchOperatorProfile()).unwrap();
            } else {
                await dispatch(fetchUserProfile()).unwrap();
            }
        } catch (err) {
            console.error('Profile image upload failed:', err);
        }
    };

    // ============================================
    // SUBMIT TRAVEL PREFERENCES
    // ============================================

    const handlePreferencesSubmit = async (
        values: TravelPreferencesFormValues
    ) => {
        try {
            await dispatch(updateTravelPreferences(values)).unwrap();
        } catch (err) {
            console.error('Travel preferences update failed:', err);
        }
    };

    // ============================================
    // SUBMIT OPERATOR BUSINESS DETAILS
    // ============================================

    const handleOperatorSubmit = async (values: OperatorFormValues) => {
        try {
            await dispatch(
                updateOperatorBusinessDetails({
                    businessName: String(values.businessName ?? ''),
                    businessDescription: String(
                        values.businessDescription ?? ''
                    ),
                    businessEmail: String(values.businessEmail ?? ''),
                    businessPhone: String(values.businessPhone ?? ''),
                    website: String(values.website ?? ''),
                    businessAddress: String(values.businessAddress ?? ''),
                })
            ).unwrap();

            // Fetch the latest saved operator profile.
            await dispatch(fetchOperatorProfile()).unwrap();

            toast.success('Business details updated successfully!');
        } catch (error: unknown) {
            toast.error(
                typeof error === 'string'
                    ? error
                    : 'Failed to update business details.'
            );
        }
    };

    // ============================================
    // TRAVEL INTERESTS
    // ============================================

    const toggleInterest = (interest: TravelInterest) => {
        const updated: TravelInterest[] = selectedInterests.includes(interest)
            ? selectedInterests.filter((item) => item !== interest)
            : [...selectedInterests, interest];

        setPreferenceValue('travelInterests', updated, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    // ============================================
    // PREFERRED DESTINATIONS
    // ============================================

    const handleAddDestination = () => {
        const destination = newDestinationInput.trim();

        if (!destination) return;

        const alreadyExists = selectedDestinations.some(
            (item) => item.toLowerCase() === destination.toLowerCase()
        );

        if (!alreadyExists) {
            setPreferenceValue(
                'preferredDestinations',
                [...selectedDestinations, destination],
                {
                    shouldDirty: true,
                    shouldValidate: true,
                }
            );
        }

        setNewDestinationInput('');
    };

    const handleRemoveDestination = (destination: string) => {
        setPreferenceValue(
            'preferredDestinations',
            selectedDestinations.filter((item) => item !== destination),
            {
                shouldDirty: true,
                shouldValidate: true,
            }
        );
    };

    // ============================================
    // LOADING STATE
    // ============================================

    if (loading && !currentUser) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-teal-400" />
                <p className="text-slate-400">
                    Loading your Tripora profile...
                </p>
            </div>
        );
    }

    // ============================================
    // PROFILE DISPLAY DATA
    // ============================================

    const fullName =
        currentUser?.fullName ||
        `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
        roleLabel;

    const avatarUrl = currentUser?.profileImage?.url;

    const operatorProfile = currentUser?.operatorProfile;

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* ALERT BANNERS */}

                {error && (
                    <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            aria-label="Dismiss error"
                            onClick={() => dispatch(clearProfileError())}
                            className="hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div
                        role="status"
                        className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <span>{successMessage}</span>
                        </div>

                        <button
                            type="button"
                            aria-label="Dismiss success message"
                            onClick={() =>
                                dispatch(clearProfileSuccessMessage())
                            }
                            className="hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* PROFILE HEADER */}

                <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-md">
                    <div className="relative h-44 bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700">
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="relative px-6 pb-6 pt-0">
                        <div className="-mt-16 mb-6 flex flex-col justify-between gap-4 sm:-mt-20 sm:flex-row sm:items-end">
                            {/* PROFILE AVATAR */}

                            <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-slate-950 bg-slate-800 shadow-xl">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`${fullName}'s profile`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-500 to-indigo-600">
                                        <User className="h-14 w-14 text-white" />
                                    </div>
                                )}

                                <label
                                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 text-xs text-white transition-opacity ${
                                        uploadingAvatar
                                            ? 'cursor-wait opacity-100'
                                            : 'cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                                    }`}
                                >
                                    {uploadingAvatar ? (
                                        <>
                                            <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="h-6 w-6" />
                                            <span>Change Photo</span>
                                        </>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        onChange={handleAvatarChange}
                                        disabled={uploadingAvatar}
                                        className="sr-only"
                                        aria-label="Upload profile picture"
                                    />
                                </label>
                            </div>

                            {/* PROFILE DETAILS */}

                            <div className="flex-1 sm:pl-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                        {fullName}
                                    </h1>

                                    {currentUser?.emailVerified && (
                                        <span className="flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-400">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Email Verified
                                        </span>
                                    )}

                                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium uppercase text-slate-300">
                                        {roleLabel}
                                    </span>
                                </div>

                                <p className="mt-1 text-sm text-slate-400">
                                    {currentUser?.city
                                        ? `${currentUser.city}, `
                                        : ''}
                                    {currentUser?.country || ''}
                                </p>

                                <p className="mt-1 break-all text-sm text-slate-500">
                                    {currentUser?.email}
                                </p>
                            </div>
                        </div>

                        {/* ROLE-BASED TABS */}

                        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pt-2 text-sm font-medium">
                            {profileTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 transition-all ${
                                            isActive
                                                ? 'rounded-t-lg border-teal-400 bg-teal-500/5 text-teal-400'
                                                : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* OVERVIEW TAB */}

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* LEFT COLUMN */}

                        <div className="space-y-6 md:col-span-2">
                            {/* ABOUT ME */}

                            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                                <h2 className="mb-3 text-lg font-semibold text-white">
                                    About Me
                                </h2>

                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                                    {currentUser?.bio ||
                                        'No bio added yet. Tell the Tripora community about yourself!'}
                                </p>
                            </section>

                            {/* TRAVELER OVERVIEW */}

                            {isTraveler && (
                                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Compass className="h-5 w-5 text-teal-400" />
                                        <h2 className="text-lg font-semibold text-white">
                                            Travel Interests &amp; Style
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                                                Travel Style
                                            </span>

                                            <span className="rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-sm font-medium capitalize text-teal-300">
                                                {currentUser?.travelStyle ||
                                                    'Adventure'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                                                Interests
                                            </span>

                                            <div className="flex flex-wrap gap-2">
                                                {currentUser?.travelInterests
                                                    ?.length ? (
                                                    currentUser.travelInterests.map(
                                                        (interest: string) => (
                                                            <span
                                                                key={interest}
                                                                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300"
                                                            >
                                                                {interest.replaceAll(
                                                                    '_',
                                                                    ' '
                                                                )}
                                                            </span>
                                                        )
                                                    )
                                                ) : (
                                                    <p className="text-sm text-slate-500">
                                                        No interests selected
                                                        yet.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                                                Preferred Destinations
                                            </span>

                                            <div className="flex flex-wrap gap-2">
                                                {currentUser
                                                    ?.preferredDestinations
                                                    ?.length ? (
                                                    currentUser.preferredDestinations.map(
                                                        (
                                                            destination: string
                                                        ) => (
                                                            <span
                                                                key={
                                                                    destination
                                                                }
                                                                className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300"
                                                            >
                                                                {destination}
                                                            </span>
                                                        )
                                                    )
                                                ) : (
                                                    <p className="text-sm text-slate-500">
                                                        No preferred
                                                        destinations added yet.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* OPERATOR OVERVIEW */}

                            {isOperator && (
                                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-teal-400" />
                                        <h2 className="text-lg font-semibold text-white">
                                            Business Information
                                        </h2>
                                    </div>

                                    <div className="space-y-4 text-sm text-slate-300">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Business Name
                                            </p>
                                            <p className="mt-1">
                                                {operatorProfile?.businessName ||
                                                    'Not added yet'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Business Description
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                                                {operatorProfile?.businessDescription ||
                                                    'Not added yet'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Business Email
                                            </p>
                                            <p className="mt-1 break-all">
                                                {operatorProfile?.businessEmail ||
                                                    'Not added yet'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Business Phone
                                            </p>
                                            <p className="mt-1">
                                                {operatorProfile?.businessPhone ||
                                                    'Not added yet'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Website
                                            </p>

                                            {operatorProfile?.website ? (
                                                <a
                                                    href={
                                                        operatorProfile.website
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-block break-all text-teal-400 transition hover:text-teal-300 hover:underline"
                                                >
                                                    {operatorProfile.website}
                                                </a>
                                            ) : (
                                                <p className="mt-1">
                                                    Not added yet
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Business Address
                                            </p>
                                            <p className="mt-1">
                                                {operatorProfile?.businessAddress ||
                                                    'Not added yet'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ADMIN OVERVIEW */}

                            {isAdmin && (
                                <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-6 backdrop-blur-sm">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-indigo-400" />
                                        <h2 className="text-lg font-semibold text-white">
                                            Administrator Information
                                        </h2>
                                    </div>

                                    <div className="space-y-3 text-sm text-slate-300">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Account Type
                                            </p>
                                            <p className="mt-1">
                                                Tripora Administrator
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Account Status
                                            </p>
                                            <p className="mt-1 capitalize">
                                                {currentUser?.status ||
                                                    'Active'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Email Verification
                                            </p>
                                            <p className="mt-1">
                                                {currentUser?.emailVerified
                                                    ? 'Verified'
                                                    : 'Not verified'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}

                        <div className="space-y-6">
                            {/* CONTACT INFORMATION */}

                            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                                <h2 className="text-lg font-semibold text-white">
                                    Contact Information
                                </h2>

                                <div className="space-y-3 text-sm text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                        <span className="break-all">
                                            {currentUser?.email ||
                                                'Not provided'}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                        <span>
                                            {currentUser?.phone ||
                                                'Not provided'}
                                        </span>
                                    </div>

                                    {isTraveler && (
                                        <div className="flex items-start gap-3">
                                            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                            <span>
                                                Currency:{' '}
                                                {currentUser?.preferredCurrency ||
                                                    'INR'}
                                            </span>
                                        </div>
                                    )}

                                    {isOperator && (
                                        <div className="flex items-start gap-3">
                                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                            <span className="break-all">
                                                {operatorProfile?.businessEmail ||
                                                    'Business email not added'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ACCOUNT INFORMATION */}

                            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                                <h2 className="mb-3 text-lg font-semibold text-white">
                                    Account
                                </h2>

                                <div className="space-y-3 text-sm text-slate-400">
                                    <p>
                                        Account Type:{' '}
                                        <span className="font-medium text-slate-200">
                                            {roleLabel}
                                        </span>
                                    </p>

                                    <p>
                                        Account Status:{' '}
                                        <span className="capitalize text-slate-200">
                                            {currentUser?.status || 'Active'}
                                        </span>
                                    </p>

                                    <p>
                                        Member since{' '}
                                        <span className="text-slate-200">
                                            {currentUser?.createdAt
                                                ? new Date(
                                                      currentUser.createdAt
                                                  ).toLocaleDateString(
                                                      undefined,
                                                      {
                                                          year: 'numeric',
                                                          month: 'long',
                                                      }
                                                  )
                                                : 'Tripora'}
                                        </span>
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* EDIT PROFILE TAB */}

                {activeTab === 'edit' && (
                    <form
                        onSubmit={handleProfileFormSubmit(handleProfileSubmit)}
                        noValidate
                        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Personal Information
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Keep your profile details up to date.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    {...registerProfile('firstName')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={profileErrors.firstName?.message}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    {...registerProfile('lastName')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={profileErrors.lastName?.message}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    autoComplete="tel"
                                    {...registerProfile('phone')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={profileErrors.phone?.message}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    City
                                </label>

                                <input
                                    type="text"
                                    autoComplete="address-level2"
                                    {...registerProfile('city')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={profileErrors.city?.message}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs text-slate-400">
                                    Country
                                </label>

                                <input
                                    type="text"
                                    autoComplete="country-name"
                                    {...registerProfile('country')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={profileErrors.country?.message}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-slate-400">
                                Bio
                            </label>

                            <textarea
                                rows={4}
                                {...registerProfile('bio')}
                                placeholder="Tell the community about yourself..."
                                className={INPUT_CLASS}
                            />

                            <FieldError message={profileErrors.bio?.message} />
                        </div>

                        <button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 font-medium text-slate-950 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updating && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </button>
                    </form>
                )}

                {/* TRAVEL PREFERENCES TAB */}

                {isTraveler && activeTab === 'preferences' && (
                    <form
                        onSubmit={handlePreferencesFormSubmit(
                            handlePreferencesSubmit
                        )}
                        noValidate
                        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Travel Preferences
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Personalize your travel experience.
                            </p>
                        </div>

                        {/* LANGUAGE */}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Preferred Language
                            </label>

                            <select
                                {...registerPreferences('preferredLanguage')}
                                className={INPUT_CLASS}
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="ml">Malayalam</option>
                                <option value="ar">Arabic</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                            </select>

                            <FieldError
                                message={
                                    preferenceErrors.preferredLanguage?.message
                                }
                            />
                        </div>

                        {/* CURRENCY */}

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-300">
                                Preferred Currency
                            </label>

                            <div className="flex flex-wrap gap-2">
                                {CURRENCIES.map((currency) => (
                                    <button
                                        key={currency}
                                        type="button"
                                        aria-pressed={
                                            selectedCurrency === currency
                                        }
                                        onClick={() =>
                                            setPreferenceValue(
                                                'preferredCurrency',
                                                currency,
                                                {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                }
                                            )
                                        }
                                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                            selectedCurrency === currency
                                                ? 'border-teal-400 bg-teal-500 text-slate-950'
                                                : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                        {currency}
                                    </button>
                                ))}
                            </div>

                            <FieldError
                                message={
                                    preferenceErrors.preferredCurrency?.message
                                }
                            />
                        </div>

                        {/* TRAVEL STYLE */}

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-300">
                                Travel Style
                            </label>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {TRAVEL_STYLES.map((style) => (
                                    <button
                                        key={style}
                                        type="button"
                                        aria-pressed={selectedStyle === style}
                                        onClick={() =>
                                            setPreferenceValue(
                                                'travelStyle',
                                                style,
                                                {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                }
                                            )
                                        }
                                        className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition ${
                                            selectedStyle === style
                                                ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>

                            <FieldError
                                message={preferenceErrors.travelStyle?.message}
                            />
                        </div>

                        {/* TRAVEL INTERESTS */}

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-300">
                                Travel Interests
                            </label>

                            <div className="flex flex-wrap gap-2">
                                {TRAVEL_INTERESTS.map((interest) => {
                                    const selected =
                                        selectedInterests.includes(interest);

                                    return (
                                        <button
                                            key={interest}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() =>
                                                toggleInterest(interest)
                                            }
                                            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                                                selected
                                                    ? 'border-teal-400 bg-teal-500 text-slate-950'
                                                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            {interest.replaceAll('_', ' ')}
                                        </button>
                                    );
                                })}
                            </div>

                            <FieldError
                                message={
                                    preferenceErrors.travelInterests?.message
                                }
                            />
                        </div>

                        {/* PREFERRED DESTINATIONS */}

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-300">
                                Preferred Destinations
                            </label>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="text"
                                    value={newDestinationInput}
                                    onChange={(e) =>
                                        setNewDestinationInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDestination();
                                        }
                                    }}
                                    placeholder="e.g. Kerala, Japan, Bali"
                                    className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                                />

                                <button
                                    type="button"
                                    onClick={handleAddDestination}
                                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
                                >
                                    Add Destination
                                </button>
                            </div>

                            <FieldError
                                message={
                                    preferenceErrors.preferredDestinations
                                        ?.message
                                }
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedDestinations.map((destination) => (
                                    <span
                                        key={destination}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                                    >
                                        {destination}

                                        <button
                                            type="button"
                                            aria-label={`Remove ${destination}`}
                                            onClick={() =>
                                                handleRemoveDestination(
                                                    destination
                                                )
                                            }
                                            className="text-slate-400 hover:text-red-400"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* TRAVEL BUDGET */}

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-300">
                                Travel Budget
                            </label>

                            <div className="flex flex-wrap gap-2">
                                {TRAVEL_BUDGETS.map((budget) => (
                                    <button
                                        key={budget}
                                        type="button"
                                        aria-pressed={selectedBudget === budget}
                                        onClick={() =>
                                            setPreferenceValue(
                                                'budget',
                                                budget,
                                                {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                }
                                            )
                                        }
                                        className={`rounded-xl border px-4 py-2 text-sm transition ${
                                            selectedBudget === budget
                                                ? 'border-teal-400 bg-teal-500 text-slate-950'
                                                : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                        {budget}
                                    </button>
                                ))}
                            </div>

                            <FieldError
                                message={preferenceErrors.budget?.message}
                            />
                        </div>

                        {/* SAVE PREFERENCES */}

                        <button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 font-medium text-slate-950 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updating && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save Preferences
                        </button>
                    </form>
                )}

                {/* BUSINESS DETAILS TAB */}

                {isOperator && activeTab === 'operator' && (
                    <form
                        onSubmit={handleOperatorFormSubmit(
                            handleOperatorSubmit
                        )}
                        noValidate
                        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Business Details
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Manage your tour business information on
                                Tripora.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* BUSINESS NAME */}

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Business Name
                                </label>

                                <input
                                    type="text"
                                    {...registerOperator('businessName')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={
                                        operatorErrors.businessName?.message
                                    }
                                />
                            </div>

                            {/* BUSINESS EMAIL */}

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Business Email
                                </label>

                                <input
                                    type="email"
                                    autoComplete="email"
                                    {...registerOperator('businessEmail')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={
                                        operatorErrors.businessEmail?.message
                                    }
                                />
                            </div>

                            {/* WEBSITE */}

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Website
                                </label>

                                <input
                                    type="url"
                                    {...registerOperator('website')}
                                    placeholder="https://example.com"
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={operatorErrors.website?.message}
                                />
                            </div>

                            {/* BUSINESS PHONE */}

                            <div>
                                <label className="mb-1 block text-xs text-slate-400">
                                    Business Phone
                                </label>

                                <input
                                    type="tel"
                                    {...registerOperator('businessPhone')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={
                                        operatorErrors.businessPhone?.message
                                    }
                                />
                            </div>

                            {/* BUSINESS ADDRESS */}

                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs text-slate-400">
                                    Business Address
                                </label>

                                <input
                                    type="text"
                                    {...registerOperator('businessAddress')}
                                    className={INPUT_CLASS}
                                />

                                <FieldError
                                    message={
                                        operatorErrors.businessAddress?.message
                                    }
                                />
                            </div>
                        </div>

                        {/* BUSINESS DESCRIPTION */}

                        <div>
                            <label className="mb-1 block text-xs text-slate-400">
                                Business Description
                            </label>

                            <textarea
                                rows={4}
                                {...registerOperator('businessDescription')}
                                placeholder="Describe your tour business and the experiences you offer..."
                                className={INPUT_CLASS}
                            />

                            <FieldError
                                message={
                                    operatorErrors.businessDescription?.message
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updating && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save Business Details
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
