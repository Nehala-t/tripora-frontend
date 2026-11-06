
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarDays, Loader2, PlusCircle, RotateCcw } from "lucide-react";

import {
  availabilitySchema,
  updateAvailabilitySchema,
  type AvailabilityFormValues,
} from "@/validations/availabilitySchema";

type AvailabilityTour = {
  _id: string;
  title: string;
  status?: string;
  destinationId?: string | {
    _id?: string;
    name?: string;
  };
};

type AvailabilityFormProps = {
  tours: AvailabilityTour[];
  isEditing: boolean;
  isSubmitting: boolean;
  minimumCapacity?: number;
  initialValues: AvailabilityFormValues;
  onSubmit: (values: AvailabilityFormValues) => Promise<void>;
  onCancel: () => void;
};

function toLocalDateTimeMin(): string {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

export default function AvailabilityForm({
  tours,
  isEditing,
  isSubmitting,
  minimumCapacity = 1,
  initialValues,
  onSubmit,
  onCancel,
}: AvailabilityFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    resolver: yupResolver(
      isEditing ? updateAvailabilitySchema : availabilitySchema
    ),
    defaultValues: initialValues,
    mode: "onTouched",
    context: {
      minimumCapacity,
    },
  });

  const startAt = watch("startAt");
  const selectedTourId = watch("tourId");

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const nowMin = toLocalDateTimeMin();

  // Editing an existing slot may have a past start/end date.
  // Creating a new slot must use a future start date.
  const startMin = isEditing ? undefined : nowMin;

  const endMin =
    startAt && (!isEditing || startAt > nowMin)
      ? startAt
      : isEditing
        ? undefined
        : nowMin;

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

  const errorClass = "mt-1.5 text-xs font-medium text-red-600";

  return (
    <form
      id="availability-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
          <CalendarDays className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            {isEditing ? "Edit Availability Slot" : "Create Availability Slot"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Set the schedule, available places, and price for a published tour.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* TOUR */}
        <div className="md:col-span-2">
          <label
            htmlFor="availability-tour"
            className="text-xs font-bold text-slate-700"
          >
            Tour and destination *
          </label>

          <select
            id="availability-tour"
            {...register("tourId")}
            disabled={isEditing || isSubmitting}
            className={inputClass}
          >
            <option value="">Select a published tour</option>

            {tours.map((tour) => {
              const destination =
                typeof tour.destinationId === "object"
                  ? tour.destinationId?.name
                  : undefined;

              return (
                <option key={tour._id} value={tour._id}>
                  {tour.title}
                  {destination ? ` — ${destination}` : ""}
                </option>
              );
            })}
          </select>

          {errors.tourId && (
            <p className={errorClass}>{errors.tourId.message}</p>
          )}

          {tours.length === 0 && (
            <p className="mt-2 text-xs text-amber-700">
              No published tours are available. Publish a tour first to create an availability slot.
            </p>
          )}

          {isEditing && selectedTourId && (
            <p className="mt-1.5 text-xs text-slate-500">
              The tour cannot be changed while editing an existing slot.
            </p>
          )}
        </div>

        {/* START */}
        <div>
          <label
            htmlFor="availability-start"
            className="text-xs font-bold text-slate-700"
          >
            Start date and time *
          </label>

          <input
            id="availability-start"
            type="datetime-local"
            min={startMin}
            {...register("startAt")}
            disabled={isSubmitting}
            className={inputClass}
          />

          {errors.startAt && (
            <p className={errorClass}>{errors.startAt.message}</p>
          )}
        </div>

        {/* END */}
        <div>
          <label
            htmlFor="availability-end"
            className="text-xs font-bold text-slate-700"
          >
            End date and time *
          </label>

          <input
            id="availability-end"
            type="datetime-local"
            min={endMin}
            {...register("endAt")}
            disabled={isSubmitting}
            className={inputClass}
          />

          {errors.endAt && (
            <p className={errorClass}>{errors.endAt.message}</p>
          )}
        </div>

        {/* CAPACITY */}
        <div>
          <label
            htmlFor="availability-capacity"
            className="text-xs font-bold text-slate-700"
          >
            Total capacity *
          </label>

          <input
            id="availability-capacity"
            type="number"
            min={minimumCapacity}
            step="1"
            {...register("capacity", { valueAsNumber: true })}
            disabled={isSubmitting}
            className={inputClass}
          />

          <p className="mt-1 text-[11px] text-slate-500">
            Minimum allowed: {minimumCapacity}
            {isEditing ? " (already reserved places)" : ""}
          </p>

          {errors.capacity && (
            <p className={errorClass}>{errors.capacity.message}</p>
          )}
        </div>

        {/* PRICE */}
        <div>
          <label
            htmlFor="availability-price"
            className="text-xs font-bold text-slate-700"
          >
            Price per participant *
          </label>

          <input
            id="availability-price"
            type="number"
            min="0"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            disabled={isSubmitting}
            className={inputClass}
          />

          {errors.price && (
            <p className={errorClass}>{errors.price.message}</p>
          )}
        </div>

        {/* CURRENCY */}
        <div>
          <label
            htmlFor="availability-currency"
            className="text-xs font-bold text-slate-700"
          >
            Currency *
          </label>

          <select
            id="availability-currency"
            {...register("currency")}
            disabled={isSubmitting}
            className={inputClass}
          >
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="AED">AED — UAE Dirham</option>
          </select>

          {errors.currency && (
            <p className={errorClass}>{errors.currency.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (!isEditing && tours.length === 0)}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              {isEditing ? "Update Availability" : "Create Availability Slot"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
