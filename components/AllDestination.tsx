"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

import type { RootState, AppDispatch } from "@/redux/store";

import { fetchDestinations } from "@/redux/slices/destinationSlice";

// ==================================================
// COMPONENT
// ==================================================

export default function AllDestination() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const swiperRef = useRef<SwiperType | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const isHomePage = pathname === "/";

  // ==================================================
  // REDUX STATE
  // ==================================================

 const {
  destinations,
  loading,
  error,
} = useSelector((state: RootState) => state.destinations);

useEffect(() => {
  dispatch(
    fetchDestinations({
      page: 1,
      limit: 6,
      sort: "newest",
    })
  );
}, [dispatch]);

  // ==================================================
  // NAVIGATION
  // ==================================================

  const handleDestinationClick = (slug: string) => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    router.push(`/destinations/${slug}`);
  };

  // ==================================================
  // LOADING SKELETON
  // ==================================================

  if (loading && destinations.length === 0) {
    return (
      <section className="px-4 md:px-20">
        <div className="py-14 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Featured Destinations
          </h2>
          <p className="mt-3 text-gray-500">
            Discover amazing places around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-3xl bg-gray-200"
            />
          ))}
        </div>
      </section>
    );
  }

  // ==================================================
  // ERROR STATE
  // ==================================================

  if (error && destinations.length === 0) {
    return (
      <section className="px-4 py-16 text-center md:px-20">
        <h2 className="text-2xl font-bold text-gray-900">
          Featured Destinations
        </h2>

        <p className="mt-4 text-sm text-red-500">{error}</p>

        <button
          onClick={() =>
            dispatch(
              fetchDestinations({
                page: 1,
                limit: 6,
                sort: "newest",
              })
            )
          }
          className="mt-5 rounded-full bg-sky-600 px-6 py-2.5 text-white transition hover:bg-sky-700"
        >
          Try Again
        </button>
      </section>
    );
  }

  // ==================================================
  // EMPTY STATE
  // ==================================================

  if (!destinations.length) {
    return null;
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <section
      className={`px-4 ${
        isHomePage ? "md:px-20" : "md:px-0 md:mb-4"
      }`}
    >
     
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


      {/* SWIPER AND NAVIGATION */}

      <div
        className={`relative ${
          isHomePage ? "mt-0 md:mt-1" : "mt-8 py-2 md:py-10"
        }`}
      >
        {/* PREVIOUS BUTTON */}

        {activeIndex > 0 && (
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous destinations"
            className="absolute left-0 top-1/2 z-20 -translate-x-2 -translate-y-1/2 rounded-full bg-white p-3 text-sky-700 shadow-lg transition hover:scale-110 hover:bg-sky-50 md:-translate-x-4"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* NEXT BUTTON */}

        <button
          type="button"
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next destinations"
          className="absolute right-0 top-1/2 z-20 translate-x-2 -translate-y-1/2 rounded-full bg-white p-3 text-sky-700 shadow-lg transition hover:scale-110 hover:bg-sky-50 md:translate-x-4"
        >
          <ChevronRight size={22} />
        </button>

        {/* DESTINATION SLIDER */}

        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
          }}
          navigation={false}
          centeredSlides={false}
          loop={false}
          slidesPerView={3}
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 12,
            },
            640: {
              slidesPerView: 2.2,
              spaceBetween: 15,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          className="destinationSwiper !pb-3"
        >
          {destinations.slice(0, 6).map((destination) => {
const imageUrl = destination.image?.url;
            return (
              <SwiperSlide key={destination._id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    handleDestinationClick(destination.slug)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleDestinationClick(destination.slug);
                    }
                  }}
                  className="group relative h-64 cursor-pointer overflow-hidden rounded-3xl bg-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl md:h-72"
                >
                  {/* DESTINATION IMAGE */}

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={destination.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-200 to-blue-400">
                      <MapPin
                        size={45}
                        className="text-white"
                      />
                    </div>
                  )}

                  {/* IMAGE OVERLAY */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* ARROW ICON */}

                  <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sky-700 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100">
                    <ArrowUpRight size={21} />
                  </div>

                  {/* DESTINATION DETAILS */}
{/* DESTINATION DETAILS */}
<div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-5">
  {/* REGION */}
  {destination.region && (
    <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 backdrop-blur-md">
      <MapPin size={10} className="text-sky-300" />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-white">
        {destination.region}
      </span>
    </div>
  )}

  {/* DESTINATION NAME */}
  <h3 className="text-lg font-bold leading-tight tracking-tight text-white drop-shadow-lg transition-transform duration-300 group-hover:translate-x-1 md:text-xl">
    {destination.name}
  </h3>

  {/* COUNTRY */}
  <div className="mt-1.5 flex items-center gap-1.5">
    <span className="h-px w-5 bg-sky-400" />
    <p className="text-xs font-medium text-gray-100">
      {destination.country}
    </p>
  </div>

  {/* DECORATIVE LINE */}
  <div className="mt-2 h-0.5 w-8 overflow-hidden rounded-full bg-white/30">
    <div className="h-full w-0 rounded-full bg-sky-400 transition-all duration-500 group-hover:w-full" />
  </div>
</div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* VIEW ALL DESTINATIONS */}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => router.push("/destinations")}
          className="group inline-flex items-center gap-2 rounded-full border border-sky-600 px-7 py-3 text-sm font-semibold text-sky-700 transition-all duration-300 hover:bg-sky-600 hover:text-white"
        >
          Explore All Destinations

          <ArrowUpRight
            size={18}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </section>
  );
}