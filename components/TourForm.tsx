"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiImage,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";


import type {
  DestinationOption,
  CategoryOption,
  TourImage,
  TourDay,
  OperatorTour,
} from "@/redux/slices/operatorSlice";

import { tourSchema } from "@/validations/tourSchema";
import { ValidationError } from "yup";

// ========================================
// TYPES
// ========================================

export interface TourFormValues {
  title: string;
  destinationId: string;
  categoryId: string;
  description: string;
  durationDays: string;
  nights: string;
  basePrice: string;
  currency: string;
  highlights: string;
  inclusions: string;
  exclusions: string;
  meetingPointName: string;
  meetingPointAddress: string;
  meetingPointInstructions: string;
  latitude: string;
  longitude: string;
  whatsappNumber: string;
  cancellationPolicy: string;
  minParticipants: string;
  maxParticipants: string;
  minAge: string;
  maxAge: string;
  difficultyLevel: "easy" | "moderate" | "challenging";
  languages: string;
  tags: string;
  instantBooking: boolean;
  status: "draft" | "published" | "archived";
}

export interface TourFormDay {
  title: string;
  description: string;
  time: string;
}

export interface TourFormInitialValues
  extends Partial<Omit<TourFormValues, "destinationId" | "categoryId">> {
  _id?: string;
  destinationId?: string | { _id: string; name?: string };
  categoryId?: string | { _id: string; name?: string };
  days?: Partial<TourDay>[];
  itinerary?: Partial<TourDay>[];
  images?: TourImage[];
  meetingPoint?: {
    name?: string;
    address?: string;
    instructions?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  ageRestrictions?: {
    minAge?: number;
    maxAge?: number | null;
  };
  durationMinutes?: number;
}

interface TourFormProps {
  destinations: DestinationOption[];
  categories: CategoryOption[];
  initialValues?: TourFormInitialValues | OperatorTour;
  mode?: "add" | "edit";
  onSubmit: (data: FormData) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

type FieldErrors = Record<string, string>;

// ========================================
// DEFAULT VALUES
// ========================================

const initialForm: TourFormValues = {
  title: "",
  destinationId: "",
  categoryId: "",
  description: "",
  durationDays: "1",
  nights: "0",
  basePrice: "",
  currency: "INR",
  highlights: "",
  inclusions: "",
  exclusions: "",
  meetingPointName: "",
  meetingPointAddress: "",
  meetingPointInstructions: "",
  latitude: "",
  longitude: "",
  whatsappNumber: "",
  cancellationPolicy: "",
  minParticipants: "1",
  maxParticipants: "10",
  minAge: "0",
  maxAge: "",
  difficultyLevel: "easy",
  languages: "English",
  tags: "",
  instantBooking: false,
  status: "draft",
};

const blankDay: TourFormDay = {
  title: "",
  description: "",
  time: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const sectionClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";

// ========================================
// REUSABLE COMPONENTS
// ========================================

function FieldError({
  name,
  errors,
}: {
  name: string;
  errors: FieldErrors;
}) {
  const error = errors[name];

  if (!error) return null;

  return (
    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
      {error}
    </p>
  );
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
        {step}
      </p>

      <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>

      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function listToString(value: unknown): string {
  if (!Array.isArray(value)) return "";

  return value
    .filter((item): item is string => typeof item === "string")
    .join(", ");
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function idToString(
  value: string | { _id: string; name?: string } | undefined
): string {
  if (typeof value === "string") return value;
  return value?._id ?? "";
}

function getMeetingPoint(
  values?: TourFormInitialValues | OperatorTour
) {
  const raw = values as TourFormInitialValues | undefined;
  const meetingPoint = raw?.meetingPoint;

  return {
    name: meetingPoint?.name ?? "",
    address: meetingPoint?.address ?? "",
    instructions: meetingPoint?.instructions ?? "",
    latitude: String(meetingPoint?.coordinates?.lat ?? ""),
    longitude: String(meetingPoint?.coordinates?.lng ?? ""),
  };
}


function getInitialForm(
  values?: TourFormInitialValues | OperatorTour
): TourFormValues {
  if (!values) return { ...initialForm };

  // Support either a direct tour object or a wrapped API response.
  const source = values as Record<string, unknown>;
  const nestedTour = source.tour ?? source.data;

  const raw =
    nestedTour && typeof nestedTour === "object"
      ? (nestedTour as TourFormInitialValues)
      : (values as TourFormInitialValues);

  const meetingPoint = getMeetingPoint(raw);

  const contact = raw as TourFormInitialValues & {
    whatsAppNumber?: string;
    whatsapp?: string;
    contact?: { whatsappNumber?: string };
    contactInfo?: { whatsappNumber?: string };
  };

  const whatsappNumber =
    contact.whatsappNumber ??
    contact.whatsAppNumber ??
    contact.whatsapp ??
    contact.contact?.whatsappNumber ??
    contact.contactInfo?.whatsappNumber ??
    "";

  return {
    ...initialForm,
    title: raw.title ?? "",
    destinationId: idToString(raw.destinationId),
    categoryId: idToString(raw.categoryId),
    description: raw.description ?? "",

    durationDays: String(
      raw.durationDays ??
        (raw.durationMinutes
          ? Math.ceil(raw.durationMinutes / 1440)
          : 1)
    ),

    nights: String(raw.nights ?? 0),
    basePrice: String(raw.basePrice ?? ""),
    currency: raw.currency ?? "INR",

    highlights:
      typeof raw.highlights === "string"
        ? raw.highlights
        : listToString(raw.highlights),

    inclusions:
      typeof raw.inclusions === "string"
        ? raw.inclusions
        : listToString(raw.inclusions),

    exclusions:
      typeof raw.exclusions === "string"
        ? raw.exclusions
        : listToString(raw.exclusions),

    meetingPointName: meetingPoint.name,
    meetingPointAddress: meetingPoint.address,
    meetingPointInstructions: meetingPoint.instructions,
    latitude: meetingPoint.latitude,
    longitude: meetingPoint.longitude,

    whatsappNumber: String(whatsappNumber),

    cancellationPolicy: raw.cancellationPolicy ?? "",
    minParticipants: String(raw.minParticipants ?? 1),
    maxParticipants: String(raw.maxParticipants ?? 10),
    minAge: String(raw.ageRestrictions?.minAge ?? 0),
    maxAge: String(raw.ageRestrictions?.maxAge ?? ""),
    difficultyLevel: raw.difficultyLevel ?? "easy",

    languages:
      typeof raw.languages === "string"
        ? raw.languages
        : listToString(raw.languages),

    tags:
      typeof raw.tags === "string"
        ? raw.tags
        : listToString(raw.tags),

    instantBooking: Boolean(raw.instantBooking),
    status: raw.status ?? "draft",
  };
}

function getInitialDays(
  values?: TourFormInitialValues | OperatorTour
): TourFormDay[] {
  if (!values) return [{ ...blankDay }];

  const source = values as Record<string, unknown>;
  const nestedTour = source.tour ?? source.data;

  const raw =
    nestedTour && typeof nestedTour === "object"
      ? (nestedTour as Record<string, unknown>)
      : source;

  // Check the common field names used for a daily plan.
  const possiblePlans = [
    raw.itinerary,
    raw.days,
    raw.dailyPlan,
    raw.tourPlan,
  ];

  const savedPlan = possiblePlans.find(
    (plan) => Array.isArray(plan) && plan.length > 0
  );

  if (!Array.isArray(savedPlan)) {
    return [{ ...blankDay }];
  }

  return savedPlan.map((item: unknown) => {
    const day =
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};

    return {
      title: String(day.title ?? day.dayTitle ?? ""),
      description: String(
        day.description ?? day.activity ?? day.activities ?? ""
      ),
      time: String(day.time ?? day.duration ?? ""),
    };
  });
}


// ========================================
// TOUR FORM COMPONENT
// ========================================

export default function TourForm({
  destinations,
  categories,
  initialValues,
  mode,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TourFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = mode
    ? mode === "edit"
    : Boolean(initialValues);

  const [form, setForm] = useState<TourFormValues>(() =>
    getInitialForm(initialValues)
  );

  const [days, setDays] = useState<TourFormDay[]>(() =>
    getInitialDays(initialValues)
  );

  const [existingImages, setExistingImages] = useState<TourImage[]>(
    () => initialValues?.images ?? []
  );

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ========================================
  // RESET FORM WHEN EDITING ANOTHER TOUR
  // ========================================

  console.log("EDIT TOUR DATA:", initialValues);
console.log("WHATSAPP VALUE:", getInitialForm(initialValues).whatsappNumber);
console.log("DAILY PLAN VALUE:", getInitialDays(initialValues));
  useEffect(() => {
    setForm(getInitialForm(initialValues));
    setDays(getInitialDays(initialValues));
    setExistingImages(initialValues?.images ?? []);
    setImageFiles([]);
    setFormError("");
    setFormSuccess("");
    setFieldErrors({});
  }, [initialValues]);

  // ========================================
  // IMAGE PREVIEWS
  // ========================================

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));

    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  // ========================================
  // FIELD ERROR HELPERS
  // ========================================

  const clearFieldError = (name: string) => {
    setFieldErrors((previous) => {
      const updated = { ...previous };
      delete updated[name];
      return updated;
    });
  };

  const updateField = <K extends keyof TourFormValues>(
    field: K,
    value: TourFormValues[K]
  ) => {
    const errorFieldMap: Partial<Record<keyof TourFormValues, string>> = {
      meetingPointName: "meetingPoint.name",
      meetingPointAddress: "meetingPoint.address",
      meetingPointInstructions: "meetingPoint.instructions",
      latitude: "meetingPoint.coordinates.lat",
      longitude: "meetingPoint.coordinates.lng",
      minAge: "ageRestrictions.minAge",
      maxAge: "ageRestrictions.maxAge",
    };

    clearFieldError(errorFieldMap[field] ?? String(field));
    setFormError("");
    setFormSuccess("");

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ========================================
  // IMAGE HANDLING
  // ========================================

  const handleImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== selectedFiles.length) {
      setFormError("Only JPG, PNG and WebP images are supported.");
    } else {
      setFormError("");
    }

    const availableSlots = Math.max(0, 10 - existingImages.length);

    setImageFiles((previous) => {
      const combined = [...previous];
      let exceededLimit = false;

      for (const file of validFiles) {
        const duplicate = combined.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (duplicate) continue;

        if (combined.length < availableSlots) {
          combined.push(file);
        } else {
          exceededLimit = true;
        }
      }

      if (exceededLimit) {
        setFieldErrors((previousErrors) => ({
          ...previousErrors,
          images: "A tour can have a maximum of 10 images.",
        }));
      } else {
        setFieldErrors((previousErrors) => {
          const updated = { ...previousErrors };
          delete updated.images;
          return updated;
        });
      }

      return combined.slice(0, availableSlots);
    });
  };

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );

    clearFieldError("images");
    setFormError("");
  };

  const removeNewImage = (indexToRemove: number) => {
    setImageFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );

    clearFieldError("images");
    setFormError("");
  };

  // ========================================
  // DAILY ITINERARY
  // ========================================

  const updateDay = (
    index: number,
    field: keyof TourFormDay,
    value: string
  ) => {
    clearFieldError(`days[${index}].${field}`);
    clearFieldError(`itinerary[${index}].${field}`);
    setFormError("");

    setDays((previous) =>
      previous.map((day, dayIndex) =>
        dayIndex === index ? { ...day, [field]: value } : day
      )
    );
  };

  const addDay = () => {
    setDays((previous) => [...previous, { ...blankDay }]);
  };

  const removeDay = (indexToRemove: number) => {
    setDays((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((_, index) => index !== indexToRemove)
    );

    setFieldErrors((previous) => {
      const updated: FieldErrors = {};

      Object.entries(previous).forEach(([key, value]) => {
        const match = key.match(/^(days|itinerary)\[(\d+)\]\.(.+)$/);

        if (!match) {
          updated[key] = value;
          return;
        }

        const [, prefix, indexString, field] = match;
        const dayIndex = Number(indexString);

        if (dayIndex < indexToRemove) {
          updated[key] = value;
        } else if (dayIndex > indexToRemove) {
          updated[`${prefix}[${dayIndex - 1}].${field}`] = value;
        }
      });

      return updated;
    });
  };

  // ========================================
  // VALIDATE AND SUBMIT
  // ========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");
    setFieldErrors({});

    const durationDays = Number(form.durationDays);
    const nights = Number(form.nights);
    const basePrice = Number(form.basePrice);
    const minParticipants = Number(form.minParticipants);
    const maxParticipants = Number(form.maxParticipants);
    const minAge = Number(form.minAge || 0);
    const maxAge = form.maxAge.trim() === "" ? null : Number(form.maxAge);

    const lat = form.latitude.trim() === "" ? null : Number(form.latitude);
    const lng = form.longitude.trim() === "" ? null : Number(form.longitude);

    const itineraryData = days.map((day) => ({
      title: day.title.trim(),
      description: day.description.trim(),
      time: day.time.trim(),
    }));

    const validationData = {
      title: form.title,
      destinationId: form.destinationId,
      categoryId: form.categoryId,
      description: form.description,
      durationDays: form.durationDays,
      nights: form.nights,
      durationMinutes: String(durationDays * 24 * 60),
      basePrice: form.basePrice,
      currency: form.currency,
      highlights: splitList(form.highlights),
      inclusions: splitList(form.inclusions),
      exclusions: splitList(form.exclusions),
      days: itineraryData,
      meetingPoint: {
        name: form.meetingPointName,
        address: form.meetingPointAddress,
        instructions: form.meetingPointInstructions,
        coordinates: { lat, lng },
      },
      whatsappNumber: form.whatsappNumber,
      cancellationPolicy: form.cancellationPolicy,
      minParticipants: form.minParticipants,
      maxParticipants: form.maxParticipants,
      ageRestrictions: {
        minAge: form.minAge || "0",
        maxAge,
      },
      difficultyLevel: form.difficultyLevel,
      languages: splitList(form.languages),
      tags: splitList(form.tags),
      instantBooking: form.instantBooking,
      status: form.status,
      images: existingImages,
    };

    try {
      await tourSchema.validate(validationData, {
        abortEarly: false,
      });

      if (existingImages.length + imageFiles.length > 10) {
        setFieldErrors({
          images: "A tour can have a maximum of 10 images.",
        });
        return;
      }

      const meetingPoint = {
        name: form.meetingPointName.trim(),
        address: form.meetingPointAddress.trim(),
        instructions: form.meetingPointInstructions.trim(),
        coordinates: {
          ...(lat !== null ? { lat } : {}),
          ...(lng !== null ? { lng } : {}),
        },
      };

      const payload = new FormData();

      // Basic information
      payload.append("title", form.title.trim());
      payload.append("destinationId", form.destinationId);
      payload.append("categoryId", form.categoryId);
      payload.append("description", form.description.trim());

      // Duration
      payload.append("durationDays", String(durationDays));
      payload.append("nights", String(nights));
      payload.append("durationMinutes", String(durationDays * 24 * 60));

      // Pricing
      payload.append("basePrice", String(basePrice));
      payload.append("currency", form.currency);

      // Lists
      payload.append("highlights", JSON.stringify(splitList(form.highlights)));
      payload.append("inclusions", JSON.stringify(splitList(form.inclusions)));
      payload.append("exclusions", JSON.stringify(splitList(form.exclusions)));
      payload.append("languages", JSON.stringify(splitList(form.languages)));
      payload.append("tags", JSON.stringify(splitList(form.tags)));

      // FIX: Submit itinerary and days for backend compatibility.
      payload.append("itinerary", JSON.stringify(itineraryData));
      payload.append("days", JSON.stringify(itineraryData));

      // Meeting point and contact
      payload.append("meetingPoint", JSON.stringify(meetingPoint));
      payload.append("whatsappNumber", form.whatsappNumber.trim());
      payload.append("cancellationPolicy", form.cancellationPolicy.trim());

      // Booking rules
      payload.append("minParticipants", String(minParticipants));
      payload.append("maxParticipants", String(maxParticipants));
      payload.append(
        "ageRestrictions",
        JSON.stringify({ minAge, maxAge })
      );

      payload.append("difficultyLevel", form.difficultyLevel);
      payload.append("instantBooking", String(form.instantBooking));
      payload.append("status", form.status);

      // Existing images retained by the operator
      payload.append("existingImages", JSON.stringify(existingImages));

      // Newly selected image files
      imageFiles.forEach((file) => {
        payload.append("images", file);
      });

      await onSubmit(payload);

      setFormSuccess(
        isEditing
          ? "Tour updated successfully."
          : "Tour created successfully."
      );
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        const errors: FieldErrors = {};

        error.inner.forEach((validationError) => {
          const path = validationError.path;

          if (path && !errors[path]) {
            errors[path] = validationError.message;
          }
        });

        if (Object.keys(errors).length === 0 && error.path) {
          errors[error.path] = error.message;
        }

        setFieldErrors(errors);

        setFormError(
          Object.keys(errors).length === 0 ? error.message : ""
        );
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "Unable to save the tour. Please try again."
        );
      }
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <button
            type="button"
            onClick={onCancel}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <FiArrowLeft />
            Back to tours
          </button>

          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-4 sm:block">
              {isEditing ? (
                <FiCheck className="h-8 w-8" />
              ) : (
                <FiPlus className="h-8 w-8" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                Tripora · Operator Studio
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                {isEditing ? "Update Your Tour" : "Create Your Tour"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                {isEditing
                  ? "Review your existing details and keep your experience up to date."
                  : "Turn your local knowledge into an unforgettable experience for travelers."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mx-auto mt-7 max-w-5xl space-y-6 px-4 sm:px-6"
      >
        {/* STATUS MESSAGES */}
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <FiX className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <FiCheck className="mt-0.5 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* SECTION 1: EXPERIENCE DETAILS */}
        <section className={sectionClass}>
          <SectionHeading
            step="Step 01"
            title="Experience details"
            description="Give travelers the essential information about your tour."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="tour-title">
                Tour title *
              </label>
              <input
                id="tour-title"
                className={inputClass}
                placeholder="e.g. Munnar Tea Plantation Adventure"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
              <FieldError name="title" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-destination">
                Destination *
              </label>
              <div className="relative">
                <select
                  id="tour-destination"
                  className={`${inputClass} appearance-none pr-10`}
                  value={form.destinationId}
                  onChange={(event) =>
                    updateField("destinationId", event.target.value)
                  }
                >
                  <option value="">Choose a destination</option>
                  {destinations.map((destination) => (
                    <option key={destination._id} value={destination._id}>
                      {destination.name}
                      {destination.country ? `, ${destination.country}` : ""}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <FieldError name="destinationId" errors={fieldErrors} />
              {destinations.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No destinations loaded. Check the destinations API.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-category">
                Category *
              </label>
              <div className="relative">
                <select
                  id="tour-category"
                  className={`${inputClass} appearance-none pr-10`}
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <FieldError name="categoryId" errors={fieldErrors} />
              {categories.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No categories loaded. Check the categories API.
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="tour-description">
                Description *
              </label>
              <textarea
                id="tour-description"
                className={inputClass}
                rows={5}
                placeholder="Describe what makes this experience special..."
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
              <FieldError name="description" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-duration">
                Duration (days) *
              </label>
              <input
                id="tour-duration"
                type="number"
                min="1"
                step="1"
                className={inputClass}
                value={form.durationDays}
                onChange={(event) =>
                  updateField("durationDays", event.target.value)
                }
              />
              <FieldError name="durationDays" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-nights">
                Nights
              </label>
              <input
                id="tour-nights"
                type="number"
                min="0"
                step="1"
                className={inputClass}
                value={form.nights}
                onChange={(event) => updateField("nights", event.target.value)}
              />
              <FieldError name="nights" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-price">
                Price per person *
              </label>
              <input
                id="tour-price"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="2500"
                value={form.basePrice}
                onChange={(event) =>
                  updateField("basePrice", event.target.value)
                }
              />
              <FieldError name="basePrice" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-currency">
                Currency *
              </label>
              <select
                id="tour-currency"
                className={inputClass}
                value={form.currency}
                onChange={(event) => updateField("currency", event.target.value)}
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
              <FieldError name="currency" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-difficulty">
                Difficulty level
              </label>
              <select
                id="tour-difficulty"
                className={inputClass}
                value={form.difficultyLevel}
                onChange={(event) =>
                  updateField(
                    "difficultyLevel",
                    event.target.value as TourFormValues["difficultyLevel"]
                  )
                }
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
              <FieldError name="difficultyLevel" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-status">
                Tour status
              </label>
              <select
                id="tour-status"
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as TourFormValues["status"]
                  )
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <FieldError name="status" errors={fieldErrors} />
            </div>
          </div>
        </section>

        {/* SECTION 2: HIGHLIGHTS AND LISTS */}
        <section className={sectionClass}>
          <SectionHeading
            step="Step 02"
            title="What travelers can expect"
            description="Add highlights, inclusions, exclusions, languages and tags."
          />

          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="tour-highlights">
                Highlights
              </label>
              <textarea
                id="tour-highlights"
                className={inputClass}
                rows={3}
                placeholder="Tea plantations, Mountain views, Waterfalls"
                value={form.highlights}
                onChange={(event) =>
                  updateField("highlights", event.target.value)
                }
              />
              <FieldError name="highlights" errors={fieldErrors} />
              <p className="mt-1 text-xs text-slate-500">
                Separate each item with a comma.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-inclusions">
                What&apos;s included
              </label>
              <textarea
                id="tour-inclusions"
                className={inputClass}
                rows={3}
                placeholder="Professional guide, Entry tickets, Lunch"
                value={form.inclusions}
                onChange={(event) =>
                  updateField("inclusions", event.target.value)
                }
              />
              <FieldError name="inclusions" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-exclusions">
                What&apos;s not included
              </label>
              <textarea
                id="tour-exclusions"
                className={inputClass}
                rows={3}
                placeholder="Personal expenses, Travel insurance"
                value={form.exclusions}
                onChange={(event) =>
                  updateField("exclusions", event.target.value)
                }
              />
              <FieldError name="exclusions" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-languages">
                Languages
              </label>
              <input
                id="tour-languages"
                className={inputClass}
                placeholder="English, Malayalam, Hindi"
                value={form.languages}
                onChange={(event) =>
                  updateField("languages", event.target.value)
                }
              />
              <FieldError name="languages" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="tour-tags">
                Tags
              </label>
              <input
                id="tour-tags"
                className={inputClass}
                placeholder="nature, adventure, family-friendly"
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
              />
              <FieldError name="tags" errors={fieldErrors} />
            </div>
          </div>
        </section>

        {/* SECTION 3: DAILY ITINERARY */}
        <section className={sectionClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Step 03
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Daily tour plan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a title and description for each day. Time is optional.
              </p>
            </div>

            <button
              type="button"
              onClick={addDay}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <FiPlus />
              Add day
            </button>
          </div>

          <div className="space-y-4">
            {days.map((day, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Day {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeDay(index)}
                    disabled={days.length === 1}
                    aria-label={`Remove day ${index + 1}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor={`day-title-${index}`}>
                      Day title *
                    </label>
                    <input
                      id={`day-title-${index}`}
                      className={inputClass}
                      placeholder="e.g. Explore the tea gardens"
                      value={day.title}
                      onChange={(event) =>
                        updateDay(index, "title", event.target.value)
                      }
                    />
                    <FieldError
                      name={`days[${index}].title`}
                      errors={fieldErrors}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor={`day-description-${index}`}
                    >
                      Day description *
                    </label>
                    <textarea
                      id={`day-description-${index}`}
                      className={inputClass}
                      rows={3}
                      placeholder="Describe the activities planned for this day."
                      value={day.description}
                      onChange={(event) =>
                        updateDay(index, "description", event.target.value)
                      }
                    />
                    <FieldError
                      name={`days[${index}].description`}
                      errors={fieldErrors}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor={`day-time-${index}`}>
                      <span className="inline-flex items-center gap-2">
                        <FiClock />
                        Time (optional)
                      </span>
                    </label>
                    <input
                      id={`day-time-${index}`}
                      type="text"
                      className={inputClass}
                      placeholder="e.g. 9:00 AM – 12:00 PM"
                      value={day.time}
                      onChange={(event) =>
                        updateDay(index, "time", event.target.value)
                      }
                    />
                    <FieldError
                      name={`days[${index}].time`}
                      errors={fieldErrors}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: MEETING POINT */}
        <section className={sectionClass}>
          <SectionHeading
            step="Step 04"
            title="Meeting point"
            description="Tell travelers where to meet your tour guide."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="meeting-name">
                <span className="inline-flex items-center gap-2">
                  <FiMapPin />
                  Meeting point name *
                </span>
              </label>
              <input
                id="meeting-name"
                className={inputClass}
                placeholder="Main entrance"
                value={form.meetingPointName}
                onChange={(event) =>
                  updateField("meetingPointName", event.target.value)
                }
              />
              <FieldError name="meetingPoint.name" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="meeting-address">
                Meeting point address *
              </label>
              <input
                id="meeting-address"
                className={inputClass}
                placeholder="Full address or landmark"
                value={form.meetingPointAddress}
                onChange={(event) =>
                  updateField("meetingPointAddress", event.target.value)
                }
              />
              <FieldError name="meetingPoint.address" errors={fieldErrors} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="meeting-instructions">
                Instructions for travelers
              </label>
              <textarea
                id="meeting-instructions"
                className={inputClass}
                rows={3}
                placeholder="Tell travelers how to find the meeting point..."
                value={form.meetingPointInstructions}
                onChange={(event) =>
                  updateField("meetingPointInstructions", event.target.value)
                }
              />
              <FieldError
                name="meetingPoint.instructions"
                errors={fieldErrors}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="meeting-latitude">
                Latitude
              </label>
              <input
                id="meeting-latitude"
                type="number"
                step="any"
                className={inputClass}
                placeholder="10.0889"
                value={form.latitude}
                onChange={(event) =>
                  updateField("latitude", event.target.value)
                }
              />
              <FieldError
                name="meetingPoint.coordinates.lat"
                errors={fieldErrors}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="meeting-longitude">
                Longitude
              </label>
              <input
                id="meeting-longitude"
                type="number"
                step="any"
                className={inputClass}
                placeholder="77.0595"
                value={form.longitude}
                onChange={(event) =>
                  updateField("longitude", event.target.value)
                }
              />
              <FieldError
                name="meetingPoint.coordinates.lng"
                errors={fieldErrors}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: BOOKING RULES */}
        <section className={sectionClass}>
          <SectionHeading
            step="Step 05"
            title="Booking rules"
            description="Set participant limits, age restrictions and cancellation details."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="min-participants">
                Minimum participants *
              </label>
              <input
                id="min-participants"
                type="number"
                min="1"
                step="1"
                className={inputClass}
                value={form.minParticipants}
                onChange={(event) =>
                  updateField("minParticipants", event.target.value)
                }
              />
              <FieldError name="minParticipants" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="max-participants">
                Maximum participants *
              </label>
              <input
                id="max-participants"
                type="number"
                min="1"
                step="1"
                className={inputClass}
                value={form.maxParticipants}
                onChange={(event) =>
                  updateField("maxParticipants", event.target.value)
                }
              />
              <FieldError name="maxParticipants" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="min-age">
                Minimum age
              </label>
              <input
                id="min-age"
                type="number"
                min="0"
                step="1"
                className={inputClass}
                value={form.minAge}
                onChange={(event) => updateField("minAge", event.target.value)}
              />
              <FieldError name="ageRestrictions.minAge" errors={fieldErrors} />
            </div>

            <div>
              <label className={labelClass} htmlFor="max-age">
                Maximum age (optional)
              </label>
              <input
                id="max-age"
                type="number"
                min="0"
                step="1"
                className={inputClass}
                placeholder="No maximum"
                value={form.maxAge}
                onChange={(event) => updateField("maxAge", event.target.value)}
              />
              <FieldError name="ageRestrictions.maxAge" errors={fieldErrors} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="tour-whatsapp">
                WhatsApp number with country code *
              </label>
              <input
                id="tour-whatsapp"
                type="tel"
                className={inputClass}
                placeholder="+919876543210"
                value={form.whatsappNumber}
                onChange={(event) =>
                  updateField("whatsappNumber", event.target.value)
                }
              />
              <FieldError name="whatsappNumber" errors={fieldErrors} />
              <p className="mt-1 text-xs text-slate-500">
                Include the + symbol and country code, without spaces.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cancellation-policy">
                Cancellation policy *
              </label>
              <textarea
                id="cancellation-policy"
                className={inputClass}
                rows={3}
                placeholder="Describe your cancellation and refund policy..."
                value={form.cancellationPolicy}
                onChange={(event) =>
                  updateField("cancellationPolicy", event.target.value)
                }
              />
              <FieldError name="cancellationPolicy" errors={fieldErrors} />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-emerald-600"
                checked={form.instantBooking}
                onChange={(event) =>
                  updateField("instantBooking", event.target.checked)
                }
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Enable instant booking
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Allow eligible travelers to book without waiting for manual
                  confirmation, if supported by your booking workflow.
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* SECTION 6: TOUR IMAGES */}
        <section className={sectionClass}>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Step 06
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
              <FiImage className="text-emerald-700" />
              Tour images
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload up to 10 JPG, PNG or WebP images.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-9 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            <span className="mb-3 rounded-2xl bg-white p-4 text-emerald-700 shadow-sm">
              <FiUploadCloud className="h-7 w-7" />
            </span>
            <span className="text-sm font-bold text-slate-800">
              Click to choose images
            </span>
            <span className="mt-1 text-xs text-slate-500">
              JPG, PNG or WebP · Up to 10 images in total
            </span>
          </button>

          <FieldError name="images" errors={fieldErrors} />

          <input
            ref={fileInputRef}
            id="tour-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImagesChange}
          />

          {(existingImages.length > 0 || imageFiles.length > 0) && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Selected images
                </h3>
                <span className="text-xs text-slate-500">
                  {existingImages.length + imageFiles.length} / 10
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {existingImages.map((image, index) => (
                  <div
                    key={`${image.publicId}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <Image
                      src={image.url}
                      alt={`Existing tour image ${index + 1}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                      Saved
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      aria-label={`Remove saved image ${index + 1}`}
                      className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow transition hover:bg-red-50"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}

                {imageFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    {imagePreviews[index] && (
                      <img
                        src={imagePreviews[index]}
                        alt={`New tour image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-emerald-700/90 px-2 py-1 text-[10px] font-semibold text-white">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      aria-label={`Remove new image ${index + 1}`}
                      className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow transition hover:bg-red-50"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {existingImages.length + imageFiles.length === 0 && (
            <p className="mt-4 text-xs text-slate-500">
              No images selected yet. Add images to showcase your experience.
            </p>
          )}
        </section>

        {/* FORM ACTIONS */}
        <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <FiCheck />
                {isEditing ? "Save Changes" : "Create Tour"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}