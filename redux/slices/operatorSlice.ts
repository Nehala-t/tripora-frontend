
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

// ========================================
// TYPES
// ========================================

export interface DestinationOption {
  _id: string;
  name: string;
  country: string;
  description?: string;
  region?: string;
  bestTimeToVisit?: string;
  highlights?: string[];
  coordinates?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  images?: { url: string; publicId: string }[];
  isFeatured?: boolean;
  status?: string;
}

export interface CategoryOption {
  _id: string;
  name: string;
}

export interface TourImage {
  url: string;
  publicId: string;
}

export interface TourDay {
  title: string;
  description: string;
  time?: string;
}

export interface TourMeetingPoint {
  name: string;
  address: string;
  instructions?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface TourAgeRestrictions {
  minAge?: number;
  maxAge?: number | null;
}

export type TourRequestData = FormData | Record<string, unknown>;
export type DestinationPayload = FormData | Record<string, unknown>;

export interface OperatorTour {
  _id: string;
  title: string;
  slug?: string;

  operatorId?: string;
  destinationId?: string | { _id: string; name?: string };
  categoryId?: string | { _id: string; name?: string };

  description?: string;

  durationDays?: number;
  nights?: number;
  durationMinutes?: number;

  highlights?: string[];
  days?: TourDay[];
  itinerary?: TourDay[];
  inclusions?: string[];
  exclusions?: string[];

  meetingPoint?: TourMeetingPoint;

  whatsappNumber?: string;
  whatsAppNumber?: string;
  contact?: {
    whatsappNumber?: string;
  };

  images?: TourImage[];

  basePrice?: number;
  currency?: string;
  cancellationPolicy?: string;

  minParticipants?: number;
  maxParticipants?: number;
  ageRestrictions?: TourAgeRestrictions;

  difficultyLevel?: "easy" | "moderate" | "challenging";
  languages?: string[];
  tags?: string[];
  instantBooking?: boolean;

  status?: "draft" | "published" | "archived";

  averageRating?: number;
  reviewCount?: number;
  isDeleted?: boolean;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

// ========================================
// BOOKING TYPES
// ========================================

export interface OperatorBooking {
  _id: string;
  bookingReference?: string;

  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | string;

  tourId?: {
    _id?: string;
    title?: string;
    images?: {
      url: string;
      publicId?: string;
    }[];
  } | string;

  scheduleId?: {
    _id?: string;
    startDate?: string;
    endDate?: string;
    startAt?: string;
    endAt?: string;
  } | string;

  availabilitySlotId?: {
    _id?: string;
    startAt?: string;
    endAt?: string;
  } | string;

  startAt?: string;
  endAt?: string;

  travelDate?: string;

  participants?: number;

  travelerDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };

  specialRequests?: string;

  pricePerParticipant?: number;
  totalPrice?: number;
  currency?: string;

  paymentStatus?: string;
  paymentMethod?: string;

  paymentId?: string;

  status?: string;

  cancellationReason?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// DASHBOARD TYPES
// ========================================

export interface OperatorCurrencyEarning {
  _id: string | null;
  grossAmount: number;
  paidBookings: number;
}

export interface OperatorEarnings {
  grossAmount: number;
  paidAmount: number;
  netAmount: number;
  commission: number;
  pendingAmount: number;
  paidBookings: number;
  byCurrency: OperatorCurrencyEarning[];
}

export interface OperatorDashboard {
  tours: {
    total: number;
    published: number;
  };

  bookings: {
    total: number;
    pending: number;
    upcoming: number;
  };

  guests: {
    total: number;
  };

  earnings: OperatorEarnings;

  recentBookings: OperatorBooking[];
}

// ========================================
// PAGINATION TYPES
// ========================================

interface OperatorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OperatorState {
  dashboard: OperatorDashboard | null;

  tours: OperatorTour[];
  bookings: OperatorBooking[];

  destinations: DestinationOption[];
  categories: CategoryOption[];

  loading: boolean;
  actionLoading: boolean;

  error: string | null;
  message: string | null;

  pagination: OperatorPagination;
}

// ========================================
// INITIAL STATE
// ========================================

const initialState: OperatorState = {
  dashboard: null,

  tours: [],
  bookings: [],

  destinations: [],
  categories: [],

  loading: false,
  actionLoading: false,

  error: null,
  message: null,

  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

// ========================================
// RESPONSE HELPERS
// ========================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as {
      response?: { data?: { message?: string } };
    };

    return apiError.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function getTourResponse(data: unknown): OperatorTour {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid tour response from server");
  }

  const response = data as {
    tour?: OperatorTour;
    data?: OperatorTour;
  };

  const tour = response.tour ?? response.data;

  if (!tour?._id) {
    throw new Error("The server response did not include the tour");
  }

  return tour;
}

// ========================================
// FETCH DESTINATIONS
// ========================================

export const fetchOperatorDestinations = createAsyncThunk<
  DestinationOption[],
  void,
  { rejectValue: string }
>(
  "operator/fetchDestinations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/destinations");

      const data = response.data.data ?? response.data.destinations;

      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch destinations")
      );
    }
  }
);

// ========================================
// CREATE DESTINATION
// ========================================

export const createOperatorDestination = createAsyncThunk<
  DestinationOption,
  DestinationPayload,
  { rejectValue: string }
>(
  "operator/createDestination",
  async (destinationData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/destinations/create",
        destinationData
      );

      return response.data.data ?? response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create destination")
      );
    }
  }
);

// ========================================
// UPDATE DESTINATION
// ========================================

export const updateOperatorDestination = createAsyncThunk<
  DestinationOption,
  { destinationId: string; updates: DestinationPayload },
  { rejectValue: string }
>(
  "operator/updateDestination",
  async ({ destinationId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/destinations/${destinationId}`,
        updates
      );

      return response.data.data ?? response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update destination")
      );
    }
  }
);

// ========================================
// DELETE DESTINATION
// ========================================

export const deleteOperatorDestination = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "operator/deleteDestination",
  async (destinationId, { rejectWithValue }) => {
    try {
      await api.delete(`/destinations/${destinationId}`);

      return destinationId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete destination")
      );
    }
  }
);

// ========================================
// FETCH CATEGORIES
// ========================================

export const fetchOperatorCategories = createAsyncThunk<
  CategoryOption[],
  void,
  { rejectValue: string }
>(
  "operator/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/categories/");

      const data = response.data.data ?? response.data.categories;

      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch categories")
      );
    }
  }
);

// ========================================
// FETCH OPERATOR DASHBOARD
// GET /api/operator/dashboard
// ========================================

export const fetchOperatorDashboard = createAsyncThunk<
  OperatorDashboard,
  void,
  { rejectValue: string }
>(
  "operator/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/operator/dashboard");

      const dashboard = response.data.data ?? response.data;

      return dashboard as OperatorDashboard;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load dashboard data")
      );
    }
  }
);

// ========================================
// FETCH OPERATOR TOURS
// GET /api/tours/operator/my-tours
// ========================================

export const fetchOperatorTours = createAsyncThunk<
  { data: OperatorTour[]; pagination: OperatorPagination },
  { status?: string; search?: string; page?: number } | undefined,
  { rejectValue: string }
>(
  "operator/fetchTours",
  async (query, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (query?.status) params.append("status", query.status);
      if (query?.search) params.append("search", query.search);

      if (query?.page) {
        params.append("page", String(query.page));
      }

      const queryString = params.toString();

      const url = queryString
        ? `/tours/operator/my-tours?${queryString}`
        : "/tours/operator/my-tours";

      const response = await api.get(url);
      const result = response.data;

      return {
        data: Array.isArray(result.tours)
          ? result.tours
          : Array.isArray(result.data)
            ? result.data
            : [],

        pagination: {
          total: result.total ?? 0,
          page: result.page ?? 1,
          limit: result.limit ?? 10,
          totalPages: result.totalPages ?? 1,
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch tours")
      );
    }
  }
);

// ========================================
// CREATE TOUR
// POST /api/tours/create
// ========================================

export const createOperatorTour = createAsyncThunk<
  OperatorTour,
  TourRequestData,
  { rejectValue: string }
>(
  "operator/createTour",
  async (tourData, { rejectWithValue }) => {
    try {
      const response = await api.post("/tours/create", tourData);

      return getTourResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create tour")
      );
    }
  }
);

// ========================================
// UPDATE TOUR
// PATCH /api/tours/:id
// ========================================

export const updateOperatorTour = createAsyncThunk<
  OperatorTour,
  { tourId: string; updates: TourRequestData },
  { rejectValue: string }
>(
  "operator/updateTour",
  async ({ tourId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tours/${tourId}`,
        updates
      );

      return getTourResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update tour")
      );
    }
  }
);

// ========================================
// PUBLISH TOUR
// PATCH /api/tours/:id/publish
// ========================================

export const publishOperatorTour = createAsyncThunk<
  OperatorTour,
  string,
  { rejectValue: string }
>(
  "operator/publishTour",
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tours/${tourId}/publish`
      );

      return getTourResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to publish tour")
      );
    }
  }
);

// ========================================
// DELETE / SOFT DELETE TOUR
// DELETE /api/tours/:id
// ========================================

export const deleteOperatorTour = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "operator/deleteTour",
  async (tourId, { rejectWithValue }) => {
    try {
      await api.delete(`/tours/${tourId}`);

      return tourId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete tour")
      );
    }
  }
);

// ========================================
// FETCH ALL OPERATOR BOOKINGS
// GET /api/operator/bookings
// ========================================

export const fetchOperatorBookings = createAsyncThunk<
  { data: OperatorBooking[]; pagination?: OperatorPagination },
  string | undefined,
  { rejectValue: string }
>(
  "operator/fetchBookings",
  async (status, { rejectWithValue }) => {
    try {
      const allBookings: OperatorBooking[] = [];

      let currentPage = 1;
      let totalPages = 1;
      let totalBookings = 0;

      do {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "100",
        });

        if (status) {
          params.set("status", status);
        }

        const response = await api.get(
          `/operator/bookings?${params.toString()}`
        );

        const result = response.data;

        if (!Array.isArray(result.data)) {
          throw new Error(
            "Invalid bookings response from server"
          );
        }

        allBookings.push(...result.data);

        totalPages = Number(result.pagination?.totalPages) || 1;
        totalBookings = Number(result.pagination?.total) || 0;

        currentPage += 1;
      } while (currentPage <= totalPages);

      return {
        data: allBookings,

        pagination: {
          total: totalBookings,
          page: 1,
          limit: 100,
          totalPages,
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load operator bookings")
      );
    }
  }
);

// ========================================
// UPDATE BOOKING STATUS
// PATCH /api/operator/bookings/:id/status
// ========================================

export const updateBookingStatus = createAsyncThunk<
  OperatorBooking,
  { bookingId: string; status: string },
  { rejectValue: string }
>(
  "operator/updateBookingStatus",
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/operator/bookings/${bookingId}/status`,
        { status }
      );

      return (
        response.data.data ??
        response.data.booking
      ) as OperatorBooking;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update booking status")
      );
    }
  }
);

// ========================================
// SLICE
// ========================================

const operatorSlice = createSlice({
  name: "operator",
  initialState,

  reducers: {
    clearOperatorError: (state) => {
      state.error = null;
    },

    clearOperatorMessage: (state) => {
      state.message = null;
    },

    clearOperatorDestinations: (state) => {
      state.destinations = [];
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================================
      // DESTINATIONS: FETCH
      // ========================================

      .addCase(fetchOperatorDestinations.fulfilled, (state, action) => {
        state.destinations = action.payload;
      })

      .addCase(fetchOperatorDestinations.rejected, (state, action) => {
        state.error =
          action.payload || "Failed to fetch destinations";
      })

      // ========================================
      // DESTINATIONS: CREATE
      // ========================================

      .addCase(createOperatorDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(createOperatorDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        if (action.payload?._id) {
          state.destinations.unshift(action.payload);
        }

        state.message = "Destination created successfully.";
      })

      .addCase(createOperatorDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to create destination";
      })

      // ========================================
      // DESTINATIONS: UPDATE
      // ========================================

      .addCase(updateOperatorDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(updateOperatorDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.destinations.findIndex(
          (item) => item._id === action.payload._id
        );

        if (index !== -1) {
          state.destinations[index] = action.payload;
        }

        state.message = "Destination updated successfully.";
      })

      .addCase(updateOperatorDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update destination";
      })

      // ========================================
      // DESTINATIONS: DELETE
      // ========================================

      .addCase(deleteOperatorDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(deleteOperatorDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.destinations = state.destinations.filter(
          (item) => item._id !== action.payload
        );

        state.message = "Destination deleted successfully.";
      })

      .addCase(deleteOperatorDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to delete destination";
      })

      // ========================================
      // CATEGORIES
      // ========================================

      .addCase(fetchOperatorCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })

      .addCase(fetchOperatorCategories.rejected, (state, action) => {
        state.error =
          action.payload || "Failed to fetch categories";
      })

      // ========================================
      // DASHBOARD
      // ========================================

      .addCase(fetchOperatorDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOperatorDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })

      .addCase(fetchOperatorDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to load dashboard data";
      })

      // ========================================
      // TOURS: FETCH
      // ========================================

      .addCase(fetchOperatorTours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOperatorTours.fulfilled, (state, action) => {
        state.loading = false;
        state.tours = action.payload.data;
        state.pagination = action.payload.pagination;
      })

      .addCase(fetchOperatorTours.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch tours";
      })

      // ========================================
      // TOURS: CREATE
      // ========================================

      .addCase(createOperatorTour.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(createOperatorTour.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.tours = [
          action.payload,
          ...state.tours.filter(
            (tour) => tour._id !== action.payload._id
          ),
        ];

        state.message = "Tour created successfully.";
      })

      .addCase(createOperatorTour.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to create tour";
      })

      // ========================================
      // TOURS: UPDATE
      // ========================================

      .addCase(updateOperatorTour.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(updateOperatorTour.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.tours.findIndex(
          (tour) => tour._id === action.payload._id
        );

        if (index !== -1) {
          state.tours[index] = action.payload;
        } else {
          state.tours.unshift(action.payload);
        }

        state.message = "Tour updated successfully.";
      })

      .addCase(updateOperatorTour.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update tour";
      })

      // ========================================
      // TOURS: PUBLISH
      // ========================================

      .addCase(publishOperatorTour.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(publishOperatorTour.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.tours.findIndex(
          (tour) => tour._id === action.payload._id
        );

        if (index !== -1) {
          state.tours[index] = action.payload;
        }

        state.message = "Tour published successfully.";
      })

      .addCase(publishOperatorTour.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to publish tour";
      })

      // ========================================
      // TOURS: DELETE
      // ========================================

      .addCase(deleteOperatorTour.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(deleteOperatorTour.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.tours = state.tours.filter(
          (tour) => tour._id !== action.payload
        );

        state.message = "Tour deleted successfully.";
      })

      .addCase(deleteOperatorTour.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to delete tour";
      })

      // ========================================
      // BOOKINGS: FETCH
      // ========================================

      .addCase(fetchOperatorBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOperatorBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.data;

        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })

      .addCase(fetchOperatorBookings.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to load bookings";
      })

      // ========================================
      // BOOKINGS: UPDATE STATUS
      // ========================================

      .addCase(updateBookingStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.bookings.findIndex(
          (booking) => booking._id === action.payload._id
        );

        if (index !== -1) {
          state.bookings[index] = action.payload;
        }

        state.message = "Booking order status updated.";
      })

      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update booking status";
      });
  },
});

// ========================================
// EXPORTS
// ========================================

export const {
  clearOperatorError,
  clearOperatorMessage,
  clearOperatorDestinations,
} = operatorSlice.actions;

export default operatorSlice.reducer;
