"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import {
  fetchMyWishlist,
  removeFromWishlist,
} from "../../redux/slices/wishlistSlice";
import {
  FiHeart,
  FiTrash2,
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiSun,
  FiGlobe,
} from "react-icons/fi";

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { wishlistTours, loading, clearing, submittingIds, error } =
    useSelector((state: RootState) => state.wishlist);

  useEffect(() => {
    dispatch(fetchMyWishlist());
  }, [dispatch]);

  const handleRemove = (tourId: string) => {
    dispatch(removeFromWishlist(tourId));
  };



  if (loading && wishlistTours.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">
            Loading your wishlist...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pb-20 font-sans text-slate-800">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/toures&activities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <FiArrowLeft size={16} />
            Back to experiences
          </Link>

               </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
              <FiHeart size={14} className="fill-rose-500" />
              Saved Experiences
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage and explore the tours and experiences you have saved for later.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Saved
            </span>
            <p className="text-lg font-black text-slate-900">
              {wishlistTours.length} {wishlistTours.length === 1 ? "Tour" : "Tours"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {wishlistTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
              <FiHeart size={36} />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven&apos;t added any tours or activities to your wishlist yet. Explore our collection and save your favorite experiences.
            </p>
            <Link
              href="/toures&activities"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
            >
              Explore Experiences
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistTours.map((tour) => {
              const isSubmitting = submittingIds.includes(tour._id);
              const image =
                typeof tour.images?.[0] === "string"
                  ? tour.images[0]
                  : tour.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800";

              const destinationName =
                typeof tour.destinationId === "object" && tour.destinationId
                  ? tour.destinationId.name
                  : null;

              const duration =
                tour.durationDays || tour.nights
                  ? `${tour.durationDays || 1} day${
                      (tour.durationDays || 1) > 1 ? "s" : ""
                    }`
                  : tour.durationMinutes
                  ? `${tour.durationMinutes} mins`
                  : "Flexible";

              return (
                <div
                  key={tour._id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.06]"
                >
                  {/* Tour Image Container */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(tour._id)}
                      disabled={isSubmitting}
                      aria-label="Remove from wishlist"
                      className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/90 p-2.5 text-rose-600 shadow-md backdrop-blur-md transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                    >
                      <FiHeart size={16} className="fill-rose-500" />
                    </button>

                    {destinationName && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        <FiMapPin size={12} className="text-rose-400" />
                        <span>{destinationName}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                    <div>
                      <div className="mb-2 flex items-center gap-3 text-xs font-bold text-slate-400">
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          {tour.durationDays ? <FiSun size={13} /> : <FiClock size={13} />}
                          {duration}
                        </span>
                        {tour.difficultyLevel && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{tour.difficultyLevel}</span>
                          </>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-base font-extrabold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                        {tour.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {tour.description || "Discover a memorable experience with Tripora."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Starting from
                        </span>
                        <p className="text-lg font-black text-slate-950">
                          ${Number(tour.basePrice ?? 0).toLocaleString()}
                        </p>
                      </div>

                      <Link
                        href={`/toures&activities/${tour._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                      >
                        View Tour
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}