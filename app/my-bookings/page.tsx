'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';

import {
    fetchMyBookings,
    cancelBooking,
    clearBookingMessages,
    type Booking,
    type BookingStatus,
} from '@/redux/slices/bookingSlice';

import {
    createReview,
    fetchMyReviews,
    clearReviewMessages,
    type Review,
} from '@/redux/slices/reviewSlice';

import {
    FiCalendar,
    FiClock,
    FiUsers,
    FiMapPin,
    FiCreditCard,
    FiXCircle,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiArrowRight,
    FiChevronLeft,
    FiChevronRight,
    FiX,
    FiImage,
    FiStar,
    FiMessageSquare,
} from 'react-icons/fi';

// ============================================
// HELPERS
// ============================================

const formatDate = (date?: string) => {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatTime = (date?: string) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return '';
    }

    return parsedDate.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatPrice = (amount: number, currency: string) => {
    return `${currency || 'INR'} ${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
        case 'confirmed':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';

        case 'pending':
            return 'bg-amber-50 text-amber-700 border-amber-100';

        case 'completed':
            return 'bg-blue-50 text-blue-700 border-blue-100';

        case 'cancelled':
            return 'bg-slate-100 text-slate-600 border-slate-200';

        case 'rejected':
            return 'bg-rose-50 text-rose-700 border-rose-100';

        default:
            return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getPaymentStyles = (status: string) => {
    switch (status) {
        case 'paid':
            return 'text-emerald-700 bg-emerald-50';

        case 'failed':
            return 'text-rose-700 bg-rose-50';

        case 'refunded':
            return 'text-blue-700 bg-blue-50';

        default:
            return 'text-amber-700 bg-amber-50';
    }
};

// Supports both populated and unpopulated bookingId.
const getReviewBookingId = (review: Review): string => {
    return typeof review.bookingId === 'string'
        ? review.bookingId
        : review.bookingId._id;
};

const getReviewStatusStyles = (status: Review['status']) => {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-700';

        case 'rejected':
            return 'bg-rose-50 text-rose-700';

        case 'hidden':
            return 'bg-slate-100 text-slate-600';

        default:
            return 'bg-amber-50 text-amber-700';
    }
};

// ============================================
// COMPONENT
// ============================================

export default function MyBookingsPage() {
    const dispatch = useDispatch<AppDispatch>();

    // BOOKING REDUX STATE
    const {
        bookings,
        loading,
        submitting,
        error,
        successMessage,
        total,
        page,
        totalPages,
    } = useSelector((state: RootState) => state.bookings);

    // REVIEW REDUX STATE
    const {
        reviews,
        loading: reviewLoading,
        submitting: reviewSubmitting,
        error: reviewError,
    } = useSelector((state: RootState) => state.reviews);

    // PAGE STATE
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>(
        'all'
    );

    const [currentPage, setCurrentPage] = useState(1);

    // CANCELLATION STATE
    const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

    const [cancellationReason, setCancellationReason] = useState('');
    const [cancelError, setCancelError] = useState('');

    // REVIEW STATE
    const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewFormError, setReviewFormError] = useState('');

    const pageSize = 10;

    // ============================================
    // FETCH BOOKINGS
    // ============================================

    useEffect(() => {
        dispatch(
            fetchMyBookings({
                page: currentPage,
                limit: pageSize,
                ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
            })
        );
    }, [dispatch, currentPage, selectedStatus]);

    // ============================================
    // FETCH MY REVIEWS
    // ============================================

    useEffect(() => {
        dispatch(fetchMyReviews());
    }, [dispatch]);

    // CLEAR MESSAGES WHEN LEAVING PAGE
    useEffect(() => {
        return () => {
            dispatch(clearBookingMessages());
            dispatch(clearReviewMessages());
        };
    }, [dispatch]);

    // ============================================
    // EXISTING REVIEW LOOKUP
    // ============================================

    const reviewedBookingIds = useMemo(() => {
        return new Set(reviews.map((review) => getReviewBookingId(review)));
    }, [reviews]);

    const getBookingReview = (bookingId: string) => {
        return reviews.find(
            (review) => getReviewBookingId(review) === bookingId
        );
    };

    // ============================================
    // STATUS FILTER
    // ============================================

    const handleStatusChange = (status: BookingStatus | 'all') => {
        setSelectedStatus(status);
        setCurrentPage(1);
        dispatch(clearBookingMessages());
    };

    // ============================================
    // CANCEL BOOKING
    // ============================================

    const handleCancelBooking = async () => {
        if (!cancelTarget) return;

        setCancelError('');

        try {
            await dispatch(
                cancelBooking({
                    bookingId: cancelTarget._id,
                    cancellationReason: cancellationReason.trim(),
                })
            ).unwrap();

            setCancelTarget(null);
            setCancellationReason('');
        } catch (cancelRequestError) {
            setCancelError(
                typeof cancelRequestError === 'string'
                    ? cancelRequestError
                    : 'Unable to cancel your booking. Please try again.'
            );
        }
    };

    // ============================================
    // OPEN REVIEW MODAL
    // ============================================

    const openReviewModal = (booking: Booking) => {
        setReviewTarget(booking);
        setRating(5);
        setComment('');
        setReviewFormError('');
        dispatch(clearReviewMessages());
    };

    // ============================================
    // SUBMIT REVIEW
    // ============================================

    const handleSubmitReview = async () => {
        if (!reviewTarget) return;

        const trimmedComment = comment.trim();

        if (rating < 1 || rating > 5) {
            setReviewFormError('Please select a rating from 1 to 5.');
            return;
        }

        if (trimmedComment.length < 5) {
            setReviewFormError(
                'Your review must contain at least 5 characters.'
            );
            return;
        }

        if (trimmedComment.length > 2000) {
            setReviewFormError('Your review cannot exceed 2000 characters.');
            return;
        }

        setReviewFormError('');

        try {
            await dispatch(
                createReview({
                    bookingId: reviewTarget._id,
                    rating,
                    comment: trimmedComment,
                })
            ).unwrap();

            // Refresh existing reviews after successful submission.
            await dispatch(fetchMyReviews()).unwrap();

            setReviewTarget(null);
            setRating(5);
            setComment('');
        } catch (submitError) {
            setReviewFormError(
                typeof submitError === 'string'
                    ? submitError
                    : 'Unable to submit your review. Please try again.'
            );
        }
    };

    // ============================================
    // PAGINATION
    // ============================================

    const handlePreviousPage = () => {
        setCurrentPage((previous) => Math.max(1, previous - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((previous) => Math.min(totalPages, previous + 1));
    };

    // ============================================
    // LOADING STATE
    // ============================================

    if (loading && bookings.length === 0) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                    <p className="text-sm font-semibold text-slate-600">
                        Loading your bookings...
                    </p>
                </div>
            </main>
        );
    }

    // ============================================
    // MAIN PAGE
    // ============================================

    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* PAGE HEADER */}
                <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 sm:p-9">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                                Your Tripora account
                            </p>

                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                My Bookings
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                                Manage your adventures, track booking requests
                                and keep all your travel plans in one place.
                            </p>
                        </div>

                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-inner backdrop-blur">
                            <FiCalendar size={36} />
                        </div>
                    </div>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
                            <p className="text-xs font-medium text-blue-100">
                                Total bookings
                            </p>

                            <p className="mt-1 text-2xl font-black">{total}</p>
                        </div>

                        <Link
                            href="/toures&activities"
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                            Explore experiences
                            <FiArrowRight size={17} />
                        </Link>
                    </div>
                </section>

                {/* BOOKING SUCCESS MESSAGE */}
                {successMessage && (
                    <div
                        role="status"
                        className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
                    >
                        <FiCheckCircle size={19} />
                        {successMessage}
                    </div>
                )}

                {/* BOOKING ERROR MESSAGE */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
                    >
                        <FiAlertCircle size={19} />
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => {
                                dispatch(
                                    fetchMyBookings({
                                        page: currentPage,
                                        limit: pageSize,
                                        ...(selectedStatus !== 'all'
                                            ? { status: selectedStatus }
                                            : {}),
                                    })
                                );
                            }}
                            className="ml-auto font-bold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* FILTERS */}
                <section className="mb-6 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                Your reservations
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Filter bookings by their current status.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                dispatch(
                                    fetchMyBookings({
                                        page: currentPage,
                                        limit: pageSize,
                                        ...(selectedStatus !== 'all'
                                            ? { status: selectedStatus }
                                            : {}),
                                    })
                                );

                                dispatch(fetchMyReviews());
                            }}
                            disabled={loading || reviewLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <FiRefreshCw
                                className={
                                    loading || reviewLoading
                                        ? 'animate-spin'
                                        : ''
                                }
                                size={14}
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {(
                            [
                                'all',
                                'pending',
                                'confirmed',
                                'completed',
                                'cancelled',
                                'rejected',
                            ] as const
                        ).map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(status)}
                                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition ${
                                    selectedStatus === status
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                {status === 'all' ? 'All bookings' : status}
                            </button>
                        ))}
                    </div>
                </section>

                {/* BOOKING LIST */}
                <section className="space-y-5">
                    {loading && bookings.length > 0 && (
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                            <FiRefreshCw className="animate-spin" size={16} />
                            Updating bookings...
                        </div>
                    )}

                    {!loading && bookings.length === 0 && !error && (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <FiCalendar size={30} />
                            </div>

                            <h3 className="mt-5 text-xl font-black text-slate-900">
                                No bookings found
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                {selectedStatus === 'all'
                                    ? "You haven't booked any experiences yet. Explore our tours and start planning your next adventure."
                                    : `You don't have any ${selectedStatus} bookings at the moment.`}
                            </p>

                            <Link
                                href="/toures&activities"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                            >
                                Explore tours
                                <FiArrowRight size={17} />
                            </Link>
                        </div>
                    )}

                    {bookings.map((booking) => {
                        const tour =
                            typeof booking.tourId === 'object'
                                ? booking.tourId
                                : null;

                        const slot =
                            typeof booking.availabilitySlotId === 'object'
                                ? booking.availabilitySlotId
                                : null;

                        const tourImage = tour?.images?.[0]?.url;

                        const canCancel =
                            booking.status === 'pending' ||
                            booking.status === 'confirmed';

                        const existingReview = getBookingReview(booking._id);

                        const canReview =
                            booking.status === 'completed' &&
                            !reviewLoading &&
                            !reviewedBookingIds.has(booking._id);

                        return (
                            <article
                                key={booking._id}
                                className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-900/[0.05]"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
                                    {/* TOUR IMAGE */}
                                    <div className="relative h-52 overflow-hidden bg-slate-100 lg:h-full lg:min-h-[270px]">
                                        {tourImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={tourImage}
                                                alt={
                                                    tour?.title || 'Booked tour'
                                                }
                                                className="h-full w-full object-cover transition duration-700 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-slate-400">
                                                <FiImage size={40} />
                                            </div>
                                        )}

                                        <div className="absolute left-4 top-4 rounded-xl bg-black/50 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                                            {booking.bookingReference}
                                        </div>
                                    </div>

                                    {/* BOOKING DETAILS */}
                                    <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6">
                                        <div>
                                            {/* TITLE AND STATUS */}
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                                                        Booking reference
                                                    </p>

                                                    <h3 className="mt-1 break-all text-lg font-black text-slate-900 sm:text-xl">
                                                        {
                                                            booking.bookingReference
                                                        }
                                                    </h3>

                                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                                        {tour?.title ||
                                                            'Tour details unavailable'}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${getStatusStyles(
                                                        booking.status
                                                    )}`}
                                                >
                                                    {booking.status}
                                                </span>
                                            </div>

                                            {/* BOOKING INFORMATION */}
                                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                                        <FiCalendar size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Travel date
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                                            {formatDate(
                                                                booking.travelDate
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                                        <FiClock size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Time
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                                            {slot?.startAt
                                                                ? formatTime(
                                                                      slot.startAt
                                                                  )
                                                                : 'Not available'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                                        <FiUsers size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Participants
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                                            {
                                                                booking.participants
                                                            }{' '}
                                                            {booking.participants ===
                                                            1
                                                                ? 'Person'
                                                                : 'People'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                                        <FiCreditCard
                                                            size={18}
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Payment
                                                        </p>

                                                        <span
                                                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${getPaymentStyles(
                                                                booking.paymentStatus
                                                            )}`}
                                                        >
                                                            {
                                                                booking.paymentStatus
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                                                        <FiMapPin size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Booked on
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                                            {formatDate(
                                                                booking.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CANCELLATION REASON */}
                                            {booking.cancellationReason && (
                                                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3">
                                                    <p className="text-xs font-bold text-rose-700">
                                                        Cancellation reason
                                                    </p>

                                                    <p className="mt-1 text-sm text-rose-600">
                                                        {
                                                            booking.cancellationReason
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {/* REVIEW STATUS */}
                                            {existingReview && (
                                                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                    <FiStar
                                                        className="text-amber-500"
                                                        size={17}
                                                    />

                                                    <span className="text-xs font-bold text-slate-700">
                                                        Your review
                                                    </span>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${getReviewStatusStyles(
                                                            existingReview.status
                                                        )}`}
                                                    >
                                                        {existingReview.status}
                                                    </span>

                                                    <span className="text-xs text-slate-500">
                                                        {existingReview.rating}
                                                        /5 stars
                                                    </span>

                                                    {existingReview.status ===
                                                        'pending' && (
                                                        <span className="w-full text-xs text-slate-500">
                                                            Your review is
                                                            waiting for
                                                            moderation.
                                                        </span>
                                                    )}

                                                    {existingReview.status ===
                                                        'rejected' && (
                                                        <span className="w-full text-xs text-rose-600">
                                                            Your review was
                                                            rejected. You can
                                                            delete it from your
                                                            reviews before
                                                            submitting another
                                                            one.
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* PRICE AND ACTIONS */}
                                        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Total booking amount
                                                </p>

                                                <p className="mt-1 text-xl font-black text-blue-700">
                                                    {formatPrice(
                                                        booking.totalPrice,
                                                        booking.currency
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {formatPrice(
                                                        booking.pricePerParticipant,
                                                        booking.currency
                                                    )}{' '}
                                                    per person
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {tour?._id && (
                                                    <Link
                                                        href={`/toures&activities/${tour._id}`}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        View tour
                                                        <FiArrowRight
                                                            size={14}
                                                        />
                                                    </Link>
                                                )}

                                                {/* WRITE A REVIEW */}
                                                {canReview && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openReviewModal(
                                                                booking
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
                                                    >
                                                        <FiStar size={15} />
                                                        Write a Review
                                                    </button>
                                                )}

                                                {canCancel && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCancelTarget(
                                                                booking
                                                            );
                                                            setCancellationReason(
                                                                ''
                                                            );
                                                            setCancelError('');
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        <FiXCircle size={15} />
                                                        Cancel booking
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500">
                            Page {page} of {totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePreviousPage}
                                disabled={currentPage <= 1 || loading}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <FiChevronLeft size={16} />
                                Previous
                            </button>

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={currentPage >= totalPages || loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================
          WRITE REVIEW MODAL
      ======================================== */}

            {reviewTarget && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !reviewSubmitting
                        ) {
                            setReviewTarget(null);
                            setReviewFormError('');
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="write-review-title"
                        className="w-full max-w-lg rounded-3xl border border-white/50 bg-white p-6 shadow-2xl sm:p-8"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                                <FiStar size={24} />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setReviewTarget(null);
                                    setReviewFormError('');
                                }}
                                disabled={reviewSubmitting}
                                aria-label="Close review dialog"
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <h2
                            id="write-review-title"
                            className="mt-5 text-xl font-black text-slate-900"
                        >
                            Write a Review
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Share your experience with{' '}
                            <span className="font-bold text-slate-800">
                                {reviewTarget.bookingReference}
                            </span>
                            .
                        </p>

                        {/* RATING */}
                        <div className="mt-6">
                            <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Your rating
                            </label>

                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        disabled={reviewSubmitting}
                                        aria-label={`Rate ${star} out of 5`}
                                        className="rounded-lg p-1 transition hover:scale-110 disabled:cursor-not-allowed"
                                    >
                                        <FiStar
                                            size={32}
                                            className={
                                                star <= rating
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-300'
                                            }
                                        />
                                    </button>
                                ))}

                                <span className="ml-2 text-sm font-bold text-slate-700">
                                    {rating}/5
                                </span>
                            </div>
                        </div>

                        {/* COMMENT */}
                        <div className="mt-6">
                            <label
                                htmlFor="review-comment"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                            >
                                Your experience
                            </label>

                            <div className="relative">
                                <FiMessageSquare
                                    className="absolute left-4 top-4 text-slate-400"
                                    size={17}
                                />

                                <textarea
                                    id="review-comment"
                                    rows={5}
                                    value={comment}
                                    onChange={(event) => {
                                        setComment(event.target.value);
                                        setReviewFormError('');
                                    }}
                                    disabled={reviewSubmitting}
                                    placeholder="Tell other travelers about your experience..."
                                    maxLength={2000}
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                                />
                            </div>

                            <p className="mt-2 text-right text-xs text-slate-400">
                                {comment.length}/2000 characters
                            </p>
                        </div>

                        {/* REVIEW ERROR */}
                        {(reviewFormError || reviewError) && (
                            <p
                                role="alert"
                                className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700"
                            >
                                {reviewFormError || reviewError}
                            </p>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setReviewTarget(null);
                                    setReviewFormError('');
                                }}
                                disabled={reviewSubmitting}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitting}
                                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {reviewSubmitting
                                    ? 'Submitting...'
                                    : 'Submit Review'}
                            </button>
                        </div>

                        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                            Your review will be submitted for moderation before
                            it appears publicly.
                        </p>
                    </div>
                </div>
            )}

            {/* ========================================
          CANCEL BOOKING MODAL
      ======================================== */}

            {cancelTarget && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !submitting
                        ) {
                            setCancelTarget(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-booking-title"
                        className="w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-2xl sm:p-7"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                                <FiXCircle size={24} />
                            </div>

                            <button
                                type="button"
                                onClick={() => setCancelTarget(null)}
                                disabled={submitting}
                                aria-label="Close cancellation dialog"
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <h2
                            id="cancel-booking-title"
                            className="mt-5 text-xl font-black text-slate-900"
                        >
                            Cancel this booking?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Are you sure you want to cancel booking{' '}
                            <span className="font-bold text-slate-800">
                                {cancelTarget.bookingReference}
                            </span>
                            ? Please provide a reason if applicable.
                        </p>

                        <div className="mt-5">
                            <label
                                htmlFor="cancellation-reason"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                            >
                                Cancellation reason (optional)
                            </label>

                            <textarea
                                id="cancellation-reason"
                                rows={3}
                                value={cancellationReason}
                                onChange={(event) =>
                                    setCancellationReason(event.target.value)
                                }
                                placeholder="Tell us why you want to cancel..."
                                maxLength={500}
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>

                        {cancelError && (
                            <p
                                role="alert"
                                className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700"
                            >
                                {cancelError}
                            </p>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setCancelTarget(null)}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Keep booking
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelBooking}
                                disabled={submitting}
                                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? 'Cancelling...' : 'Yes, cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
