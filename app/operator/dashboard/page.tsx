"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";

import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import AvailabilityForm from "@/components/AvailabilityForm";

import {
  fetchOperatorDashboard,
  fetchOperatorTours,
  fetchOperatorBookings,
  fetchOperatorDestinations,
  fetchOperatorCategories,
  createOperatorTour,
  updateOperatorTour,
  publishOperatorTour,
  deleteOperatorTour,
  updateBookingStatus,
  clearOperatorError,
  clearOperatorMessage,
} from "@/redux/slices/operatorSlice";

import {
  fetchOperatorAvailability,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  blockAvailabilitySlot,
  unblockAvailabilitySlot,
  deleteAvailabilitySlot,
  clearAvailabilityError,
  clearAvailabilityMessage,
  type AvailabilitySlot,
  type AvailabilityStatus,
} from "@/redux/slices/availabilitySlice";

import TourForm from "@/components/TourForm";
import type { TourFormValues } from "@/validations/tourSchema";
import type { AvailabilityFormValues } from "@/validations/availabilitySchema";

import {
  fetchReviewsForModeration,
  moderateReview,
  type ReviewStatus,
} from "@/redux/slices/reviewSlice";

import {
  LayoutDashboard,
  Compass,
  Calendar,
  CalendarDays,
  ShoppingBag,
  PlusCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Send,
  Store,
  RotateCcw,
  Ban,
  Unlock,
  Star,
  MessageSquare,
} from "lucide-react";

type OperatorView =
  | "overview"
  | "tours"
  | "add-tour"
  | "edit-tour"
  | "orders"
  | "availability"
  | "reviews";

type DeleteTarget = {
  id: string;
  type: "tour" | "availability";
  title: string;
};

function listToString(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

function getTourFormValues(tour: any): TourFormValues {
  const meetingPoint = tour.meetingPoint || {};
  const coordinates = meetingPoint.coordinates || {};
  const ageRestrictions = tour.ageRestrictions || {};

  const dailyPlan =
    Array.isArray(tour.days) && tour.days.length > 0
      ? tour.days
      : Array.isArray(tour.itinerary)
        ? tour.itinerary
        : [];

  return {
    title: tour.title || "",
    description: tour.description || "",

    destinationId:
      typeof tour.destinationId === "object"
        ? tour.destinationId?._id || ""
        : tour.destinationId || "",

    categoryId:
      typeof tour.categoryId === "object"
        ? tour.categoryId?._id || ""
        : tour.categoryId || "",

    durationMinutes: Number(tour.durationMinutes || 60),
    basePrice: Number(tour.basePrice || 0),
    currency: tour.currency || "INR",
    highlights: listToString(tour.highlights),
    inclusions: listToString(tour.inclusions),
    exclusions: listToString(tour.exclusions),
    languages: listToString(tour.languages) || "English",
    tags: listToString(tour.tags),

    itinerary: dailyPlan.map((step: any) => ({
      title: step.title || "",
      description: step.description || "",
      durationMinutes: Number(step.durationMinutes || 0),
      time: step.time || "",
    })),

    whatsappNumber:
      tour.whatsappNumber ??
      tour.whatsAppNumber ??
      tour.contact?.whatsappNumber ??
      "",

    meetingPoint: {
      name: meetingPoint.name || "",
      address: meetingPoint.address || "",
      instructions: meetingPoint.instructions || "",
      lat: coordinates.lat ?? meetingPoint.lat ?? null,
      lng: coordinates.lng ?? meetingPoint.lng ?? null,
    },

    images: Array.isArray(tour.images)
      ? tour.images.map((image: any) => ({
          url: image.url || "",
          publicId: image.publicId || "",
        }))
      : [],

    cancellationPolicy: tour.cancellationPolicy || "",
    minParticipants: Number(tour.minParticipants || 1),
    maxParticipants: Number(tour.maxParticipants || 10),

    ageRestrictions: {
      minAge: Number(ageRestrictions.minAge ?? 0),
      maxAge: ageRestrictions.maxAge ?? null,
    },

    difficultyLevel: tour.difficultyLevel || "easy",
    instantBooking: Boolean(tour.instantBooking),
    status: tour.status || "draft",
  };
}

function formatBookingDate(value?: string | Date | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

export default function OperatorDashboardPage() {
  const dispatch = useDispatch<AppDispatch>();

  // ========================================
  // DELETE CONFIRMATION MODAL
  // ========================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget | null>(null);

  const [moderationNotes, setModerationNotes] = useState<
    Record<string, string>
  >({});

  // ========================================
  // OPERATOR REDUX STATE
  // ========================================

  const {
    dashboard,
    tours,
    bookings,
    destinations,
    categories,
    loading,
    actionLoading,
    error,
    message,
  } = useSelector((state: RootState) => state.operator);

  // ========================================
  // AVAILABILITY REDUX STATE
  // ========================================

  const {
    slots: availabilitySlots,
    loading: availabilityLoading,
    actionLoading: availabilityActionLoading,
    error: availabilityError,
    message: availabilityMessage,
  } = useSelector((state: RootState) => state.availability);

  // ========================================
  // REVIEW REDUX STATE
  // ========================================

  const {
    moderationReviews,
    moderationLoading,
    moderating,
  } = useSelector((state: RootState) => state.reviews);

  // ========================================
  // DASHBOARD STATE
  // ========================================

  // Overview is always the default view.
  const [activeView, setActiveView] =
    useState<OperatorView>("overview");

  const [selectedTour, setSelectedTour] = useState<any>(null);

  const [hasRestoredState, setHasRestoredState] = useState(false);

  const [search, setSearch] = useState("");
  const [tourStatusFilter, setTourStatusFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");

  // ========================================
  // AVAILABILITY STATE
  // ========================================

  const [availabilityStatusFilter, setAvailabilityStatusFilter] =
    useState<AvailabilityStatus | "">("");

  const [editingSlot, setEditingSlot] =
    useState<AvailabilitySlot | null>(null);

  const deleteLoading =
    deleteTarget?.type === "availability"
      ? availabilityActionLoading
      : actionLoading;

  // ========================================
  // RESTORE SELECTED TOUR ONLY
  // ========================================

  // Do not restore the previously selected dashboard view.
  // This ensures Overview always opens first.

  useEffect(() => {
    try {
      const savedTour = localStorage.getItem(
        "tripora_operator_selected_tour"
      );

      if (savedTour) {
        try {
          setSelectedTour(JSON.parse(savedTour));
        } catch {
          localStorage.removeItem(
            "tripora_operator_selected_tour"
          );
        }
      }
    } catch (storageError) {
      console.error(
        "Unable to restore dashboard state:",
        storageError
      );
    } finally {
      setHasRestoredState(true);
    }
  }, []);

  // ========================================
  // SAVE SELECTED TOUR
  // ========================================

  useEffect(() => {
    if (!hasRestoredState) return;

    try {
      if (selectedTour) {
        localStorage.setItem(
          "tripora_operator_selected_tour",
          JSON.stringify(selectedTour)
        );
      } else {
        localStorage.removeItem(
          "tripora_operator_selected_tour"
        );
      }
    } catch (storageError) {
      console.error(
        "Unable to save dashboard state:",
        storageError
      );
    }
  }, [selectedTour, hasRestoredState]);

  // ========================================
  // OPERATOR TOAST NOTIFICATIONS
  // ========================================

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOperatorError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(clearOperatorMessage());
    }
  }, [message, dispatch]);

  // ========================================
  // AVAILABILITY TOAST NOTIFICATIONS
  // ========================================

  useEffect(() => {
    if (availabilityError) {
      toast.error(availabilityError);
      dispatch(clearAvailabilityError());
    }
  }, [availabilityError, dispatch]);

  useEffect(() => {
    if (availabilityMessage) {
      toast.success(availabilityMessage);
      dispatch(clearAvailabilityMessage());
    }
  }, [availabilityMessage, dispatch]);

  // ========================================
  // INITIAL DATA
  // ========================================

  useEffect(() => {
    dispatch(fetchOperatorDashboard());
    dispatch(fetchOperatorDestinations());
    dispatch(fetchOperatorCategories());
  }, [dispatch]);

  // ========================================
  // FETCH TOURS
  // ========================================

  useEffect(() => {
    if (activeView === "availability") {
      dispatch(
        fetchOperatorTours({
          status: "published",
          search: "",
        })
      );

      return;
    }

    dispatch(
      fetchOperatorTours({
        status: tourStatusFilter,
        search: search.trim(),
      })
    );
  }, [
    dispatch,
    activeView,
    tourStatusFilter,
    search,
  ]);

  // ========================================
  // FETCH BOOKINGS
  // ========================================

  useEffect(() => {
    dispatch(fetchOperatorBookings(bookingStatusFilter));
  }, [dispatch, bookingStatusFilter]);

  // ========================================
  // FETCH AVAILABILITY
  // ========================================

  useEffect(() => {
    if (activeView !== "availability") return;

    dispatch(
      fetchOperatorAvailability({
        status: availabilityStatusFilter || undefined,
      })
    );
  }, [
    dispatch,
    activeView,
    availabilityStatusFilter,
  ]);

  // ========================================
  // FETCH REVIEWS FOR MODERATION
  // ========================================

  useEffect(() => {
    if (activeView !== "reviews") return;

    dispatch(fetchReviewsForModeration());
  }, [dispatch, activeView]);

  // ========================================
  // DELETE CONFIRMATION
  // ========================================

  const openDeleteConfirmation = (
    id: string,
    type: "tour" | "availability",
    title: string
  ) => {
    setDeleteTarget({ id, type, title });
    setDeleteModalOpen(true);

    if (type === "tour") {
      dispatch(clearOperatorError());
      dispatch(clearOperatorMessage());
    } else {
      dispatch(clearAvailabilityError());
      dispatch(clearAvailabilityMessage());
    }
  };

  const closeDeleteConfirmation = () => {
    if (deleteLoading) return;

    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return;

    const target = deleteTarget;

    try {
      if (target.type === "tour") {
        await dispatch(deleteOperatorTour(target.id)).unwrap();

        await dispatch(
          fetchOperatorTours({
            status: tourStatusFilter,
            search: search.trim(),
          })
        );
      } else {
        await dispatch(deleteAvailabilitySlot(target.id)).unwrap();

        await dispatch(
          fetchOperatorAvailability({
            status: availabilityStatusFilter || undefined,
          })
        );
      }

      await dispatch(fetchOperatorDashboard());

      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error("Unable to delete item:", deleteError);

      if (target.type === "availability") {
        try {
          const result = await dispatch(
            fetchOperatorAvailability({
              status: availabilityStatusFilter || undefined,
            })
          ).unwrap();

          const slotStillExists = result.some(
            (slot) => slot._id === target.id
          );

          if (!slotStillExists) {
            await dispatch(fetchOperatorDashboard());

            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }
        } catch (refreshError) {
          console.error(
            "Unable to refresh availability:",
            refreshError
          );
        }
      }
    }
  };

  // ========================================
  // TOUR HANDLERS
  // ========================================

  const openAddTour = () => {
    setSelectedTour(null);
    dispatch(clearOperatorError());
    dispatch(clearOperatorMessage());
    setActiveView("add-tour");
  };

  const openEditTour = (tour: any) => {
    setSelectedTour(tour);
    dispatch(clearOperatorError());
    dispatch(clearOperatorMessage());
    setActiveView("edit-tour");
  };

  const handleTourSubmit = async (formData: FormData) => {
    dispatch(clearOperatorError());
    dispatch(clearOperatorMessage());

    try {
      if (activeView === "edit-tour" && selectedTour?._id) {
        await dispatch(
          updateOperatorTour({
            tourId: selectedTour._id,
            updates: formData,
          })
        ).unwrap();
      } else {
        await dispatch(
          createOperatorTour(formData)
        ).unwrap();
      }

      setSelectedTour(null);
      setActiveView("tours");

      await dispatch(
        fetchOperatorTours({
          status: tourStatusFilter,
          search: search.trim(),
        })
      ).unwrap();

      await dispatch(fetchOperatorDashboard()).unwrap();
    } catch (saveError) {
      console.error("Unable to save tour:", saveError);
      throw saveError;
    }
  };

  const handlePublish = async (tourId: string) => {
    dispatch(clearOperatorError());
    dispatch(clearOperatorMessage());

    try {
      await dispatch(
        publishOperatorTour(tourId)
      ).unwrap();

      await dispatch(
        fetchOperatorTours({
          status: tourStatusFilter,
          search: search.trim(),
        })
      ).unwrap();

      await dispatch(fetchOperatorDashboard()).unwrap();
    } catch (publishError) {
      console.error("Unable to publish tour:", publishError);
    }
  };

  const handleDeleteTour = (tour: any) => {
    openDeleteConfirmation(
      tour._id,
      "tour",
      tour.title || "this tour"
    );
  };

  // ========================================
  // BOOKING STATUS HANDLER
  // ========================================

  const handleBookingStatus = async (
    bookingId: string,
    status: string
  ) => {
    dispatch(clearOperatorError());
    dispatch(clearOperatorMessage());

    try {
      await dispatch(
        updateBookingStatus({
          bookingId,
          status,
        })
      ).unwrap();

      console.log("Booking status updated successfully");
    } catch (bookingError) {
      console.error("Booking status update failed:", bookingError);
      return;
    }

    try {
      await dispatch(
        fetchOperatorBookings(bookingStatusFilter)
      ).unwrap();
    } catch (refreshError) {
      console.error(
        "Booking updated, but booking list refresh failed:",
        refreshError
      );
    }

    try {
      await dispatch(fetchOperatorDashboard()).unwrap();
    } catch (dashboardError) {
      console.error(
        "Booking updated, but dashboard refresh failed:",
        dashboardError
      );
    }
  };

  const clearTourFilters = () => {
    setSearch("");
    setTourStatusFilter("");
  };

  const clearBookingFilters = () => {
    setBookingStatusFilter("");
  };

  // ========================================
  // AVAILABILITY HANDLERS
  // ========================================

  const resetAvailabilityForm = () => {
    setEditingSlot(null);
  };

  const handleAvailabilitySubmit = async (
    values: AvailabilityFormValues
  ) => {
    try {
      if (editingSlot) {
        await dispatch(
          updateAvailabilitySlot({
            slotId: editingSlot._id,
            updates: values,
          })
        ).unwrap();
      } else {
        await dispatch(
          createAvailabilitySlot(values)
        ).unwrap();
      }
    } catch (error) {
      console.error("Availability save request failed:", error);
      return;
    }

    try {
      await dispatch(
        fetchOperatorAvailability({
          status: availabilityStatusFilter || undefined,
        })
      ).unwrap();
    } catch (error) {
      console.error(
        "Slot saved, but availability refresh failed:",
        error
      );
    }

    try {
      await dispatch(fetchOperatorDashboard()).unwrap();
    } catch (error) {
      console.error(
        "Slot saved, but dashboard refresh failed:",
        error
      );
    }

    setEditingSlot(null);
  };

  const handleEditAvailability = (
    slot: AvailabilitySlot
  ) => {
    if (slot.status === "cancelled") {
      toast.error("Cancelled slots cannot be edited.");
      return;
    }

    setEditingSlot(slot);

    document
      .getElementById("availability-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleToggleAvailabilityBlock = async (
    slot: AvailabilitySlot
  ) => {
    dispatch(clearAvailabilityError());
    dispatch(clearAvailabilityMessage());

    try {
      if (slot.status === "cancelled") {
        toast.error(
          "Cancelled slots cannot be blocked or unblocked."
        );
        return;
      }

      if (
        slot.isBlockedDate ||
        slot.status === "blocked"
      ) {
        await dispatch(
          unblockAvailabilitySlot(slot._id)
        ).unwrap();
      } else {
        const tourTitle =
          typeof slot.tourId === "string"
            ? tours.find(
                (tour: any) => tour._id === slot.tourId
              )?.title || "this tour"
            : slot.tourId?.title || "this tour";

        const confirmed = window.confirm(
          `Block availability for ${tourTitle}?`
        );

        if (!confirmed) return;

        await dispatch(
          blockAvailabilitySlot({
            slotId: slot._id,
            blockedReason: slot.blockedReason || "",
          })
        ).unwrap();
      }

      await dispatch(
        fetchOperatorAvailability({
          status: availabilityStatusFilter || undefined,
        })
      ).unwrap();
    } catch (blockError) {
      console.error(
        "Unable to update availability status:",
        blockError
      );
    }
  };

  const handleDeleteAvailability = (
    slot: AvailabilitySlot
  ) => {
    const tourTitle =
      typeof slot.tourId === "string"
        ? tours.find(
            (tour: any) => tour._id === slot.tourId
          )?.title
        : slot.tourId?.title;

    openDeleteConfirmation(
      slot._id,
      "availability",
      tourTitle
        ? `availability slot for ${tourTitle}`
        : "this availability slot"
    );
  };

  // ========================================
  // REVIEW MODERATION HANDLER
  // ========================================

  const handleModerateReview = async (
    reviewId: string,
    status: "approved" | "rejected" | "hidden"
  ) => {
    try {
      await dispatch(
        moderateReview({
          reviewId,
          status,
          moderationNote: moderationNotes[reviewId] || "",
        })
      ).unwrap();

      await dispatch(fetchReviewsForModeration()).unwrap();

      setModerationNotes((previous) => {
        const updated = { ...previous };
        delete updated[reviewId];
        return updated;
      });

      toast.success(
        status === "approved"
          ? "Review approved successfully."
          : status === "rejected"
            ? "Review rejected successfully."
            : "Review hidden successfully."
      );
    } catch (reviewError) {
      console.error("Unable to moderate review:", reviewError);

      toast.error(
        typeof reviewError === "string"
          ? reviewError
          : "Unable to update review. Please try again."
      );
    }
  };

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================

  const stats = dashboard || {
    tours: {
      total: 0,
      published: 0,
    },
    bookings: {
      total: 0,
      pending: 0,
      upcoming: 0,
    },
    guests: {
      total: 0,
    },
    earnings: {
      grossAmount: 0,
      paidAmount: 0,
      netAmount: 0,
      commission: 0,
      pendingAmount: 0,
      paidBookings: 0,
      byCurrency: [],
    },
    recentBookings: [],
  };

  const navClass = (isActive: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
      isActive
        ? "bg-sky-50 text-sky-600"
        : "text-slate-600 hover:bg-slate-50"
    }`;

  const tourStatuses = ["", "draft", "published"];

  const bookingStatuses = [
    "",
    "pending",
    "confirmed",
    "cancelled",
  ];

  const publishedTours = tours.filter(
    (tour: any) => tour.status === "published"
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="mt-24 flex h-[calc(100vh-6rem)] overflow-hidden bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="rounded-xl bg-sky-600 p-2 text-white shadow-md shadow-sky-600/20">
            <Store className="h-5 w-5" />
          </div>

          <span className="text-lg font-extrabold tracking-tight">
            Operator Hub
          </span>
        </div>

        <nav className="space-y-1 p-4">
          <button
            type="button"
            onClick={() => setActiveView("overview")}
            className={navClass(activeView === "overview")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveView("tours")}
            className={navClass(
              activeView === "tours" ||
                activeView === "edit-tour"
            )}
          >
            <Compass className="h-4 w-4" />
            Manage Tours
          </button>

          <button
            type="button"
            onClick={openAddTour}
            className={navClass(activeView === "add-tour")}
          >
            <PlusCircle className="h-4 w-4" />
            Add New Tour
          </button>

          <button
            type="button"
            onClick={() => setActiveView("reviews")}
            className={navClass(activeView === "reviews")}
          >
            <Star className="h-4 w-4" />
            Manage Reviews
          </button>

          <button
            type="button"
            onClick={() => setActiveView("orders")}
            className={navClass(activeView === "orders")}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders &amp; Bookings
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView("availability");
              dispatch(clearAvailabilityError());
              dispatch(clearAvailabilityMessage());
            }}
            className={navClass(
              activeView === "availability"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Availability
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* PAGE BODY */}
        <main className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Inline operator and availability alerts removed.
              Redux messages are displayed through toast notifications. */}

          {/* ========================================
              OVERVIEW
          ======================================== */}

          {activeView === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black">
                  Dashboard Overview
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  Monitor your tours, bookings, guests, and earnings.
                </p>
              </div>

              {/* STATISTICS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Total Tours
                  </span>

                  <p className="text-3xl font-black">
                    {stats.tours.total}
                  </p>

                  <span className="text-xs font-bold text-emerald-600">
                    {stats.tours.published} Published
                  </span>
                </div>

                <div className="space-y-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Total Bookings
                  </span>

                  <p className="text-3xl font-black">
                    {stats.bookings.total}
                  </p>

                  <span className="text-xs font-bold text-amber-600">
                    {stats.bookings.pending} Pending
                  </span>
                </div>

                <div className="space-y-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Total Guests
                  </span>

                  <p className="text-3xl font-black">
                    {stats.guests.total}
                  </p>

                  <span className="text-xs text-slate-500">
                    Participants booked
                  </span>
                </div>

                <div className="space-y-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Net Earnings
                  </span>

                  <p className="text-2xl font-black text-sky-600">
                    ₹
                    {Number(
                      stats.earnings.netAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>

                  <span className="text-[11px] text-slate-400">
                    Pending: ₹
                    {Number(
                      stats.earnings.pendingAmount || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* ADDITIONAL BOOKING STATISTICS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Upcoming Bookings
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {stats.bookings.upcoming}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Confirmed upcoming reservations
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Total Commission
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    ₹
                    {Number(
                      stats.earnings.commission || 0
                    ).toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Commission on your bookings
                  </p>
                </div>
              </div>

              {/* RECENT BOOKINGS */}
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">
                    Recent Booking Orders
                  </h2>

                  <button
                    type="button"
                    onClick={() => setActiveView("orders")}
                    className="text-xs font-bold text-sky-600"
                  >
                    View All
                  </button>
                </div>

                {stats.recentBookings.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No recent bookings found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-sky-100 text-xs font-bold uppercase text-slate-400">
                          <th className="px-4 pb-3">Tour Title</th>
                          <th className="px-4 pb-3">Participants</th>
                          <th className="px-4 pb-3">Status</th>
                          <th className="px-4 pb-3 text-right">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-sky-50">
                        {stats.recentBookings.map(
                          (booking: any) => (
                            <tr key={booking._id}>
                              <td className="px-4 py-3 font-bold">
                                {booking.tourId?.title ||
                                  "Tour Experience"}
                              </td>

                              <td className="px-4 py-3">
                                {booking.participants} Guests
                              </td>

                              <td className="px-4 py-3 capitalize">
                                {booking.status}
                              </td>

                              <td className="px-4 py-3 text-right">
                                {formatBookingDate(
                                  booking.createdAt
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================
              MANAGE TOURS
          ======================================== */}

          {activeView === "tours" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-black">
                    Manage Tours
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    Create, edit, publish, or archive your tours.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddTour}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Tour
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {tourStatuses.map((status) => (
                      <button
                        type="button"
                        key={status || "all"}
                        onClick={() =>
                          setTourStatusFilter(status)
                        }
                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                          tourStatusFilter === status
                            ? "bg-sky-600 text-white"
                            : "border border-sky-100 bg-white text-slate-600 hover:bg-sky-50"
                        }`}
                      >
                        {status || "All Tours"}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={clearTourFilters}
                    disabled={!search && !tourStatusFilter}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Filters
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  {tourStatusFilter
                    ? `Showing tours with status: ${tourStatusFilter}`
                    : "Showing all tour statuses"}

                  {search.trim()
                    ? ` matching "${search.trim()}"`
                    : ""}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20 text-sky-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : tours.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white p-12 text-center text-slate-400">
                  <Compass className="mx-auto mb-3 h-10 w-10 text-sky-300" />

                  <p className="text-sm font-bold text-slate-600">
                    No tours found
                  </p>

                  <p className="mt-2 text-xs">
                    Try another status or clear your filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearTourFilters}
                    disabled={!search && !tourStatusFilter}
                    className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tours.map((tour: any) => (
                    <article
                      key={tour._id}
                      className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative h-48 bg-slate-100">
                        {tour.images?.[0]?.url ? (
                          <img
                            src={tour.images[0].url}
                            alt={tour.title || "Tour image"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
                            <Compass className="h-12 w-12 text-sky-300" />
                          </div>
                        )}

                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sky-700">
                          {tour.status || "draft"}
                        </span>
                      </div>

                      <div className="space-y-3 p-5">
                        <h3 className="text-base font-bold">
                          {tour.title}
                        </h3>

                        <p className="line-clamp-2 text-xs text-slate-500">
                          {tour.description}
                        </p>

                        <div className="flex items-center justify-between border-t border-sky-50 pt-4">
                          <span className="text-xs font-extrabold text-sky-600">
                            {tour.currency || "INR"}{" "}
                            {Number(
                              tour.basePrice || 0
                            ).toLocaleString("en-IN")}
                          </span>

                          <div className="flex items-center gap-2">
                            {tour.status === "draft" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePublish(tour._id)
                                }
                                title="Publish tour"
                                aria-label={`Publish ${tour.title}`}
                                disabled={actionLoading}
                                className="rounded-xl bg-sky-50 p-2 text-sky-600 transition hover:bg-sky-100 disabled:opacity-50"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditTour(tour)}
                              title="Edit tour"
                              aria-label={`Edit ${tour.title}`}
                              className="rounded-xl bg-sky-50 p-2 text-sky-600 transition hover:bg-sky-100"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTour(tour)}
                              title="Archive tour"
                              aria-label={`Archive ${tour.title}`}
                              disabled={actionLoading}
                              className="rounded-xl bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================
              ADD / EDIT TOUR
          ======================================== */}

          {(activeView === "add-tour" ||
            activeView === "edit-tour") && (
            <div className="mx-auto max-w-5xl space-y-5">
              {activeView === "edit-tour" && !selectedTour ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-sm font-bold text-amber-800">
                    No tour is selected for editing.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveView("tours")}
                    className="mt-3 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    Back to Manage Tours
                  </button>
                </div>
              ) : (
                <TourForm
                  key={
                    activeView === "edit-tour"
                      ? selectedTour?._id
                      : "new-tour"
                  }
                  mode={
                    activeView === "edit-tour" ? "edit" : "add"
                  }
                  destinations={destinations}
                  categories={categories}
                  initialValues={
                    activeView === "edit-tour" && selectedTour
                      ? getTourFormValues(selectedTour)
                      : undefined
                  }
                  onSubmit={handleTourSubmit}
                  onCancel={() => {
                    setSelectedTour(null);
                    setActiveView("tours");
                  }}
                  isSubmitting={actionLoading}
                />
              )}
            </div>
          )}

          {/* ========================================
              ORDERS AND BOOKINGS
          ======================================== */}

          {activeView === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
                <div>
                  <h1 className="text-2xl font-black">
                    Orders &amp; Booking Management
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    View customer reservations and manage booking requests.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-sky-600">
                    {bookings.length} bookings found
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {bookingStatuses.map((status) => (
                    <button
                      type="button"
                      key={status || "all"}
                      onClick={() => setBookingStatusFilter(status)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition ${
                        bookingStatusFilter === status
                          ? "bg-sky-600 text-white"
                          : "border border-sky-100 bg-white text-slate-600 hover:bg-sky-50"
                      }`}
                    >
                      {status || "All Orders"}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={clearBookingFilters}
                    disabled={!bookingStatusFilter}
                    title="Clear booking filters"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20 text-sky-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white p-12 text-center text-slate-400">
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-sky-300" />

                  <p className="text-sm font-bold text-slate-600">
                    No customer bookings found
                  </p>

                  <p className="mt-2 text-xs">
                    There are no bookings available for this filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-sky-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-400">
                          <th className="px-5 py-4">Booking</th>
                          <th className="px-5 py-4">Traveler</th>
                          <th className="px-5 py-4">Tour Experience</th>
                          <th className="px-5 py-4">Travel Date</th>
                          <th className="px-5 py-4">Guests</th>
                          <th className="px-5 py-4">Total Amount</th>
                          <th className="px-5 py-4">Payment</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-sky-50 text-xs">
                        {bookings.map((booking: any) => (
                          <tr
                            key={booking._id}
                            className="transition hover:bg-sky-50/40"
                          >
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {booking.bookingReference ||
                                  `#${booking._id.slice(-8).toUpperCase()}`}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-400">
                                Booked:{" "}
                                {formatBookingDate(booking.createdAt)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {booking.travelerDetails?.fullName ||
                                  booking.userId?.name ||
                                  "Guest User"}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-500">
                                {booking.travelerDetails?.email ||
                                  booking.userId?.email ||
                                  "No email available"}
                              </p>

                              {booking.travelerDetails?.phone && (
                                <p className="mt-1 text-[11px] text-slate-500">
                                  {booking.travelerDetails.phone}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-[180px] truncate font-semibold text-slate-700">
                                {booking.tourId?.title || "Tour Item"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-700">
                                {booking.travelDate
                                  ? formatBookingDate(booking.travelDate)
                                  : "Not specified"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-700">
                                {booking.participants || 0} Guests
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: booking.currency || "INR",
                                  maximumFractionDigits: 2,
                                }).format(booking.totalPrice || 0)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                                  booking.paymentStatus === "paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : booking.paymentStatus === "failed"
                                      ? "bg-rose-50 text-rose-700"
                                      : booking.paymentStatus === "refunded"
                                        ? "bg-purple-50 text-purple-700"
                                        : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {booking.paymentStatus || "pending"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                                  booking.status === "confirmed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : booking.status === "pending"
                                      ? "bg-amber-50 text-amber-700"
                                      : booking.status === "completed"
                                        ? "bg-sky-50 text-sky-700"
                                        : booking.status === "rejected" ||
                                            booking.status === "cancelled"
                                          ? "bg-rose-50 text-rose-700"
                                          : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {booking.status || "unknown"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <select
                                value={booking.status || "pending"}
                                onChange={(event) =>
                                  handleBookingStatus(
                                    booking._id,
                                    event.target.value
                                  )
                                }
                                disabled={actionLoading}
                                className="w-36 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold capitalize text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================
              MANAGE REVIEWS
          ======================================== */}

          {activeView === "reviews" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-black">
                    Manage Reviews
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    Review traveler feedback and manage moderation.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-sky-600">
                    {moderationReviews.length} reviews found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    dispatch(fetchReviewsForModeration())
                  }
                  disabled={moderationLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                >
                  <RotateCcw
                    className={`h-4 w-4 ${
                      moderationLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Reviews
                </button>
              </div>

              {/* REVIEW SUMMARY */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Total Reviews",
                    value: moderationReviews.length,
                    color: "text-sky-600",
                    bg: "bg-sky-50",
                  },
                  {
                    label: "Pending Reviews",
                    value: moderationReviews.filter(
                      (review) => review.status === "pending"
                    ).length,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "Approved Reviews",
                    value: moderationReviews.filter(
                      (review) => review.status === "approved"
                    ).length,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500">
                        {item.label}
                      </p>

                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* LOADING */}
              {moderationLoading ? (
                <div className="flex justify-center rounded-2xl border border-sky-100 bg-white py-20 text-sky-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : moderationReviews.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white p-12 text-center">
                  <Star className="mx-auto mb-3 h-12 w-12 text-sky-300" />

                  <h2 className="text-base font-bold text-slate-700">
                    No reviews found
                  </h2>

                  <p className="mt-2 text-xs text-slate-500">
                    Reviews submitted for your tours will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {moderationReviews.map((review) => {
                    const tour =
                      typeof review.tourId === "object"
                        ? review.tourId
                        : null;

                    const reviewer =
                      typeof review.userId === "object"
                        ? review.userId
                        : null;

                    const booking =
                      typeof review.bookingId === "object"
                        ? review.bookingId
                        : null;

                    const tourTitle =
                      tour?.title || "Tour Experience";

                    const reviewerName =
                      reviewer?.firstName ||
                      reviewer?.name ||
                      "Traveler";

                    const statusClasses: Record<ReviewStatus, string> = {
                      pending: "bg-amber-50 text-amber-700",
                      approved: "bg-emerald-50 text-emerald-700",
                      rejected: "bg-red-50 text-red-700",
                      hidden: "bg-slate-100 text-slate-600",
                    };

                    return (
                      <article
                        key={review._id}
                        className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm"
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col justify-between gap-4 sm:flex-row">
                            <div className="flex min-w-0 gap-4">
                              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                {tour?.images?.[0]?.url ? (
                                  <img
                                    src={tour.images[0].url}
                                    alt={tourTitle}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-400">
                                    <Compass className="h-8 w-8" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h3 className="truncate text-base font-extrabold text-slate-900">
                                  {tourTitle}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  Reviewed by{" "}
                                  <span className="font-bold text-slate-700">
                                    {reviewerName}
                                  </span>
                                </p>

                                {reviewer?.email && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {reviewer.email}
                                  </p>
                                )}

                                {booking?.bookingReference && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    Booking: {booking.bookingReference}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${statusClasses[review.status]}`}
                              >
                                {review.status}
                              </span>
                            </div>
                          </div>

                          {/* RATING */}
                          <div className="mt-5 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}

                            <span className="ml-2 text-xs font-bold text-slate-700">
                              {review.rating}/5
                            </span>
                          </div>

                          {/* COMMENT */}
                          <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-sm leading-7 text-slate-700">
                              {review.comment}
                            </p>
                          </div>

                          {/* MODERATION NOTE */}
                          {review.moderationNote && (
                            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                              <p className="text-xs font-bold text-amber-800">
                                Previous Moderation Note
                              </p>

                              <p className="mt-1 text-sm text-amber-700">
                                {review.moderationNote}
                              </p>
                            </div>
                          )}

                          {/* DATE */}
                          <p className="mt-4 text-xs text-slate-400">
                            Submitted:{" "}
                            {formatBookingDate(review.createdAt)}
                          </p>

                          {/* MODERATION ACTIONS */}
                          {review.status !== "rejected" && (
                            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                              <div>
                                <label
                                  htmlFor={`moderation-note-${review._id}`}
                                  className="mb-2 block text-xs font-bold text-slate-600"
                                >
                                  Moderation Note (Optional)
                                </label>

                                <textarea
                                  id={`moderation-note-${review._id}`}
                                  value={
                                    moderationNotes[review._id] || ""
                                  }
                                  onChange={(event) =>
                                    setModerationNotes((previous) => ({
                                      ...previous,
                                      [review._id]: event.target.value,
                                    }))
                                  }
                                  maxLength={500}
                                  rows={2}
                                  placeholder="Enter a reason or moderation note..."
                                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                              </div>

                              <div className="flex flex-wrap justify-end gap-2">
                                {review.status !== "approved" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleModerateReview(
                                        review._id,
                                        "approved"
                                      )
                                    }
                                    disabled={moderating}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                  </button>
                                )}

                                {review.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleModerateReview(
                                        review._id,
                                        "rejected"
                                      )
                                    }
                                    disabled={moderating}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </button>
                                )}

                                {review.status === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleModerateReview(
                                        review._id,
                                        "hidden"
                                      )
                                    }
                                    disabled={moderating}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Hide Review
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================
              AVAILABILITY MANAGEMENT
          ======================================== */}

          {activeView === "availability" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-black">
                    Manage Availability
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage tour dates, prices, capacity, and blocked slots.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetAvailabilityForm();

                    document
                      .getElementById("availability-form")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Slot
                </button>
              </div>

              {/* AVAILABILITY FORM */}
              <AvailabilityForm
                key={editingSlot?._id ?? "new-availability"}
                tours={publishedTours.map((tour: any) => ({
                  _id: tour._id,
                  title: tour.title,
                  status: tour.status,
                }))}
                isEditing={Boolean(editingSlot)}
                isSubmitting={availabilityActionLoading}
                minimumCapacity={editingSlot?.reservedCount ?? 1}
                initialValues={{
                  tourId:
                    typeof editingSlot?.tourId === "string"
                      ? editingSlot.tourId
                      : editingSlot?.tourId?._id ?? "",

                  startAt: editingSlot
                    ? toDateTimeLocal(editingSlot.startAt)
                    : "",

                  endAt: editingSlot
                    ? toDateTimeLocal(editingSlot.endAt)
                    : "",

                  capacity: editingSlot?.capacity ?? 10,
                  price: editingSlot?.price ?? 0,
                  currency: editingSlot?.currency ?? "INR",
                }}
                onSubmit={handleAvailabilitySubmit}
                onCancel={resetAvailabilityForm}
              />

              {/* AVAILABILITY FILTERS */}
              <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">
                    Your Availability Slots
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {availabilitySlots.length} slots on this page
                  </p>
                </div>

                <select
                  value={availabilityStatusFilter}
                  onChange={(event) =>
                    setAvailabilityStatusFilter(
                      event.target.value as AvailabilityStatus | ""
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold"
                >
                  <option value="">All statuses</option>
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="blocked">Blocked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* AVAILABILITY TABLE */}
              {availabilityLoading ? (
                <div className="flex justify-center py-16 text-sky-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : availabilitySlots.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white p-12 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-sky-300" />

                  <p className="font-bold text-slate-700">
                    No availability slots found
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Select a published tour and create your first slot.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-sky-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                          <th className="px-5 py-4">Tour</th>
                          <th className="px-5 py-4">Start</th>
                          <th className="px-5 py-4">End</th>
                          <th className="px-5 py-4">Capacity</th>
                          <th className="px-5 py-4">Price</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-sky-50">
                        {availabilitySlots.map((slot) => {
                          const tourTitle =
                            typeof slot.tourId === "string"
                              ? tours.find(
                                  (tour: any) =>
                                    tour._id === slot.tourId
                                )?.title || "Tour"
                              : slot.tourId?.title || "Tour";

                          const statusClasses: Record<
                            AvailabilityStatus,
                            string
                          > = {
                            available:
                              "bg-emerald-50 text-emerald-700",
                            full: "bg-amber-50 text-amber-700",
                            blocked: "bg-rose-50 text-rose-700",
                            cancelled:
                              "bg-slate-100 text-slate-600",
                          };

                          return (
                            <tr
                              key={slot._id}
                              className="hover:bg-sky-50/40"
                            >
                              <td className="px-5 py-4 font-bold text-slate-800">
                                {tourTitle}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4">
                                {formatDateTime(slot.startAt)}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4">
                                {formatDateTime(slot.endAt)}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4">
                                <span className="font-bold">
                                  {slot.reservedCount}/{slot.capacity}
                                </span>

                                <span className="ml-1 text-slate-400">
                                  reserved
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 font-bold text-sky-700">
                                {slot.currency}{" "}
                                {Number(slot.price).toLocaleString("en-IN")}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClasses[slot.status]}`}
                                >
                                  {slot.status}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  {slot.status !== "cancelled" && (
                                    <>
                                      <button
                                        type="button"
                                        title="Edit slot"
                                        aria-label={`Edit availability for ${tourTitle}`}
                                        onClick={() =>
                                          handleEditAvailability(slot)
                                        }
                                        className="rounded-lg bg-sky-50 p-2 text-sky-700 hover:bg-sky-100"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>

                                      <button
                                        type="button"
                                        title={
                                          slot.isBlockedDate ||
                                          slot.status === "blocked"
                                            ? "Unblock slot"
                                            : "Block slot"
                                        }
                                        aria-label={
                                          slot.isBlockedDate ||
                                          slot.status === "blocked"
                                            ? `Unblock ${tourTitle}`
                                            : `Block ${tourTitle}`
                                        }
                                        disabled={availabilityActionLoading}
                                        onClick={() =>
                                          handleToggleAvailabilityBlock(slot)
                                        }
                                        className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                      >
                                        {slot.isBlockedDate ||
                                        slot.status === "blocked" ? (
                                          <Unlock className="h-4 w-4" />
                                        ) : (
                                          <Ban className="h-4 w-4" />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        title="Delete availability slot"
                                        aria-label={`Delete availability for ${tourTitle}`}
                                        disabled={availabilityActionLoading}
                                        onClick={() =>
                                          handleDeleteAvailability(slot)
                                        }
                                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title={
          deleteTarget?.type === "tour"
            ? "Archive this tour?"
            : "Delete this availability slot?"
        }
        message={
          deleteTarget?.type === "tour"
            ? `Are you sure you want to archive "${deleteTarget.title}"?`
            : `Are you sure you want to delete "${deleteTarget?.title ?? "this availability slot"}"? Slots with reservations cannot be deleted.`
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirmation}
      />
    </div>
  );
}