'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import img from '../../public/images/hero/trip-hero.png';

import { fetchAllTours, type Tour } from '../../redux/slices/tourSlice';

import {
    fetchMyWishlist,
    addToWishlist,
    removeFromWishlist,
} from '../../redux/slices/wishlistSlice';

import {
    fetchOperatorDestinations,
    fetchOperatorCategories,
} from '../../redux/slices/operatorSlice';

import {
    FiSearch,
    FiMapPin,
    FiArrowRight,
    FiCompass,
    FiSliders,
    FiX,
    FiStar,
    FiHeart,
    FiSun,
    FiMoon,
    FiCalendar,
    FiUsers,
    FiFilter,
} from 'react-icons/fi';

export default function ToursAndActivitiesPage() {
    const dispatch = useDispatch<AppDispatch>();

    // Tours and backend pagination state
    const {
        tours = [],
        toursLoading: loading,
        error,
        total,
        totalPages,
    } = useSelector((state: RootState) => state.tours);

    // Wishlist state
    const { wishlistIds, wishlistChecks, submittingIds } = useSelector(
        (state: RootState) => state.wishlist
    );

    // Destination and category options for dropdowns
    const { destinations = [], categories = [] } = useSelector(
        (state: RootState) => state.operator
    );

    // Search, filter, sorting and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('recommended');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Advanced filters
    const [showFilters, setShowFilters] = useState(false);
    const [destinationId, setDestinationId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minDuration, setMinDuration] = useState('');
    const [maxDuration, setMaxDuration] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [participants, setParticipants] = useState('2');

    const pageSize = 3;

    // Fetch destinations and categories for the dropdowns
    useEffect(() => {
        dispatch(fetchOperatorDestinations());
        dispatch(fetchOperatorCategories());
    }, [dispatch]);

    // Debounce search input
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
            setCurrentPage(1);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch tours from the backend
    useEffect(() => {
        const backendSort =
            sortBy === 'price-low'
                ? 'price_asc'
                : sortBy === 'price-high'
                  ? 'price_desc'
                  : sortBy === 'duration'
                    ? 'duration_asc'
                    : sortBy === 'oldest'
                      ? 'oldest'
                      : sortBy === 'rating'
                        ? 'rating'
                        : 'newest';

        dispatch(
            fetchAllTours({
                page: currentPage,
                limit: pageSize,
                search: debouncedSearch || undefined,
                destinationId: destinationId.trim() || undefined,
                categoryId: categoryId.trim() || undefined,
                minPrice: minPrice !== '' ? Number(minPrice) : undefined,
                maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
                minDuration:
                    minDuration !== '' ? Number(minDuration) : undefined,
                maxDuration:
                    maxDuration !== '' ? Number(maxDuration) : undefined,
                difficultyLevel:
                    selectedDifficulty === 'all'
                        ? undefined
                        : (selectedDifficulty as
                              | 'easy'
                              | 'moderate'
                              | 'challenging'),
                language: selectedLanguage.trim() || undefined,
                date: travelDate || undefined,
                participants:
                    participants !== '' ? Number(participants) : undefined,
                sort: backendSort,
            })
        );
    }, [
        dispatch,
        currentPage,
        debouncedSearch,
        destinationId,
        categoryId,
        minPrice,
        maxPrice,
        minDuration,
        maxDuration,
        selectedDifficulty,
        selectedLanguage,
        travelDate,
        participants,
        sortBy,
    ]);

    // Fetch wishlist
    useEffect(() => {
        dispatch(fetchMyWishlist());
    }, [dispatch]);

    // Add or remove wishlist item
    const handleWishlistToggle = async (
        tourId: string,
        isWishlisted: boolean
    ) => {
        if (submittingIds.includes(tourId)) {
            return;
        }

        try {
            if (isWishlisted) {
                await dispatch(removeFromWishlist(tourId)).unwrap();
            } else {
                await dispatch(addToWishlist(tourId)).unwrap();
            }
        } catch (error) {
            console.error('Wishlist update failed:', error);
        }
    };

    // Clear search and every filter
    const clearAllFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setSelectedDifficulty('all');
        setDestinationId('');
        setCategoryId('');
        setMinPrice('');
        setMaxPrice('');
        setMinDuration('');
        setMaxDuration('');
        setSelectedLanguage('');
        setTravelDate('');
        setParticipants('2');
        setSortBy('recommended');
        setCurrentPage(1);
    };

    const hasAdvancedFilters = Boolean(
        destinationId ||
        categoryId ||
        minPrice ||
        maxPrice ||
        minDuration ||
        maxDuration ||
        selectedLanguage ||
        travelDate ||
        participants !== '2'
    );

    const filteredTours = tours;

    const getImageUrl = (tour: Tour): string | null => {
        return tour.images?.[0]?.url ?? null;
    };

    // Overall tour duration is measured in days and nights
    const renderDurationBadge = (tour: Tour) => {
        const days = tour.durationDays ?? 0;
        const nights = tour.nights ?? 0;

        if (days <= 0) {
            return (
                <span className="text-slate-500">Duration not specified</span>
            );
        }

        return (
            <span className="inline-flex flex-wrap items-center gap-1.5 text-slate-600">
                <FiSun size={14} className="text-amber-500" />
                {days} {days === 1 ? 'Day' : 'Days'}
                {nights > 0 && (
                    <>
                        <span className="text-slate-300">/</span>
                        <FiMoon size={13} className="text-indigo-500" />
                        {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </>
                )}
            </span>
        );
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;

        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-24 font-sans selection:bg-indigo-600 selection:text-white">
            {/* HERO SECTION */}
            <section className="relative isolate flex min-h-[340px] items-center justify-center overflow-hidden bg-indigo-950 py-16 sm:min-h-[380px] lg:min-h-[420px]">
                <div className="absolute inset-0 -z-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={img.src}
                        alt="Scenic travel landscape"
                        className="h-full w-full scale-105 transform object-cover object-center transition-transform duration-1000"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-slate-950/15 to-slate-950/30" />
                <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
                        <FiCompass size={15} className="text-white" />
                        Curated World-Class Adventures
                    </div>

                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl ">
                        Start Your Journey
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-base font-medium text-white">
                        Discover hand-picked activities and unforgettable
                        experiences tailored just for you.
                    </p>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* SEARCH AND FILTERS BAR */}
                <div className="relative z-10 -mt-10 mb-12 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-xl shadow-indigo-950/5 backdrop-blur-xl sm:p-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
                        <div>
                            <label
                                htmlFor="tour-search"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                                Search Destination or Keyword
                            </label>

                            <div className="relative">
                                <FiSearch
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                />

                                <input
                                    id="tour-search"
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Where do you want to go?"
                                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 py-3.5 pl-11 pr-10 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />

                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                    >
                                        <FiX size={15} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="tour-difficulty"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                                Adventure Level
                            </label>

                            <select
                                id="tour-difficulty"
                                value={selectedDifficulty}
                                onChange={(event) => {
                                    setSelectedDifficulty(event.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            >
                                <option value="all">All levels</option>
                                <option value="easy">Easy</option>
                                <option value="moderate">Moderate</option>
                                <option value="challenging">Challenging</option>
                            </select>
                        </div>

                        <div className="flex h-[52px] items-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 text-sm font-bold text-indigo-900">
                            <FiSliders size={16} className="text-indigo-600" />
                            <span>{total} Experiences Found</span>
                        </div>
                    </div>

                    {/* ADVANCED FILTER TOGGLE */}
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                setShowFilters((previous) => !previous)
                            }
                            aria-expanded={showFilters}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                            <FiFilter size={16} />
                            {showFilters ? 'Hide Filters' : 'More Filters'}
                            {showFilters ? (
                                <FiX size={15} />
                            ) : (
                                <FiSliders size={15} />
                            )}

                            {hasAdvancedFilters && (
                                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                            )}
                        </button>
                    </div>

                    {/* ADVANCED FILTER PANEL */}
                    {showFilters && (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                            <div className="mb-5">
                                <h3 className="text-sm font-bold text-slate-800">
                                    Refine your search
                                </h3>
                                <p className="mt-1 text-xs text-slate-600">
                                    Combine filters to find the right tour or
                                    activity.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {/* DESTINATION DROPDOWN */}
                                <div>
                                    <label
                                        htmlFor="destination-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Destination
                                    </label>

                                    <select
                                        id="destination-filter"
                                        value={destinationId}
                                        onChange={(event) => {
                                            setDestinationId(
                                                event.target.value
                                            );
                                            setCurrentPage(1);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        <option value="">
                                            All Destinations
                                        </option>

                                        {destinations.map((destination) => (
                                            <option
                                                key={destination._id}
                                                value={destination._id}
                                            >
                                                {destination.name}
                                                {destination.country
                                                    ? `, ${destination.country}`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* CATEGORY DROPDOWN */}
                                <div>
                                    <label
                                        htmlFor="category-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Category
                                    </label>

                                    <select
                                        id="category-filter"
                                        value={categoryId}
                                        onChange={(event) => {
                                            setCategoryId(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        <option value="">All Categories</option>

                                        {categories.map((category) => (
                                            <option
                                                key={category._id}
                                                value={category._id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* LANGUAGE */}
                                <div>
                                    <label
                                        htmlFor="language-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Language
                                    </label>
                                    <input
                                        id="language-filter"
                                        value={selectedLanguage}
                                        onChange={(event) => {
                                            setSelectedLanguage(
                                                event.target.value
                                            );
                                            setCurrentPage(1);
                                        }}
                                        placeholder="e.g. English"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* MINIMUM PRICE */}
                                <div>
                                    <label
                                        htmlFor="min-price-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Minimum Price
                                    </label>
                                    <input
                                        id="min-price-filter"
                                        type="number"
                                        min="0"
                                        value={minPrice}
                                        onChange={(event) => {
                                            setMinPrice(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Minimum price"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* MAXIMUM PRICE */}
                                <div>
                                    <label
                                        htmlFor="max-price-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Maximum Price
                                    </label>
                                    <input
                                        id="max-price-filter"
                                        type="number"
                                        min="0"
                                        value={maxPrice}
                                        onChange={(event) => {
                                            setMaxPrice(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Maximum price"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* TRAVEL DATE */}
                                <div>
                                    <label
                                        htmlFor="travel-date-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Travel Date
                                    </label>
                                    <div className="relative">
                                        <FiCalendar
                                            size={16}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                        />
                                        <input
                                            id="travel-date-filter"
                                            type="date"
                                            value={travelDate}
                                            onChange={(event) => {
                                                setTravelDate(
                                                    event.target.value
                                                );
                                                setCurrentPage(1);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                        />
                                    </div>
                                </div>

                                {/* MINIMUM DURATION */}
                                <div>
                                    <label
                                        htmlFor="min-duration-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Minimum Duration (Days)
                                    </label>
                                    <input
                                        id="min-duration-filter"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={minDuration}
                                        onChange={(event) => {
                                            setMinDuration(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="e.g. 2 days"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* MAXIMUM DURATION */}
                                <div>
                                    <label
                                        htmlFor="max-duration-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Maximum Duration (Days)
                                    </label>
                                    <input
                                        id="max-duration-filter"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxDuration}
                                        onChange={(event) => {
                                            setMaxDuration(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="e.g. 7 days"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* PARTICIPANTS */}
                                <div>
                                    <label
                                        htmlFor="participants-filter"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        Participants
                                    </label>
                                    <div className="relative">
                                        <FiUsers
                                            size={16}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                        />
                                        <input
                                            id="participants-filter"
                                            type="number"
                                            min="1"
                                            value={participants}
                                            onChange={(event) => {
                                                setParticipants(
                                                    event.target.value
                                                );
                                                setCurrentPage(1);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <p className="max-w-xl text-xs leading-5 text-slate-600">
                                    Destination and category filters use
                                    database IDs. Duration filters are measured
                                    in days; nights are displayed separately.
                                </p>

                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION HEADING AND SORT */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Available Activities &amp; Tours
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Discover unique experiences offered by reliable
                            local operators.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <label
                            htmlFor="tour-sort"
                            className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                            Sort by:
                        </label>
                        <select
                            id="tour-sort"
                            value={sortBy}
                            onChange={(event) => {
                                setSortBy(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-500"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="rating">Highest Rated</option>
                            <option value="price-low">
                                Price: Low to High
                            </option>
                            <option value="price-high">
                                Price: High to Low
                            </option>
                            <option value="duration">Shortest Duration</option>
                        </select>
                    </div>
                </div>

                {/* LOADING SKELETONS */}
                {loading && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                            >
                                <div className="h-64 animate-pulse bg-slate-100" />
                                <div className="space-y-4 p-6">
                                    <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                                    <div className="h-4 w-full animate-pulse rounded-lg bg-slate-50" />
                                    <div className="h-12 animate-pulse rounded-2xl bg-slate-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ERROR STATE */}
                {!loading && error && (
                    <div
                        role="alert"
                        className="rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center sm:p-12"
                    >
                        <h3 className="text-lg font-bold text-rose-900">
                            We couldn&apos;t load the experiences right now.
                        </h3>
                        <p className="mt-2 text-sm text-rose-700">{error}</p>
                    </div>
                )}

                {/* TOUR CARDS */}
                {!loading && !error && filteredTours.length > 0 && (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTours.map((tour: Tour) => {
                            const imageUrl = getImageUrl(tour);
                            const isWishlisted =
                                wishlistChecks[tour._id] ??
                                wishlistIds.includes(tour._id);
                            const isWishlistSubmitting = submittingIds.includes(
                                tour._id
                            );

                            return (
                                <article
                                    key={tour._id}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"
                                >
                                    {/* TOUR IMAGE CONTAINER */}
                                    <div className="relative h-64 overflow-hidden bg-slate-100">
                                        <Link
                                            href={`/toures&activities/${tour._id}`}
                                            aria-label={`Explore ${tour.title}`}
                                            className="absolute inset-0 block"
                                        >
                                            {imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageUrl}
                                                    alt={tour.title}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center bg-indigo-50">
                                                    <FiMapPin
                                                        size={40}
                                                        className="text-indigo-300"
                                                    />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                                        </Link>

                                        {/* EXPERIENCE BADGE */}
                                        <div className="pointer-events-none absolute left-4 top-4 z-10">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md">
                                                <FiCompass
                                                    size={13}
                                                    className="text-indigo-600"
                                                />
                                                Experience
                                            </span>
                                        </div>

                                        {/* WISHLIST BUTTON */}
                                        <button
                                            type="button"
                                            disabled={isWishlistSubmitting}
                                            onClick={() =>
                                                handleWishlistToggle(
                                                    tour._id,
                                                    isWishlisted
                                                )
                                            }
                                            aria-label={
                                                isWishlisted
                                                    ? 'Remove from wishlist'
                                                    : 'Add to wishlist'
                                            }
                                            className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition duration-200 hover:scale-110 disabled:opacity-60 ${
                                                isWishlisted
                                                    ? 'bg-white text-rose-500 ring-1 ring-rose-100'
                                                    : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500'
                                            }`}
                                        >
                                            <FiHeart
                                                size={18}
                                                className={
                                                    isWishlisted
                                                        ? 'fill-rose-500 text-rose-500'
                                                        : ''
                                                }
                                            />
                                        </button>

                                        {/* DIFFICULTY & RATING */}
                                        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between text-white">
                                            {tour.difficultyLevel ? (
                                                <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-md">
                                                    {tour.difficultyLevel}
                                                </span>
                                            ) : (
                                                <span />
                                            )}

                                            <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
                                                <FiStar
                                                    className="fill-amber-400 text-amber-400"
                                                    size={13}
                                                />
                                                {tour.averageRating ?? 'New'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* TOUR DETAILS */}
                                    <div className="flex flex-1 flex-col p-6">
                                        <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900 transition group-hover:text-indigo-600">
                                            <Link
                                                href={`/toures&activities/${tour._id}`}
                                            >
                                                {tour.title}
                                            </Link>
                                        </h3>

                                        <div className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                            {renderDurationBadge(tour)}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Starting from
                                                </p>
                                                <p className="text-xl font-black text-slate-900">
                                                    {tour.currency ?? 'INR'}{' '}
                                                    {Number(
                                                        tour.basePrice ?? 0
                                                    ).toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/toures&activities/${tour._id}`}
                                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                                            >
                                                View Details
                                                <FiArrowRight
                                                    size={14}
                                                    className="transition-transform group-hover:translate-x-1"
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* BACKEND PAGINATION */}
                {!loading && !error && totalPages > 1 && (
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <p className="text-sm font-medium text-slate-600">
                            Page {currentPage} of {totalPages} ({total} tours)
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1
                            ).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => goToPage(pageNumber)}
                                    aria-current={
                                        currentPage === pageNumber
                                            ? 'page'
                                            : undefined
                                    }
                                    className={`h-10 min-w-[40px] rounded-xl border text-sm font-bold transition ${
                                        currentPage === pageNumber
                                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* EMPTY STATE */}
                {!loading && !error && filteredTours.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <FiCompass size={28} />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                            No experiences found matching your search
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
                            Try modifying your search criteria or adventure
                            level to explore alternative experiences.
                        </p>

                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}
