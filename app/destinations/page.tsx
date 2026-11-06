'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import img from '../../public/images/destination/destination-hero.avif';
import Link from 'next/link';
import {
    Search,
    MapPin,
    CalendarDays,
    Compass,
    ArrowRight,
    Globe2,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
} from 'lucide-react';

import type { RootState, AppDispatch } from '@/redux/store';
import { fetchDestinations } from '@/redux/slices/destinationSlice';

export default function DestinationsPage() {
    const dispatch = useDispatch<AppDispatch>();

    const { destinations, total, page, totalPages, loading, error } =
        useSelector((state: RootState) => state.destinations);

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<
        'newest' | 'oldest' | 'name_asc' | 'name_desc'
    >('newest');

    const pageSize = 9;

    // FETCH DESTINATIONS FROM BACKEND
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(
                fetchDestinations({
                    page,
                    limit: pageSize,
                    search: search.trim() || undefined,
                    sort,
                })
            );
        }, 350);

        return () => clearTimeout(timer);
    }, [dispatch, page, search, sort]);

    // SEARCH HANDLER
    const handleSearch = (value: string) => {
        setSearch(value);
    };

    // SORT HANDLER
    const handleSort = (
        value: 'newest' | 'oldest' | 'name_asc' | 'name_desc'
    ) => {
        setSort(value);
    };

    // PAGINATION
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;

        dispatch(
            fetchDestinations({
                page: newPage,
                limit: pageSize,
                search: search.trim() || undefined,
                sort,
            })
        );
    };

    // LOADING SKELETON
    const DestinationSkeleton = () => (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="h-60 animate-pulse bg-slate-200" />
            <div className="space-y-4 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="h-16 animate-pulse rounded bg-slate-100" />
                <div className="h-10 animate-pulse rounded bg-slate-200" />
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50">
            {/* =====================================
          HERO SECTION
      ===================================== */}
            <section className="relative flex min-h-[400px] items-center justify-center overflow-hidden bg-slate-950 py-14 sm:min-h-[390px]">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={img.src}
                        alt="Beautiful travel destination"
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Light Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-slate-950/15 to-slate-950/30" />

                {/* Hero Content */}
                <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        <Globe2 size={15} />
                        Explore the World
                    </div>

                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Explore Destinations
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
                        Discover beautiful places and find your next adventure
                        with Tripora.
                    </p>
                </div>
            </section>

            {/* =====================================
          DESTINATIONS SECTION
      ===================================== */}
            <section className="mx-auto max-w-7xl px-5 py-14 md:py-20">
                {/* SECTION HEADER */}
                <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-600">
                            Explore places
                        </p>

                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                            All Destinations
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Find the perfect destination for your next journey.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Globe2 size={18} className="text-sky-600" />
                        {total} {total === 1 ? 'Destination' : 'Destinations'}{' '}
                        available
                    </div>
                </div>

                {/* SEARCH AND SORT */}
                <div className="mb-9 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                if (page !== 1) {
                                    dispatch(
                                        fetchDestinations({
                                            page: 1,
                                            limit: pageSize,
                                            search:
                                                e.target.value.trim() ||
                                                undefined,
                                            sort,
                                        })
                                    );
                                }
                            }}
                            placeholder="Search destinations or countries..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        />
                    </div>
                    /
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <DestinationSkeleton key={index} />
                        ))}
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
                        <p className="text-lg font-bold text-red-700">
                            Unable to load destinations
                        </p>

                        <p className="mt-2 text-sm text-red-500">{error}</p>

                        <button
                            onClick={() =>
                                dispatch(
                                    fetchDestinations({
                                        page,
                                        limit: pageSize,
                                        search: search.trim() || undefined,
                                        sort,
                                    })
                                )
                            }
                            className="mt-5 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* DESTINATION GRID */}
                {!loading && !error && destinations.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {destinations.map((destination) => (
                                <article
                                    key={destination._id}
                                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    {/* IMAGE */}
                                    {/* DESTINATION IMAGE */}
                                    <div className="relative h-64 overflow-hidden bg-slate-200">
                                        {destination.image?.url ? (
                                            <img
                                                src={destination.image.url}
                                                alt={destination.name}
                                                loading="lazy"
                                                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-slate-100">
                                                <Globe2
                                                    size={45}
                                                    className="text-slate-400"
                                                />
                                                <p className="ml-2 text-sm text-slate-500">
                                                    Image unavailable
                                                </p>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                                        {/* DESTINATION DETAILS */}
                                        <div className="absolute inset-x-0 bottom-0 p-5">
                                            {destination.region && (
                                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-300">
                                                    {destination.region}
                                                </p>
                                            )}

                                            <h3 className="text-xl font-bold text-white">
                                                {destination.name}
                                            </h3>

                                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-200">
                                                <MapPin size={13} />
                                                <span>
                                                    {destination.country}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CARD CONTENT */}
                                    <div className="p-5">
                                        {/* DESCRIPTION */}
                                        <p className="min-h-[66px] text-sm leading-6 text-slate-500">
                                            {destination.description
                                                ? destination.description
                                                      .length > 125
                                                    ? `${destination.description.slice(0, 125)}...`
                                                    : destination.description
                                                : `Discover the beauty and experiences of ${destination.name}.`}
                                        </p>

                                        {/* HIGHLIGHTS */}
                                        {destination.highlights &&
                                            destination.highlights.length >
                                                0 && (
                                                <div className="mt-4">
                                                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                                                        Highlights
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {destination.highlights
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    highlight,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={`${highlight}-${index}`}
                                                                        className="rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-medium text-sky-700"
                                                                    >
                                                                        {
                                                                            highlight
                                                                        }
                                                                    </span>
                                                                )
                                                            )}

                                                        {destination.highlights
                                                            .length > 3 && (
                                                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-500">
                                                                +
                                                                {destination
                                                                    .highlights
                                                                    .length -
                                                                    3}{' '}
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {/* BEST TIME */}
                                        {destination.bestTimeToVisit && (
                                            <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4">
                                                <CalendarDays
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-sky-600"
                                                />

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                        Best time to visit
                                                    </p>

                                                    <p className="mt-1 text-xs font-semibold text-slate-700">
                                                        {
                                                            destination.bestTimeToVisit
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* EXPLORE BUTTON */}
                                        <Link
                                            href={`/tours?destinationId=${encodeURIComponent(
                                                destination._id
                                            )}`}
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
                                        >
                                            Explore Tours
                                            <ArrowRight
                                                size={16}
                                                className="transition-transform group-hover:translate-x-1"
                                            />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={17} />
                                    Previous
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        onClick={() =>
                                            handlePageChange(pageNumber)
                                        }
                                        className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition ${
                                            page === pageNumber
                                                ? 'bg-sky-600 text-white shadow-md'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={17} />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* EMPTY STATE */}
                {!loading && !error && destinations.length === 0 && (
                    <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
                            <Search size={28} className="text-sky-500" />
                        </div>

                        <h3 className="mt-5 text-xl font-bold text-slate-900">
                            No destinations found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Try searching with another destination or country
                            name.
                        </p>

                        <button
                            onClick={() => {
                                setSearch('');
                                setSort('newest');
                                dispatch(
                                    fetchDestinations({
                                        page: 1,
                                        limit: pageSize,
                                        sort: 'newest',
                                    })
                                );
                            }}
                            className="mt-6 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                        >
                            Clear Search
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}
