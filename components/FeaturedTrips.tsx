
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAllTours } from "@/redux/slices/tourSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { ArrowUpRight } from "lucide-react";

// ============================================
// HELPERS
// ============================================

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("en-IN")}`;
  }
};

// ============================================
// FEATURED TRIPS
// ============================================

export default function FeaturedTrips() {
  const dispatch = useAppDispatch();
  const router = useRouter();

 const { tours, toursLoading } = useAppSelector(
  (state) => state.tours
);
  useEffect(() => {
    dispatch(
      fetchAllTours({
        page: 1,
        limit: 3,
        sort: "rating",
      })
    );
  }, [dispatch]);

  const featuredTours = tours
    .filter((tour) => tour.status === "published")
    .sort(
      (a, b) =>
        (b.averageRating ?? 0) - (a.averageRating ?? 0)
    )
    .slice(0, 3);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

       
{/* SECTION HEADING */}

<div className="py-16 text-center md:py-20 lg:py-24">
  <span className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
    Discover Your Next Adventure
  </span>

  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
    Featured Trips
  </h2>

  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500 md:text-base">
    Discover amazing travel experiences handpicked for every
    kind of traveler — from exciting outdoor adventures and
    peaceful escapes to unforgettable cultural journeys.
  </p>
</div>


        {/* LOADING SKELETON */}
        {toursLoading && (
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-100"
              >
                <div className="h-56 animate-pulse bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOUR CARDS */}
       

{/* TOUR CARDS */}
{!toursLoading && featuredTours.length > 0 && (
<div className="grid grid-cols-1 gap-5 px-12 sm:grid-cols-2 lg:grid-cols-3 ">
        {featuredTours.map((tour) => {
      const destination =
        typeof tour.destinationId === "object"
          ? tour.destinationId
          : null;

      const image = tour.images?.find(
        (item) => item.url?.trim()
      )?.url;

      const rating = tour.averageRating ?? 0;
      const reviewCount = tour.reviewCount ?? 0;

      return (
        <article
          key={tour._id}
          onClick={() => router.push(`/tour/${tour._id}`)}
          className="group relative h-[340px] cursor-pointer overflow-hidden rounded-2xl bg-gray-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-[370px]"
        >
          {/* IMAGE */}
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={tour.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-300 to-blue-600" />
          )}

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          {/* TOP BADGES */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-sky-700 backdrop-blur-sm">
              {rating >= 4.5 ? "⭐ Top Rated" : "🔥 Popular"}
            </span>

            <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-bold text-gray-900 shadow">
              {formatPrice(tour.basePrice, tour.currency)}
            </span>
          </div>

          {/* BASIC DETAILS */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="mb-1 text-[11px] font-semibold text-sky-300">
              📍 {destination
                ? `${destination.name}, ${destination.country}`
                : "Explore"}
            </p>

            <h3 className="line-clamp-2 text-base font-bold leading-snug text-white">
              {tour.title}
            </h3>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="text-amber-400">★</span>
                <span className="font-bold">
                  {rating > 0 ? rating.toFixed(1) : "New"}
                </span>
                <span className="text-gray-300">
                  ({reviewCount})
                </span>
              </div>

              <span className="text-xs font-medium text-white">
                🕒 {tour.durationDays}{" "}
                {tour.durationDays === 1 ? "Day" : "Days"}
              </span>
            </div>
          </div>
        </article>
      );
    })}
  </div>
)}


        {/* EMPTY STATE */}
        {!toursLoading && featuredTours.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <div className="mb-3 text-4xl">🌍</div>
            <h3 className="text-lg font-bold text-gray-800">
              No featured trips available
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Exciting adventures are coming soon!
            </p>
          </div>
        )}

        {/* BOTTOM LINK */}
        {!toursLoading && featuredTours.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/toures&activities"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Explore All Trips
              <span>→</span>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
