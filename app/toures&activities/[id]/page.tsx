'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import type { AppDispatch, RootState } from '../../../redux/store';

import {
    fetchTourById,
    clearCurrentTour,
} from '../../../redux/slices/tourSlice';
import { FaWhatsapp } from 'react-icons/fa';
import {
    fetchMyWishlist,
    addToWishlist,
    removeFromWishlist,
} from '../../../redux/slices/wishlistSlice';

import {
    bookingSchema,
    type BookingFormValues,
} from '../../../validations/bookingSchema';

import {
    FiMapPin,
    FiClock,
    FiUsers,
    FiSun,
    FiCheckCircle,
    FiXCircle,
    FiGlobe,
    FiShield,
    FiHeart,
    FiShare2,
    FiArrowLeft,
    FiCalendar,
    FiCheck,
    FiArrowRight,
} from 'react-icons/fi';

export default function TourDetailsPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const dispatch = useDispatch<AppDispatch>();

    const { currentTour, detailsLoading, error } = useSelector(
        (state: RootState) => state.tours
    );

    const { wishlistIds, wishlistChecks, submittingIds } = useSelector(
        (state: RootState) => state.wishlist
    );

    const isWishlisted = id
        ? (wishlistChecks[id] ?? wishlistIds.includes(id))
        : false;

    const isWishlistSubmitting = id ? submittingIds.includes(id) : false;

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [shareMessage, setShareMessage] = useState('');

    const today = new Date().toLocaleDateString('en-CA');

    // React Hook Form + Yup validation
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<BookingFormValues>({
        resolver: yupResolver(bookingSchema),
        defaultValues: {
            selectedDate: '',
            participants: 1,
        },
    });

    const selectedDate = watch('selectedDate');
    const participants = watch('participants');

    // Load tour details
    useEffect(() => {
        if (id) {
            dispatch(fetchTourById(id));
        }

        return () => {
            dispatch(clearCurrentTour());
        };
    }, [dispatch, id]);

    // Load wishlist
    useEffect(() => {
        dispatch(fetchMyWishlist());
    }, [dispatch]);

    // Reset tour-specific selections when route changes
    useEffect(() => {
        setActiveImageIndex(0);

        setValue('selectedDate', '');
        setValue('participants', 1);
    }, [id, setValue]);

    // Wishlist
    const handleWishlistToggle = async () => {
        if (!id || isWishlistSubmitting) return;

        try {
            if (isWishlisted) {
                await dispatch(removeFromWishlist(id)).unwrap();
            } else {
                await dispatch(addToWishlist(id)).unwrap();
            }
        } catch (wishlistError) {
            console.error('Wishlist update failed:', wishlistError);
        }
    };

    // Share
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: currentTour?.title ?? 'Tripora Experience',
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setShareMessage('Link copied!');
                window.setTimeout(() => setShareMessage(''), 2500);
            }
        } catch (shareError) {
            if (
                shareError instanceof Error &&
                shareError.name !== 'AbortError'
            ) {
                setShareMessage('Unable to share this link.');
                window.setTimeout(() => setShareMessage(''), 2500);
            }
        }
    };

    // Navigate to booking page after successful validation
    const handleBooking = (data: BookingFormValues) => {
        if (!currentTour) return;

        const query = new URLSearchParams({
            tourId: currentTour._id,
            date: data.selectedDate,
            participants: String(data.participants),
            cancellationPolicy: currentTour.cancellationPolicy || '',
        });

        window.location.href = `/booking?${query.toString()}`;
    };

    if (detailsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-sm font-semibold text-slate-600">
                        Loading experience details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !currentTour) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FiGlobe size={28} />
                    </div>

                    <h2 className="mb-2 text-xl font-bold text-slate-900">
                        Tour not found
                    </h2>

                    <p className="mb-6 text-sm leading-6 text-slate-500">
                        {error ||
                            "We couldn't retrieve the details for this experience."}
                    </p>

                    <Link
                        href="/toures&activities"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                        <FiArrowLeft size={16} />
                        Back to Tours & Activities
                    </Link>
                </div>
            </div>
        );
    }

    const images = (currentTour.images ?? [])
        .map((image) => (typeof image === 'string' ? image : image.url))
        .filter((url): url is string => Boolean(url));

    const fallbackImage =
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200';

    const mainImage = images[activeImageIndex] || fallbackImage;

    const maxParticipants = Math.max(
        1,
        Math.min(currentTour.maxParticipants || 10, 10)
    );

    const minParticipants = Math.max(1, currentTour.minParticipants || 1);

    const duration =
        currentTour.durationDays || currentTour.nights
            ? `${currentTour.durationDays || 1} day${
                  (currentTour.durationDays || 1) > 1 ? 's' : ''
              }${
                  currentTour.nights
                      ? ` / ${currentTour.nights} night${
                            currentTour.nights > 1 ? 's' : ''
                        }`
                      : ''
              }`
            : currentTour.durationMinutes
              ? `${currentTour.durationMinutes} minutes`
              : 'Flexible duration';

    const price = Number(currentTour.basePrice ?? 0);
    const totalPrice = price * participants;
    // WhatsApp contact details
    const whatsappNumber = currentTour.whatsappNumber?.replace(/\D/g, '');

    const whatsappMessage = encodeURIComponent(
        `Hello, I am interested in your tour "${currentTour.title}". Could you please provide more information?`
    );

    const whatsappUrl = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
        : null;

    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pb-20 font-sans text-slate-800">
            {/* Top navigation */}
            <div className="sticky top-0 z-30 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/toures&activities"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
                    >
                        <FiArrowLeft size={16} />
                        Back to experiences
                    </Link>

                    <div className="relative flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleWishlistToggle}
                            disabled={isWishlistSubmitting}
                            aria-label={
                                isWishlisted
                                    ? 'Remove from wishlist'
                                    : 'Add to wishlist'
                            }
                            aria-pressed={isWishlisted}
                            title={
                                isWishlisted
                                    ? 'Remove from wishlist'
                                    : 'Add to wishlist'
                            }
                            className={`rounded-full border p-2.5 shadow-sm transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                                isWishlisted
                                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <FiHeart
                                size={18}
                                className={isWishlisted ? 'fill-current' : ''}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label="Share experience"
                            className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:scale-105 hover:bg-slate-50 active:scale-95"
                        >
                            <FiShare2 size={18} />
                        </button>

                        {shareMessage && (
                            <span
                                role="status"
                                className="absolute right-0 top-12 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg"
                            >
                                {shareMessage}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-9 lg:px-8">
                {/* Hero image */}
                <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-slate-200 shadow-2xl shadow-blue-950/10 ring-1 ring-black/5">
                    <div className="group relative h-[280px] sm:h-[400px] lg:h-[510px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={mainImage}
                            alt={currentTour.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-slate-950/10" />

                        <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-xl">
                                <FiGlobe size={15} />
                                Discover with Tripora
                            </span>
                        </div>

                        <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/25 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md sm:right-6 sm:top-6">
                            {images.length > 0
                                ? `${activeImageIndex + 1} / ${images.length}`
                                : 'Experience'}
                        </div>
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto bg-white p-3 sm:p-4">
                            {images.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    aria-label={`View tour image ${index + 1}`}
                                    aria-pressed={activeImageIndex === index}
                                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl transition sm:h-20 sm:w-32 ${
                                        activeImageIndex === index
                                            ? 'ring-2 ring-blue-600 ring-offset-2'
                                            : 'opacity-75 hover:opacity-100'
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image}
                                        alt={`${currentTour.title} thumbnail ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Tour title */}
                <section className="mb-9 rounded-3xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] sm:p-8">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {currentTour.difficultyLevel && (
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                                {currentTour.difficultyLevel}
                            </span>
                        )}

                        {currentTour.instantBooking && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                                <FiCheckCircle size={14} />
                                Instant confirmation
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                        {currentTour.title}
                    </h1>

                    {typeof currentTour.destinationId === 'object' &&
                        currentTour.destinationId && (
                            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 sm:text-base">
                                <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                                    <FiMapPin size={18} />
                                </span>
                                {currentTour.destinationId.name}
                                {currentTour.destinationId.country
                                    ? `, ${currentTour.destinationId.country}`
                                    : ''}
                            </p>
                        )}
                </section>

                {/* Details and booking */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
                    <div className="space-y-7 lg:col-span-2">
                        {/* Quick facts */}
                        <section className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-900/[0.03] sm:grid-cols-4 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                                    {currentTour.durationDays ||
                                    currentTour.nights ? (
                                        <FiSun size={20} />
                                    ) : (
                                        <FiClock size={20} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Duration
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-800">
                                        {duration}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                                    <FiUsers size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Group size
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-800">
                                        Up to{' '}
                                        {currentTour.maxParticipants || 10}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                    <FiShield size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Languages
                                    </p>
                                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                        {currentTour.languages?.join(', ') ||
                                            'English'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                                    <FiGlobe size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Minimum age
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-800">
                                        {currentTour.ageRestrictions?.minAge ??
                                            0}
                                        + years
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Description */}
                        <section className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-lg sm:p-8">
                            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                                About this experience
                            </h2>
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                                {currentTour.description ||
                                    'Discover a memorable experience with Tripora.'}
                            </p>
                        </section>

                        {/* Highlights */}
                        {currentTour.highlights?.length > 0 && (
                            <section className="space-y-5 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-lg sm:p-8">
                                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                                    Experience highlights
                                </h2>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {currentTour.highlights.map(
                                        (highlight, index) => (
                                            <div
                                                key={`${highlight}-${index}`}
                                                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-100 hover:bg-blue-50/50"
                                            >
                                                <FiCheck
                                                    className="mt-0.5 shrink-0 text-blue-600"
                                                    size={18}
                                                />
                                                <span className="text-sm font-semibold leading-6 text-slate-700">
                                                    {highlight}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Daily itinerary */}
                        {currentTour.days?.length && (
                            <section className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 p-5 shadow-lg shadow-blue-950/[0.04] sm:p-8">
                                <div className="mb-8 flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                                        <FiSun size={23} />
                                    </div>

                                    <div>
                                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                                            Your journey, day by day
                                        </p>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                            Your itinerary
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Discover amazing places, taste local
                                            cuisine, and make unforgettable
                                            memories.
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <FiCalendar size={19} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {currentTour.days.length}-day
                                            adventure
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {currentTour.days.length} days of
                                            exploration and experiences
                                        </p>
                                    </div>

                                    <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                        <FiCheckCircle size={14} />
                                        Planned for you
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {currentTour.days.map((day, index) => {
                                        const activities = (
                                            day.description ?? ''
                                        ).match(
                                            /\d{1,2}:\d{2}\s*(?:AM|PM)\s*[-–:]\s*[\s\S]*?(?=\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s*[-–:]|$)/gi
                                        ) ?? [day.description ?? ''];

                                        return (
                                            <article
                                                key={`${day.title}-${index}`}
                                                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.06]"
                                            >
                                                <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white p-4 sm:p-5">
                                                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-100">
                                                            Day
                                                        </span>
                                                        <span className="text-lg font-black leading-5">
                                                            {index + 1}
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-base font-extrabold leading-6 text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                                                            {day.title}
                                                        </h3>

                                                        <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
                                                            <FiClock
                                                                size={13}
                                                            />
                                                            {day.time ||
                                                                'Schedule varies'}
                                                        </div>
                                                    </div>

                                                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:flex">
                                                        <FiMapPin size={19} />
                                                    </div>
                                                </div>

                                                <div className="p-4 sm:p-6">
                                                    <div className="relative space-y-5">
                                                        {activities.map(
                                                            (
                                                                activity,
                                                                activityIndex
                                                            ) => {
                                                                const match =
                                                                    activity.match(
                                                                        /^\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–:]\s*([\s\S]*)$/i
                                                                    );

                                                                const time =
                                                                    match?.[1]?.trim();
                                                                const content =
                                                                    match?.[2]?.trim() ||
                                                                    activity.trim();

                                                                const separatorIndex =
                                                                    content.indexOf(
                                                                        ':'
                                                                    );
                                                                const hasLabel =
                                                                    separatorIndex >
                                                                        0 &&
                                                                    separatorIndex <
                                                                        45;

                                                                const label =
                                                                    hasLabel
                                                                        ? content
                                                                              .slice(
                                                                                  0,
                                                                                  separatorIndex
                                                                              )
                                                                              .trim()
                                                                        : '';

                                                                const description =
                                                                    hasLabel
                                                                        ? content
                                                                              .slice(
                                                                                  separatorIndex +
                                                                                      1
                                                                              )
                                                                              .trim()
                                                                        : content;

                                                                return (
                                                                    <div
                                                                        key={`${activityIndex}-${activity}`}
                                                                        className="relative flex gap-3 sm:gap-4"
                                                                    >
                                                                        {activityIndex !==
                                                                            activities.length -
                                                                                1 && (
                                                                            <span className="absolute bottom-[-22px] left-[13px] top-7 w-px bg-gradient-to-b from-blue-200 to-slate-100" />
                                                                        )}

                                                                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-blue-100 bg-white text-blue-600">
                                                                            {time ? (
                                                                                <FiClock
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <FiCheck
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1 pb-1">
                                                                            {time && (
                                                                                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                                                                                    {
                                                                                        time
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                            {label && (
                                                                                <h4 className="mb-1 text-sm font-bold text-slate-800">
                                                                                    {
                                                                                        label
                                                                                    }
                                                                                </h4>
                                                                            )}

                                                                            <p className="text-sm leading-6 text-slate-600">
                                                                                {
                                                                                    description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-medium text-slate-500 sm:px-6">
                                                    <FiCheckCircle
                                                        size={15}
                                                        className="text-emerald-500"
                                                    />
                                                    <span>
                                                        Day {index + 1} of your
                                                        Tripora experience
                                                    </span>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                                    <FiGlobe
                                        size={19}
                                        className="mt-0.5 shrink-0 text-indigo-600"
                                    />
                                    <p className="text-xs leading-6 text-indigo-900/80">
                                        <span className="font-bold">
                                            Travel tip:
                                        </span>{' '}
                                        Activity timings may vary depending on
                                        weather, local conditions, attraction
                                        opening hours, and availability.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Inclusions and exclusions */}
                        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {currentTour.inclusions?.length > 0 && (
                                <div className="space-y-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                                    <h3 className="flex items-center gap-2 font-bold text-emerald-900">
                                        <FiCheckCircle
                                            size={19}
                                            className="text-emerald-600"
                                        />
                                        What&apos;s included
                                    </h3>

                                    <ul className="space-y-3">
                                        {currentTour.inclusions.map(
                                            (item, index) => (
                                                <li
                                                    key={`${item}-${index}`}
                                                    className="flex items-start gap-2 text-sm text-emerald-800"
                                                >
                                                    <FiCheck
                                                        size={15}
                                                        className="mt-0.5 shrink-0"
                                                    />
                                                    {item}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                            {currentTour.exclusions?.length > 0 && (
                                <div className="space-y-4 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
                                    <h3 className="flex items-center gap-2 font-bold text-rose-900">
                                        <FiXCircle
                                            size={19}
                                            className="text-rose-600"
                                        />
                                        What&apos;s excluded
                                    </h3>

                                    <ul className="space-y-3">
                                        {currentTour.exclusions.map(
                                            (item, index) => (
                                                <li
                                                    key={`${item}-${index}`}
                                                    className="flex items-start gap-2 text-sm text-rose-800"
                                                >
                                                    <FiXCircle
                                                        size={15}
                                                        className="mt-0.5 shrink-0"
                                                    />
                                                    {item}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Meeting point */}
                        {currentTour.meetingPoint?.name && (
                            <section className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
                                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                                    Meeting point
                                </h2>

                                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                    <FiMapPin
                                        className="mt-1 shrink-0 text-rose-500"
                                        size={20}
                                    />

                                    <div>
                                        <p className="font-bold text-slate-900">
                                            {currentTour.meetingPoint.name}
                                        </p>

                                        {currentTour.meetingPoint.address && (
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                {
                                                    currentTour.meetingPoint
                                                        .address
                                                }
                                            </p>
                                        )}

                                        {currentTour.meetingPoint
                                            .instructions && (
                                            <p className="mt-2 text-sm font-medium text-blue-600">
                                                Note:{' '}
                                                {
                                                    currentTour.meetingPoint
                                                        .instructions
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Booking sidebar */}
                    <aside className="lg:col-span-1">
                        <form
                            onSubmit={handleSubmit(handleBooking)}
                            noValidate
                            className="space-y-6 rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-blue-950/[0.08] ring-1 ring-slate-200/70 lg:sticky lg:top-24"
                        >
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Starting from
                                </p>

                                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                                    <span className="text-3xl font-black tracking-tight text-blue-700">
                                        {currentTour.currency}{' '}
                                        {price.toLocaleString('en-IN')}
                                    </span>

                                    <span className="text-xs text-slate-500">
                                        / person
                                    </span>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-5">
                                {/* Date */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="booking-date"
                                        className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                    >
                                        Select date
                                    </label>

                                    <div className="relative">
                                        <FiCalendar
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            size={16}
                                        />

                                        <input
                                            id="booking-date"
                                            type="date"
                                            min={today}
                                            {...register('selectedDate')}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {errors.selectedDate && (
                                        <p className="text-xs font-medium text-red-600">
                                            {errors.selectedDate.message}
                                        </p>
                                    )}
                                </div>

                                {/* Participants */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="booking-participants"
                                        className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                    >
                                        Participants
                                    </label>

                                    <div className="relative">
                                        <FiUsers
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            size={16}
                                        />

                                        <select
                                            id="booking-participants"
                                            {...register('participants', {
                                                valueAsNumber: true,
                                            })}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        >
                                            {Array.from(
                                                {
                                                    length: Math.max(
                                                        0,
                                                        maxParticipants -
                                                            minParticipants +
                                                            1
                                                    ),
                                                },
                                                (_, index) =>
                                                    index + minParticipants
                                            ).map((count) => (
                                                <option
                                                    key={count}
                                                    value={count}
                                                >
                                                    {count}{' '}
                                                    {count === 1
                                                        ? 'Adult'
                                                        : 'Adults'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {errors.participants && (
                                        <p className="text-xs font-medium text-red-600">
                                            {errors.participants.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price summary */}
                            <div className="space-y-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4">
                                <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                                    <span>
                                        {currentTour.currency}{' '}
                                        {price.toLocaleString('en-IN')} ×{' '}
                                        {participants}
                                    </span>

                                    <span className="font-semibold text-slate-700">
                                        {currentTour.currency}{' '}
                                        {totalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between border-t border-blue-100 pt-3">
                                    <span className="text-sm font-bold text-slate-800">
                                        Estimated total
                                    </span>

                                    <span className="text-lg font-black text-blue-700">
                                        {currentTour.currency}{' '}
                                        {totalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 active:translate-y-0"
                            >
                                Continue to Booking
                                <FiArrowRight size={17} />
                            </button>

                            <p className="text-center text-xs leading-5 text-slate-400">
                                Select your date and group size to continue.
                            </p>

                            {currentTour.cancellationPolicy && (
                                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                                    <FiShield
                                        size={16}
                                        className="mt-0.5 shrink-0 text-emerald-600"
                                    />

                                    <p className="text-xs leading-5 text-emerald-800">
                                        {currentTour.cancellationPolicy}
                                    </p>
                                </div>
                            )}
                        </form>
                    </aside>
                </div>
            </div>

            {/* Floating WhatsApp Contact Card */}
            {/* Floating WhatsApp Contact Card */}
            {whatsappUrl && (
                <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-[300px] sm:bottom-6 sm:right-6">
                    <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-white shadow-xl shadow-green-950/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-green-900/20">
                        {/* Decorative background */}
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-100/70 blur-2xl transition-all duration-500 group-hover:bg-green-200/80" />

                        <div className="relative p-3.5">
                            {/* Header */}
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md shadow-green-500/20">
                                    <FaWhatsapp
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                                        Need assistance?
                                    </p>
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        Talk to the operator
                                    </h3>
                                </div>

                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold text-green-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Direct chat
                                </span>
                            </div>

                            {/* Description */}
                            <p className="mt-3 text-xs leading-5 text-slate-500">
                                Have questions about this experience? Get
                                information directly from the tour operator.
                            </p>

                            {/* Compact WhatsApp button */}
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contact tour operator on WhatsApp"
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#16B85A] px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-green-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#1FBD5B] hover:to-[#109E4B] hover:shadow-lg active:translate-y-0"
                            >
                                <FaWhatsapp
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Contact Operator
                                <span className="text-sm">→</span>
                            </a>

                            {/* Footer */}
                            <div className="mt-2.5 flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400">
                                <FiShield
                                    size={11}
                                    className="text-green-500"
                                />
                                Chat directly with the tour operator
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
