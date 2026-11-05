
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "@/redux/store";

import {
  fetchTourById,
  clearCurrentTour,
} from "@/redux/slices/tourSlice";

export default function TourDetailsPage() {
  console.log("TOUR DETAILS PAGE IS RUNNING");
  const params = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { currentTour, detailsLoading, error } = useSelector(
    (state: RootState) => state.tours
  );

  useEffect(() => {
    if (!params.id) return;

    dispatch(fetchTourById(params.id));

    return () => {
      dispatch(clearCurrentTour());
    };
  }, [dispatch, params.id]);

  if (detailsLoading) {
    return <p className="p-8">Loading tour details...</p>;
  }

  if (error || !currentTour) {
    return (
      <p className="p-8 text-red-600">
        {error || "Tour not found"}
      </p>
    );
  }

  // Destination information
  const destination =
    typeof currentTour.destinationId === "object"
      ? currentTour.destinationId
      : null;

  // WhatsApp contact URL
  const whatsappNumber = currentTour.whatsappNumber?.replace(/\D/g, "");

  const whatsappMessage = encodeURIComponent(
    `Hello, I am interested in your tour "${currentTour.title}". Could you please provide more information?`
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : null;

   console.log("FULL TOUR:", currentTour);
console.log("WHATSAPP NUMBER:", currentTour.whatsappNumber);
console.log("CLEAN NUMBER:", whatsappNumber);
console.log("WHATSAPP URL:", whatsappUrl);

  return (
    
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="fixed left-4 top-20 z-[99999] bg-red-600 p-5 text-xl font-bold text-white">
  TOUR PAGE TEST
</div>

      {/* Tour information */}
      <section>
        <h1 className="text-3xl font-bold">
          {currentTour.title}
        </h1>

        <p className="mt-2">
          {currentTour.description}
        </p>

        <p className="mt-3 font-semibold">
          {currentTour.currency}{" "}
          {currentTour.basePrice.toLocaleString()}
        </p>

        <p>
          Duration: {Math.floor(currentTour.durationMinutes / 60)}h{" "}
          {currentTour.durationMinutes % 60}m
        </p>

        <p>Difficulty: {currentTour.difficultyLevel}</p>

        <p>Rating: {currentTour.averageRating} / 5</p>
      </section>

      {/* Tour images */}
      <section className="grid gap-4 sm:grid-cols-2">
        {currentTour.images.map((image) => (
          <img
            key={image.publicId}
            src={image.url}
            alt={currentTour.title}
            className="h-64 w-full rounded-2xl object-cover"
          />
        ))}
      </section>

      {/* WhatsApp Contact Button */}
     {/* WhatsApp Contact Button - Bottom */}
{whatsappUrl && (
  <section className="relative z-[9999] flex justify-center py-6">
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full max-w-xl items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-5 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-[#1DA851]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
      >
        <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.46 0 .11 5.35.11 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.18-3.46-8.42ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.63-.24-.37a9.83 9.83 0 0 1-1.51-5.25c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 0 1 2.9 7.01c0 5.47-4.45 9.87-9.96 9.87Z" />
      </svg>

      <span>Contact Operator on WhatsApp</span>
    </a>
  </section>
)}

      {/* Itinerary */}
      <section>
        <h2 className="text-xl font-bold">Itinerary</h2>

        {currentTour.itinerary.map((item) => (
          <article
            key={item._id || item.title}
            className="mt-4"
          >
            <h3 className="font-semibold">{item.title}</h3>
            <p>{item.description}</p>
            <p>{item.durationMinutes} minutes</p>
          </article>
        ))}
      </section>

      {/* Inclusions and exclusions */}
      <section>
        <h2 className="text-xl font-bold">Inclusions</h2>

        <ul className="list-disc pl-6">
          {currentTour.inclusions.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>

        <h2 className="mt-5 text-xl font-bold">Exclusions</h2>

        <ul className="list-disc pl-6">
          {currentTour.exclusions.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Meeting point */}
      <section>
        <h2 className="text-xl font-bold">Meeting Point</h2>
        <p>{currentTour.meetingPoint.name}</p>
        <p>{currentTour.meetingPoint.address}</p>
        <p>{currentTour.meetingPoint.instructions}</p>
      </section>

      {/* Destination information */}
      {destination && (
        <section className="space-y-4 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-bold">
            About {destination.name}
          </h2>

          <p>
            {destination.region
              ? `${destination.region}, `
              : ""}
            {destination.country}
          </p>

          <p>{destination.description}</p>

          {destination.images?.[0] && (
            <img
              src={destination.images[0].url}
              alt={destination.name}
              className="h-72 w-full rounded-2xl object-cover"
            />
          )}

          <h3 className="font-bold">Destination Highlights</h3>

          {destination.highlights?.length > 0 && (
            <ul className="list-disc pl-6">
              {destination.highlights.map((highlight, index) => (
                <li key={`${highlight}-${index}`}>
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          {destination.bestTimeToVisit && (
            <p>
              <strong>Best time to visit:</strong>{" "}
              {destination.bestTimeToVisit}
            </p>
          )}
        </section>
      )}

      {/* Cancellation policy */}
      <section>
        <h2 className="text-xl font-bold">
          Cancellation Policy
        </h2>
        <p>{currentTour.cancellationPolicy}</p>
      </section>
      <p className="rounded-lg bg-yellow-100 p-4 text-black">
  WhatsApp number: {currentTour.whatsappNumber || "NOT RECEIVED"}
</p>
<div className="fixed left-4 top-20 z-[99999] bg-red-600 p-5 text-xl font-bold text-white">
  TOUR PAGE TEST
</div>

    </main>
  );
}
