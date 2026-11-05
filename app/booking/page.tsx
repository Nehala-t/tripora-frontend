'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';

import {
    createBooking,
    createCheckoutSession,
    fetchAvailableSlots,
} from '@/redux/slices/bookingSlice';

import { fetchTourById } from '@/redux/slices/tourSlice';

import type {
    CreateBookingPayload,
    AvailabilitySlot,
} from '@/redux/slices/bookingSlice';

import {
    bookingFormSchema,
    type BookingTravelerFormValues,
} from '@/validations/bookingSchema';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// ============================================
// TYPES
// ============================================

type SelectedPaymentMethod = 'stripe' | 'cash';

interface BookingTourDetails {
    _id: string;
    title: string;
    description?: string;
    durationMinutes?: number;
    durationDays?: number;
    nights?: number;
    cancellationPolicy?: string;
    freeCancellationHours?: number;
    difficultyLevel?: string;
    languages?: string[];
    highlights?: string[];
    meetingPoint?: {
        name?: string;
        address?: string;
        instructions?: string;
    };
    images?: {
        url: string;
        publicId?: string;
        isPrimary?: boolean;
        alt?: string;
    }[];
    destinationId?:
        | {
              name?: string;
              country?: string;
              region?: string;
          }
        | string;
}

// ============================================
// HELPERS
// ============================================

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const formatTime = (value?: string) => {
    if (!value) return 'Time unavailable';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Time unavailable';

    return date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatPrice = (price: number, currency: string) => {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 2,
        }).format(price);
    } catch {
        return `${currency || 'INR'} ${Number(price).toLocaleString('en-IN')}`;
    }
};

const formatDuration = (minutes?: number) => {
    if (!minutes || minutes <= 0) {
        return 'Duration not specified';
    }

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remainingMinutes = minutes % 60;

    if (days > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'}${
            hours > 0 ? ` ${hours} ${hours === 1 ? 'hour' : 'hours'}` : ''
        }`;
    }

    if (hours > 0 && remainingMinutes > 0) {
        return `${hours} hr ${remainingMinutes} min`;
    }

    if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${remainingMinutes} minutes`;
};

// ============================================
// MAIN PAGE CONTENT
// ============================================

function BookingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch<AppDispatch>();

    // URL PARAMETERS
    const tourId = searchParams.get('tourId') || '';
    const selectedDate = searchParams.get('date') || '';
    const participants = Number(searchParams.get('participants') || 1);

    // ============================================
    // REDUX STATE
    // ============================================

    const {
        slots,
        slotsLoading,
        slotsError,
        submitting,
        error: bookingError,
        paymentLoading,
        paymentError,
    } = useSelector((state: RootState) => state.bookings);

    const {
        currentTour,
        detailsLoading,
        error: tourError,
    } = useSelector((state: RootState) => state.tours);

    const tour = currentTour as unknown as BookingTourDetails | null;

    // ============================================
    // LOCAL STATE
    // ============================================

    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [paymentMethod, setPaymentMethod] =
        useState<SelectedPaymentMethod>('stripe');

    // ============================================
    // TRAVELER FORM
    // ============================================

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BookingTravelerFormValues>({
        resolver: yupResolver(bookingFormSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            specialRequests: '',
        },
    });

    // ============================================
    // VALIDATE URL PARAMETERS
    // ============================================

    const validBookingDetails = useMemo(() => {
        const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);

        if (!tourId || !isValidDateFormat) return false;

        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date >= today &&
            Number.isInteger(participants) &&
            participants >= 1
        );
    }, [tourId, selectedDate, participants]);

    // ============================================
    // FETCH TOUR DETAILS
    // ============================================

    useEffect(() => {
        if (!tourId) return;

        dispatch(fetchTourById(tourId));
    }, [dispatch, tourId]);

    // ============================================
    // FETCH AVAILABLE SLOTS
    // ============================================

    useEffect(() => {
        if (!validBookingDetails) return;

        setSelectedSlotId('');

        const request = dispatch(
            fetchAvailableSlots({
                tourId,
                date: selectedDate,
                participants,
            })
        );

        return () => {
            request.abort();
        };
    }, [dispatch, tourId, selectedDate, participants, validBookingDetails]);

    // ============================================
    // AUTO SELECT FIRST AVAILABLE SLOT
    // ============================================

    useEffect(() => {
        if (slotsLoading) return;

        if (slots.length === 0) {
            setSelectedSlotId('');
            return;
        }

        const selectedSlotExists = slots.some(
            (slot: AvailabilitySlot) => slot._id === selectedSlotId
        );

        if (!selectedSlotExists) {
            setSelectedSlotId(slots[0]._id);
        }
    }, [slots, slotsLoading, selectedSlotId]);

    // ============================================
    // TOUR INFORMATION
    // ============================================

    const primaryImage =
        tour?.images?.find((image) => image.isPrimary) ?? tour?.images?.[0];

    const destination =
        typeof tour?.destinationId === 'object'
            ? [
                  tour.destinationId?.name,
                  tour.destinationId?.region,
                  tour.destinationId?.country,
              ]
                  .filter(Boolean)
                  .join(', ')
            : '';

    // ============================================
    // CANCELLATION POLICY
    // ============================================

    const cancellationPolicy =
        tour?.cancellationPolicy?.trim() ||
        'Cancellation policy has not been provided by the tour operator.';

    const freeCancellationHours = tour?.freeCancellationHours;

    // ============================================
    // SELECTED SLOT AND PRICE
    // ============================================

    const selectedSlot = slots.find((slot) => slot._id === selectedSlotId);

    const pricePerPerson = selectedSlot?.price ?? 0;
    const totalPrice = pricePerPerson * participants;

    // ============================================
    // SUBMIT BOOKING + PAYMENT
    // ============================================

    const onSubmit = async (values: BookingTravelerFormValues) => {
        if (!selectedSlot) return;

        const bookingData: CreateBookingPayload = {
            tourId,
            availabilitySlotId: selectedSlot._id,
            travelDate: selectedDate,
            participants,

            travelerDetails: {
                fullName: values.fullName.trim(),
                email: values.email.trim().toLowerCase(),
                phone: values.phone.trim(),
            },

            specialRequests: (values.specialRequests || '').trim(),

            // Selected payment method
            paymentMethod,
        };

        try {
            // STEP 1: Create booking
            const booking = await dispatch(createBooking(bookingData)).unwrap();

            // STEP 2: COD - no Stripe redirect
            if (paymentMethod === 'cash') {
                router.push('/my-bookings');
                return;
            }

            // STEP 3: Stripe - create Checkout session
            const checkout = await dispatch(
                createCheckoutSession(booking._id)
            ).unwrap();

            // STEP 4: Redirect to Stripe Checkout
            window.location.assign(checkout.url);
        } catch (error) {
            console.error('Booking or payment failed:', error);
        }
    };

    // ============================================
    // INVALID BOOKING DETAILS
    // ============================================

    if (!validBookingDetails) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Invalid booking details
                    </h1>

                    <p className="mt-3 text-sm text-slate-600">
                        Please return to the tour page and select a valid
                        booking date and number of participants.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Back to tour
                    </button>
                </div>
            </main>
        );
    }

    // ============================================
    // UI
    // ============================================

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* HEADER */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="group mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-blue-50 hover:text-blue-600"
                    >
                        <span aria-hidden="true">←</span>
                        Back to tour
                    </button>

                    <div className="mb-2 inline-block rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                        Secure Checkout
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Complete your booking
                    </h1>

                    <p className="mt-2 text-base text-slate-500">
                        Review your itinerary, choose your preferred schedule,
                        and enter your details below.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* LEFT SIDE */}
                    <section className="space-y-6 lg:col-span-2">
                        {/* TOUR DETAILS */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                            {detailsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                                    <span className="ml-3 text-sm text-slate-500">
                                        Loading tour details...
                                    </span>
                                </div>
                            ) : tourError ? (
                                <div className="p-6 text-sm text-red-600">
                                    {tourError}
                                </div>
                            ) : tour ? (
                                <>
                                    {primaryImage?.url && (
                                        <div className="h-56 overflow-hidden bg-slate-100 sm:h-72">
                                            <img
                                                src={primaryImage.url}
                                                alt={tour.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="p-6 sm:p-8">
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                            Your selected experience
                                        </span>

                                        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                            {tour.title}
                                        </h2>

                                        {destination && (
                                            <p className="mt-2 text-sm text-slate-500">
                                                📍 {destination}
                                            </p>
                                        )}

                                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Duration
                                                </p>
                                                <p className="mt-2 font-bold text-slate-800">
                                                    {formatDuration(
                                                        tour.durationMinutes
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Difficulty
                                                </p>
                                                <p className="mt-2 font-bold capitalize text-slate-800">
                                                    {tour.difficultyLevel ||
                                                        'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-sm text-slate-500">
                                    Tour details are not available.
                                </div>
                            )}
                        </div>

                        {/* TRIP ITINERARY AND CANCELLATION */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                        1
                                    </span>
                                    Your Trip Itinerary
                                </h2>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Selected Date
                                    </p>
                                    <p className="mt-2 text-sm font-bold text-slate-800">
                                        {formatDate(selectedDate)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Participants
                                    </p>
                                    <p className="mt-2 text-sm font-bold text-slate-800">
                                        {participants}{' '}
                                        {participants === 1
                                            ? 'Guest'
                                            : 'Guests'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                                    🛡️ Cancellation Policy
                                </h3>

                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-emerald-800">
                                    {cancellationPolicy}
                                </p>

                                {typeof freeCancellationHours === 'number' && (
                                    <p className="mt-3 border-t border-emerald-200 pt-3 text-xs font-semibold text-emerald-800">
                                        Free cancellation period:{' '}
                                        {freeCancellationHours}{' '}
                                        {freeCancellationHours === 1
                                            ? 'hour'
                                            : 'hours'}{' '}
                                        before the tour.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* AVAILABLE TIME SLOTS */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                    2
                                </span>
                                Check Availability
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select an available date for your tour.
                            </p>

                            {slotsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                                    <span className="ml-3 text-sm text-slate-500">
                                        Checking availability...
                                    </span>
                                </div>
                            ) : slotsError ? (
                                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                                    {slotsError}
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="mt-5 rounded-2xl bg-amber-50 p-5">
                                    <p className="font-semibold text-amber-800">
                                        No availability
                                    </p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        There is no availability for your
                                        selected date and number of
                                        participants. Please choose another
                                        date.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    {slots.map((slot) => {
                                        const isSelected =
                                            selectedSlotId === slot._id;
                                        const remaining =
                                            slot.capacity - slot.reservedCount;

                                        return (
                                            <button
                                                key={slot._id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedSlotId(slot._id)
                                                }
                                                className={`group rounded-2xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-100'
                                                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            Available
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {remaining} spots
                                                            remaining
                                                        </p>
                                                    </div>

                                                    {isSelected && (
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 border-t border-slate-100 pt-3">
                                                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                                        Price Per Person
                                                    </p>

                                                    <p className="mt-1 text-lg font-extrabold text-blue-700">
                                                        {formatPrice(
                                                            slot.price,
                                                            slot.currency
                                                        )}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* TRAVELER INFORMATION */}
                        <form
                            id="booking-form"
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                        3
                                    </span>
                                    Traveler Information
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the primary contact person's details
                                    for this booking. You can edit these details
                                    before confirming.
                                </p>
                            </div>

                            <div className="mt-6 space-y-5">
                                {/* FULL NAME */}
                                <div>
                                    <label
                                        htmlFor="fullName"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Full name{' '}
                                        <span className="text-blue-600">*</span>
                                    </label>

                                    <input
                                        id="fullName"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="e.g. Rahul Sharma"
                                        {...register('fullName')}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.fullName && (
                                        <p className="mt-1.5 text-sm font-medium text-red-600">
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                {/* EMAIL */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Email address{' '}
                                        <span className="text-blue-600">*</span>
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="rahul@example.com"
                                        {...register('email')}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.email && (
                                        <p className="mt-1.5 text-sm font-medium text-red-600">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* PHONE */}
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Phone number{' '}
                                        <span className="text-blue-600">*</span>
                                    </label>

                                    <input
                                        id="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="+91 98765 43210"
                                        {...register('phone')}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.phone && (
                                        <p className="mt-1.5 text-sm font-medium text-red-600">
                                            {errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                {/* SPECIAL REQUESTS */}
                                <div>
                                    <label
                                        htmlFor="specialRequests"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Special requests{' '}
                                        <span className="font-normal text-slate-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <textarea
                                        id="specialRequests"
                                        rows={4}
                                        maxLength={1000}
                                        placeholder="Any dietary requirements, accessibility needs, pickup preferences, or other requests?"
                                        {...register('specialRequests')}
                                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.specialRequests && (
                                        <p className="mt-1.5 text-sm font-medium text-red-600">
                                            {errors.specialRequests.message}
                                        </p>
                                    )}

                                    <p className="mt-1 text-xs text-slate-400">
                                        Maximum 1000 characters.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* RIGHT SIDE: BOOKING SUMMARY */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50">
                            <h2 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">
                                Booking Summary
                            </h2>

                            {tour && (
                                <div className="mt-5 border-b border-slate-100 pb-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Experience
                                    </p>
                                    <p className="mt-2 font-bold text-slate-900">
                                        {tour.title}
                                    </p>
                                </div>
                            )}

                            <div className="mt-5 space-y-4 text-sm">
                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-500">Date</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {formatDate(selectedDate)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-500">
                                        Participants
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {participants}{' '}
                                        {participants === 1
                                            ? 'Guest'
                                            : 'Guests'}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-500">
                                        Duration
                                    </span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {formatDuration(tour?.durationMinutes)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-500">
                                        Time Slot
                                    </span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {selectedSlot
                                            ? `${formatTime(selectedSlot.startAt)} – ${formatTime(
                                                  selectedSlot.endAt
                                              )}`
                                            : 'Not selected'}
                                    </span>
                                </div>

                                <div className="border-t border-dashed border-slate-200 pt-4">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">
                                            Price per person
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedSlot
                                                ? formatPrice(
                                                      pricePerPerson,
                                                      selectedSlot.currency
                                                  )
                                                : '—'}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex justify-between gap-3">
                                        <span className="text-slate-500">
                                            Guests multiplier
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            × {participants}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-base font-bold text-slate-900">
                                            Total price
                                        </span>

                                        <span className="text-2xl font-black text-blue-700">
                                            {selectedSlot
                                                ? formatPrice(
                                                      totalPrice,
                                                      selectedSlot.currency
                                                  )
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PAYMENT METHOD SELECTION */}
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Choose Payment Method
                                </h3>

                                <div className="mt-3 space-y-3">
                                    {/* ONLINE PAYMENT */}
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === 'stripe'
                                                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                                                : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="stripe"
                                            checked={paymentMethod === 'stripe'}
                                            onChange={() =>
                                                setPaymentMethod('stripe')
                                            }
                                            className="mt-1 h-4 w-4 accent-blue-600"
                                        />

                                        <span className="flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-800">
                                                    Online Payment
                                                </span>
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">
                                                    STRIPE
                                                </span>
                                            </span>

                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                Pay securely online using your
                                                card through Stripe.
                                            </span>
                                        </span>
                                    </label>

                                    {/* CASH ON DELIVERY */}
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === 'cash'
                                                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                                                : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={() =>
                                                setPaymentMethod('cash')
                                            }
                                            className="mt-1 h-4 w-4 accent-blue-600"
                                        />

                                        <span className="flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-800">
                                                    Cash on Delivery
                                                </span>
                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                                    COD
                                                </span>
                                            </span>

                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                Pay the tour operator in cash
                                                according to the operator's
                                                payment policy.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* BOOKING ERROR */}
                            {bookingError && (
                                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                                    {bookingError}
                                </div>
                            )}

                            {/* PAYMENT ERROR */}
                            {paymentMethod === 'stripe' && paymentError && (
                                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                                    {paymentError}
                                    <p className="mt-1 text-xs">
                                        Your booking may already have been
                                        created. Check My Bookings before trying
                                        again.
                                    </p>
                                </div>
                            )}

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                form="booking-form"
                                disabled={
                                    submitting ||
                                    paymentLoading ||
                                    slotsLoading ||
                                    detailsLoading ||
                                    !tour ||
                                    !selectedSlot ||
                                    slots.length === 0
                                }
                                className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? 'Creating your booking...'
                                    : paymentLoading
                                      ? 'Preparing secure payment...'
                                      : paymentMethod === 'stripe'
                                        ? 'Continue to Payment'
                                        : 'Confirm Booking'}
                            </button>

                            {/* PAYMENT INFORMATION */}
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                {paymentMethod === 'stripe' ? (
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        🔒 Secure payment powered by Stripe. You
                                        will be redirected to Stripe Checkout to
                                        complete your payment.
                                    </p>
                                ) : (
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        💵 You have selected cash payment.
                                        Payment will remain pending until the
                                        operator receives and records the cash.
                                    </p>
                                )}
                            </div>

                            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                                {paymentMethod === 'stripe' ? (
                                    <>
                                        <span>💳</span>
                                        <span>Secure card payments</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💵</span>
                                        <span>
                                            Cash payment to tour operator
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

// ============================================
// PAGE WRAPPER
// ============================================

export default function BookingPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-slate-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                </div>
            }
        >
            <BookingPageContent />
        </Suspense>
    );
}
