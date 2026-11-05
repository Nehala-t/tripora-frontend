'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiStar,
    FiMessageSquare,
    FiCalendar,
    FiTrash2,
    FiArrowLeft,
    FiMapPin,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiEyeOff,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '@/redux/store';

import {
    fetchMyReviews,
    deleteReview,
    clearReviewMessages,
    type Review,
    type ReviewStatus,
} from '@/redux/slices/reviewSlice';

// ============================================
// POPULATED BACKEND RESPONSE TYPES
// ============================================

interface PopulatedTour {
    _id?: string;
    title?: string;
    slug?: string;
    images?: {
        url?: string;
        publicId?: string;
    }[];
}

interface PopulatedBooking {
    _id?: string;
    bookingReference?: string;
    status?: string;
}

// Backend populates tourId and bookingId.
// The Redux Review interface also supports their string form.
const getTour = (review: Review): PopulatedTour | null => {
    const value: unknown = review.tourId;

    if (value && typeof value === 'object') {
        return value as PopulatedTour;
    }

    return null;
};

const getBooking = (review: Review): PopulatedBooking | null => {
    const value: unknown = review.bookingId;

    if (value && typeof value === 'object') {
        return value as PopulatedBooking;
    }

    return null;
};

// ============================================
// STATUS CONFIGURATION
// ============================================

const statusConfig: Record<
    ReviewStatus,
    {
        label: string;
        className: string;
        icon: React.ReactNode;
    }
> = {
    pending: {
        label: 'Pending Review',
        className: 'bg-amber-50 text-amber-700 ring-amber-200',
        icon: <FiClock size={13} />,
    },
    approved: {
        label: 'Approved',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        icon: <FiCheckCircle size={13} />,
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 ring-red-200',
        icon: <FiXCircle size={13} />,
    },
    hidden: {
        label: 'Hidden',
        className: 'bg-slate-100 text-slate-600 ring-slate-200',
        icon: <FiEyeOff size={13} />,
    },
};

// ============================================
// HELPERS
// ============================================

const formatDate = (date: string) => {
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

const getStatus = (status: string): ReviewStatus => {
    if (
        status === 'pending' ||
        status === 'approved' ||
        status === 'rejected' ||
        status === 'hidden'
    ) {
        return status;
    }

    return 'pending';
};

// ============================================
// MY REVIEWS PAGE
// ============================================

export default function MyReviewsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
        null
    );

    const { reviews, loading, deleting, error } = useSelector(
        (state: RootState) => state.reviews
    );

    useEffect(() => {
        dispatch(clearReviewMessages());

        dispatch(fetchMyReviews())
            .unwrap()
            .catch((error) => {
                toast.error(
                    typeof error === 'string' ? error : 'Failed to load reviews'
                );
            });
    }, [dispatch]);

    // ============================================
    // DELETE REVIEW
    // ============================================

    // ============================================
    // DELETE REVIEW MODAL
    // ============================================

    const openDeleteModal = (reviewId: string) => {
        setSelectedReviewId(reviewId);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setSelectedReviewId(null);
    };

    const handleDeleteReview = async () => {
        if (!selectedReviewId) return;

        try {
            await dispatch(deleteReview(selectedReviewId)).unwrap();

            toast.success('Review deleted successfully!');

            setShowDeleteModal(false);
            setSelectedReviewId(null);
        } catch (error) {
            toast.error(
                typeof error === 'string' ? error : 'Failed to delete review'
            );
        }
    };

    // ============================================
    // REVIEW COUNTS
    // ============================================

    const pendingCount = reviews.filter(
        (review) => review.status === 'pending'
    ).length;

    const approvedCount = reviews.filter(
        (review) => review.status === 'approved'
    ).length;

    const totalReviews = reviews.length;

    return (
        <main className="min-h-screen bg-slate-50 pb-16">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <Link
                        href="/profile"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
                    >
                        <FiArrowLeft size={16} />
                        Back to Profile
                    </Link>

                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                                <FiStar size={13} />
                                YOUR TRAVEL EXPERIENCES
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                                My Reviews
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                                Your travel stories matter. View and manage the
                                reviews you have shared with the Tripora
                                community.
                            </p>
                        </div>

                        <Link
                            href="/toures&activities"
                            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                            <FiMapPin size={16} />
                            Explore Tours
                        </Link>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* SUMMARY CARDS */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                Total Reviews
                            </p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiMessageSquare size={19} />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-slate-900">
                            {totalReviews}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Reviews you have submitted
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                Approved Reviews
                            </p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <FiCheckCircle size={19} />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-slate-900">
                            {approvedCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Approved and published reviews
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                Pending Reviews
                            </p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <FiClock size={19} />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-slate-900">
                            {pendingCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Waiting for moderation
                        </p>
                    </div>
                </div>

                {/* SECTION HEADING */}
                <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">
                            Your Submitted Reviews
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All your tour feedback in one place.
                        </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-500">
                        {totalReviews}{' '}
                        {totalReviews === 1 ? 'Review' : 'Reviews'}
                    </span>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="space-y-5">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <div className="flex gap-4">
                                    <div className="h-24 w-28 rounded-xl bg-slate-200" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/3 rounded bg-slate-200" />
                                        <div className="h-3 w-1/4 rounded bg-slate-200" />
                                        <div className="h-3 w-full rounded bg-slate-200" />
                                        <div className="h-3 w-2/3 rounded bg-slate-200" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* EMPTY STATE */}
                {!loading && reviews.length === 0 && !error && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiStar size={34} />
                        </div>

                        <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                            No reviews yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Once you complete a tour booking, you can share your
                            experience and help other travellers choose their
                            next adventure.
                        </p>

                        <Link
                            href="/my-bookings"
                            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            View My Bookings
                        </Link>
                    </div>
                )}

                {/* REVIEW LIST */}
                {!loading && reviews.length > 0 && (
                    <div className="space-y-5">
                        {reviews.map((review) => {
                            const tour = getTour(review);
                            const booking = getBooking(review);

                            const tourTitle = tour?.title || 'Tour Experience';
                            const tourImage = tour?.images?.[0]?.url;

                            const reviewStatus = getStatus(review.status);
                            const status = statusConfig[reviewStatus];

                            const canDelete =
                                reviewStatus === 'pending' ||
                                reviewStatus === 'rejected';

                            return (
                                <article
                                    key={review._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="p-5 sm:p-6">
                                        {/* TOUR DETAILS */}
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-36">
                                                {tourImage ? (
                                                    <Image
                                                        src={tourImage}
                                                        alt={tourTitle}
                                                        fill
                                                        unoptimized
                                                        sizes="(max-width: 640px) 100vw, 144px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-slate-400">
                                                        <FiMapPin size={30} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${status.className}`}
                                                    >
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <h3 className="mt-3 text-lg font-extrabold text-slate-900">
                                                    {tourTitle}
                                                </h3>

                                                {booking?.bookingReference && (
                                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                                        Booking ID:{' '}
                                                        <span className="font-bold text-slate-700">
                                                            {
                                                                booking.bookingReference
                                                            }
                                                        </span>
                                                    </p>
                                                )}

                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <FiCalendar size={13} />
                                                        {formatDate(
                                                            review.createdAt
                                                        )}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1.5">
                                                        <FiStar
                                                            size={13}
                                                            className="fill-amber-400 text-amber-400"
                                                        />
                                                        {review.rating}/5 Rating
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RATING STARS */}
                                        <div className="mt-5 flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <FiStar
                                                    key={star}
                                                    size={19}
                                                    className={
                                                        star <= review.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-200'
                                                    }
                                                />
                                            ))}

                                            <span className="ml-2 text-sm font-bold text-slate-700">
                                                {review.rating}.0
                                            </span>
                                        </div>

                                        {/* REVIEW COMMENT */}
                                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm leading-7 text-slate-700">
                                                {review.comment}
                                            </p>
                                        </div>

                                        {/* MODERATION NOTE */}
                                        {review.moderationNote && (
                                            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                                                <p className="text-xs font-bold text-amber-800">
                                                    Moderation Note
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-amber-700">
                                                    {review.moderationNote}
                                                </p>
                                            </div>
                                        )}

                                        {/* FOOTER ACTIONS */}
                                        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                                            <p className="text-xs text-slate-400">
                                                {reviewStatus === 'pending'
                                                    ? 'Your review is waiting for approval.'
                                                    : reviewStatus ===
                                                        'approved'
                                                      ? 'Your review has been approved.'
                                                      : reviewStatus ===
                                                          'rejected'
                                                        ? 'Your review was rejected.'
                                                        : 'This review is currently hidden.'}
                                            </p>

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            review._id
                                                        )
                                                    }
                                                    disabled={deleting}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <FiTrash2 size={14} />
                                                    {deleting
                                                        ? 'Deleting...'
                                                        : 'Delete Review'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
                    onClick={closeDeleteModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-review-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* ICON */}
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <FiTrash2 size={25} />
                        </div>

                        {/* CONTENT */}
                        <div className="mt-5 text-center">
                            <h2
                                id="delete-review-title"
                                className="text-xl font-extrabold text-slate-900"
                            >
                                Delete Review?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Are you sure you want to delete this review?
                                This action cannot be undone.
                            </p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteReview}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FiTrash2 size={15} />
                                {deleting ? 'Deleting...' : 'Delete Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
