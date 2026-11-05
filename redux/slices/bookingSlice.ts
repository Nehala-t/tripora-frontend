
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";

// ============================================
// TYPES
// ============================================

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "completed";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "stripe"
  | "razorpay"
  | "cash"
  | "none";

export interface TravelerDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateBookingPayload {
  tourId: string;
  availabilitySlotId: string;
  travelDate: string;
  participants: number;
  travelerDetails: TravelerDetails;
  specialRequests?: string;
  paymentMethod: "stripe" | "cash";
}

export interface BookingTour {
  _id: string;
  title: string;
  slug?: string;
  images?: {
    url: string;
    publicId?: string;
  }[];
  currency?: string;
  basePrice?: number;
}

export interface BookingSlot {
  _id: string;
  startAt?: string;
  endAt?: string;
  price?: number;
  currency?: string;
  status?: "available" | "full" | "blocked" | "cancelled";
}

export interface Booking {
  _id: string;
  bookingReference: string;
  userId: string;
  operatorId: string;
  tourId: BookingTour | string;
  availabilitySlotId: BookingSlot | string;

  travelDate: string;
  participants: number;
  travelerDetails: TravelerDetails;
  specialRequests?: string;

  pricePerParticipant: number;
  totalPrice: number;
  currency: string;

  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string | null;
  stripeCheckoutSessionId?: string | null;

  status: BookingStatus;

  cancellationReason?: string;
  cancelledAt?: string | null;
  confirmedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface StripeCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface StripeVerificationResponse {
  success: boolean;
  message: string;
  bookingId: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
}

export interface FetchMyBookingsParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedBookings {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CancelBookingPayload {
  bookingId: string;
  cancellationReason?: string;
}

// ============================================
// AVAILABILITY TYPES
// ============================================

export interface AvailabilitySlot {
  _id: string;
  tourId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  reservedCount: number;
  price: number;
  currency: string;
  status: "available" | "full" | "blocked" | "cancelled";
  isBlockedDate: boolean;
}

interface AvailabilityResponse {
  success: boolean;
  count: number;
  slots: AvailabilitySlot[];
}

// ============================================
// BOOKING STATE
// ============================================

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;

  loading: boolean;
  submitting: boolean;
  detailsLoading: boolean;
  slotsLoading: boolean;

  paymentLoading: boolean;
  paymentError: string | null;

  slots: AvailabilitySlot[];

  error: string | null;
  successMessage: string | null;
  slotsError: string | null;

  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,

  loading: false,
  submitting: false,
  detailsLoading: false,
  slotsLoading: false,

  paymentLoading: false,
  paymentError: null,

  slots: [],

  error: null,
  successMessage: null,
  slotsError: null,

  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// ============================================
// ERROR HANDLER
// ============================================

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      fallback
    );
  }

  return error instanceof Error ? error.message : fallback;
};

const getBookingFromResponse = (data: {
  booking?: Booking;
  data?: Booking;
}): Booking => {
  const booking = data.booking ?? data.data;

  if (!booking) {
    throw new Error("The server did not return the booking.");
  }

  return booking;
};

// ============================================
// DATE VALIDATION
// ============================================

const isValidTravelDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  const selectedDate = new Date(year, month - 1, day);

  return (
    !Number.isNaN(selectedDate.getTime()) &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month - 1 &&
    selectedDate.getDate() === day
  );
};

// ============================================
// 1. FETCH AVAILABLE SLOTS
// GET /api/availability/tour/:tourId
// ============================================

export const fetchAvailableSlots = createAsyncThunk<
  AvailabilitySlot[],
  {
    tourId: string;
    date: string;
    participants: number;
  },
  { rejectValue: string }
>(
  "bookings/fetchAvailableSlots",
  async (
    { tourId, date, participants },
    { rejectWithValue, signal }
  ) => {
    try {
      if (!tourId) {
        return rejectWithValue("Tour ID is required.");
      }

      if (!isValidTravelDate(date)) {
        return rejectWithValue("Please select a valid travel date.");
      }

      if (!Number.isInteger(participants) || participants < 1) {
        return rejectWithValue(
          "Please select a valid number of participants."
        );
      }

      const [year, month, day] = date.split("-").map(Number);

      const from = new Date(year, month - 1, day);
      const to = new Date(year, month - 1, day);
      to.setHours(23, 59, 59, 999);

      const response = await api.get<AvailabilityResponse>(
        `/availability/tour/${tourId}`,
        {
          params: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
          withCredentials: true,
          signal,
        }
      );

      const slots = Array.isArray(response.data?.slots)
        ? response.data.slots
        : [];

      const now = new Date();

      return slots.filter((slot) => {
        const slotStart = new Date(slot.startAt);
        const slotEnd = new Date(slot.endAt);

        if (
          Number.isNaN(slotStart.getTime()) ||
          Number.isNaN(slotEnd.getTime())
        ) {
          return false;
        }

        const overlapsSelectedDate =
          slotStart <= to && slotEnd >= from;

        const hasAvailableCapacity =
          slot.capacity - slot.reservedCount >= participants;

        return (
          slot.status === "available" &&
          !slot.isBlockedDate &&
          slotEnd > now &&
          overlapsSelectedDate &&
          hasAvailableCapacity
        );
      });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load available time slots.")
      );
    }
  }
);

// ============================================
// 2. CREATE BOOKING
// POST /api/bookings
// ============================================

export const createBooking = createAsyncThunk<
  Booking,
  CreateBookingPayload,
  { rejectValue: string }
>(
  "bookings/createBooking",
  async (bookingData, { rejectWithValue }) => {
    try {
      if (!bookingData.tourId) {
        return rejectWithValue("Tour ID is required.");
      }

      if (!bookingData.availabilitySlotId) {
        return rejectWithValue("Please select an available slot.");
      }

      if (!isValidTravelDate(bookingData.travelDate)) {
        return rejectWithValue("Please select a valid travel date.");
      }

      if (
        !Number.isInteger(bookingData.participants) ||
        bookingData.participants < 1
      ) {
        return rejectWithValue(
          "Please select a valid number of participants."
        );
      }

      const response = await api.post(
        "/bookings",
        bookingData,
        { withCredentials: true }
      );

      return getBookingFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to create your booking.")
      );
    }
  }
);

// ============================================
// 3. CREATE STRIPE CHECKOUT SESSION
// POST /api/payments/create-checkout-session
// ============================================

export const createCheckoutSession = createAsyncThunk<
  StripeCheckoutResponse,
  string,
  { rejectValue: string }
>(
  "bookings/createCheckoutSession",
  async (bookingId, { rejectWithValue }) => {
    try {
      if (!bookingId) {
        return rejectWithValue("Booking ID is required.");
      }

      const response = await api.post(
        "/payments/create-checkout-session",
        { bookingId },
        { withCredentials: true }
      );

      const { url, sessionId } = response.data;

      if (!url || !sessionId) {
        return rejectWithValue(
          "Unable to create Stripe checkout session."
        );
      }

      return {
        url,
        sessionId,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Unable to start Stripe payment."
        )
      );
    }
  }
);

// ============================================
// 4. VERIFY STRIPE CHECKOUT SESSION
// POST /api/payments/verify-session
// ============================================

export const verifyCheckoutSession = createAsyncThunk<
  StripeVerificationResponse,
  string,
  { rejectValue: string }
>(
  "bookings/verifyCheckoutSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      if (!sessionId) {
        return rejectWithValue("Stripe session ID is required.");
      }

      const response = await api.post<StripeVerificationResponse>(
        "/payments/verify-session",
        { sessionId },
        { withCredentials: true }
      );

      if (
        !response.data.success ||
        response.data.paymentStatus !== "paid"
      ) {
        return rejectWithValue(
          response.data.message || "Payment verification failed."
        );
      }

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to verify Stripe payment.")
      );
    }
  }
);

// ============================================
// 5. FETCH MY BOOKINGS
// GET /api/bookings/my-bookings
// ============================================

export const fetchMyBookings = createAsyncThunk<
  PaginatedBookings,
  FetchMyBookingsParams | void,
  { rejectValue: string }
>(
  "bookings/fetchMyBookings",
  async (params, { rejectWithValue }) => {
    try {
      const requestParams = params ?? {};

      const response = await api.get("/bookings/my-bookings", {
        params: requestParams,
        withCredentials: true,
      });

      return {
        bookings: response.data.bookings ?? [],
        total: response.data.total ?? 0,
        page: response.data.page ?? 1,
        limit: requestParams.limit ?? 10,
        totalPages:
          response.data.pages ??
          response.data.totalPages ??
          0,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load your bookings.")
      );
    }
  }
);

// ============================================
// 6. FETCH BOOKING BY ID
// GET /api/bookings/:bookingId
// ============================================

export const fetchBookingById = createAsyncThunk<
  Booking,
  string,
  { rejectValue: string }
>(
  "bookings/fetchBookingById",
  async (bookingId, { rejectWithValue }) => {
    try {
      if (!bookingId) {
        return rejectWithValue("Booking ID is required.");
      }

      const response = await api.get(`/bookings/${bookingId}`, {
        withCredentials: true,
      });

      return getBookingFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load booking details.")
      );
    }
  }
);

// ============================================
// 7. CANCEL BOOKING
// PATCH /api/bookings/:bookingId/cancel
// ============================================

export const cancelBooking = createAsyncThunk<
  Booking,
  CancelBookingPayload,
  { rejectValue: string }
>(
  "bookings/cancelBooking",
  async (
    { bookingId, cancellationReason },
    { rejectWithValue }
  ) => {
    try {
      if (!bookingId) {
        return rejectWithValue("Booking ID is required.");
      }

      const response = await api.patch(
        `/bookings/${bookingId}/cancel`,
        {
          cancellationReason: cancellationReason ?? "",
        },
        { withCredentials: true }
      );

      return getBookingFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to cancel your booking.")
      );
    }
  }
);

// ============================================
// SLICE
// ============================================

const bookingSlice = createSlice({
  name: "bookings",
  initialState,

  reducers: {
    clearBookingError(state) {
      state.error = null;
    },

    clearBookingSuccessMessage(state) {
      state.successMessage = null;
    },

    clearBookingMessages(state) {
      state.error = null;
      state.successMessage = null;
    },

    clearSlotsError(state) {
      state.slotsError = null;
    },

    clearAvailabilitySlots(state) {
      state.slots = [];
      state.slotsError = null;
      state.slotsLoading = false;
    },

    clearCurrentBooking(state) {
      state.currentBooking = null;
      state.detailsLoading = false;
    },

    setCurrentBooking(
      state,
      action: PayloadAction<Booking>
    ) {
      state.currentBooking = action.payload;
    },

    clearPaymentError(state) {
      state.paymentError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH AVAILABLE SLOTS
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
        state.slotsError = null;
        state.slots = [];
      })

      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slots = action.payload;
      })

      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        if (action.meta.aborted) return;

        state.slotsLoading = false;
        state.slotsError =
          action.payload || "Unable to load available time slots.";
      })

      // CREATE BOOKING
      .addCase(createBooking.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createBooking.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentBooking = action.payload;

        state.bookings = [
          action.payload,
          ...state.bookings.filter(
            (booking) => booking._id !== action.payload._id
          ),
        ];

        state.total += 1;
        state.successMessage = "Booking created successfully.";
      })

      .addCase(createBooking.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to create your booking.";
      })

      // CREATE STRIPE CHECKOUT
      .addCase(createCheckoutSession.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })

      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.paymentLoading = false;
      })

      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError =
          action.payload || "Unable to start Stripe payment.";
      })

      // VERIFY STRIPE PAYMENT
      .addCase(verifyCheckoutSession.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })

      .addCase(verifyCheckoutSession.fulfilled, (state, action) => {
        state.paymentLoading = false;

        const {
          bookingId,
          paymentStatus,
          bookingStatus,
        } = action.payload;

        state.bookings = state.bookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                paymentStatus,
                paymentMethod: "stripe",
                status: bookingStatus,
              }
            : booking
        );

        if (state.currentBooking?._id === bookingId) {
          state.currentBooking = {
            ...state.currentBooking,
            paymentStatus,
            paymentMethod: "stripe",
            status: bookingStatus,
          };
        }

        state.paymentError = null;
      })

      .addCase(verifyCheckoutSession.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError =
          action.payload || "Unable to verify Stripe payment.";
      })

      // FETCH MY BOOKINGS
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })

      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to load your bookings.";
      })

      // FETCH BOOKING BY ID
      .addCase(fetchBookingById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentBooking = action.payload;
      })

      .addCase(fetchBookingById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload || "Unable to load booking details.";
      })

      // CANCEL BOOKING
      .addCase(cancelBooking.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.submitting = false;

        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload;
        }

        state.bookings = state.bookings.map((booking) =>
          booking._id === action.payload._id
            ? action.payload
            : booking
        );

        state.successMessage = "Booking cancelled successfully.";
      })

      .addCase(cancelBooking.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to cancel your booking.";
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  clearBookingError,
  clearBookingSuccessMessage,
  clearBookingMessages,
  clearSlotsError,
  clearAvailabilitySlots,
  clearCurrentBooking,
  setCurrentBooking,
  clearPaymentError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
