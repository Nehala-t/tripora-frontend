
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

export type TourStatus = "draft" | "published" | "archived";
export type TourCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED";
export type DifficultyLevel = "easy" | "moderate" | "challenging";

export interface TourImage {
  url: string;
  publicId: string;
}

export interface TourItineraryItem {
  _id?: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface DailyPlan {
  title: string;
  description: string;
  time?: string;
}

export interface MeetingPoint {
  name: string;
  address: string;
  instructions?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface TourDestination {
  _id: string;
  name: string;
  country: string;
  slug?: string;
  region?: string;
  description?: string;
  images?: TourImage[];
  highlights?: string[];
}

export interface TourCategory {
  _id: string;
  name: string;
  slug?: string;
}

export interface Tour {
  _id: string;
  operatorId: string;
  destinationId: TourDestination | string;
  categoryId: TourCategory | string;
  title: string;
  slug: string;
  description: string;

  // Overall tour duration
  durationDays: number;
  nights: number;

  highlights: string[];
  itinerary: TourItineraryItem[];
  days?: DailyPlan[];
  whatsappNumber?: string;
  inclusions: string[];
  exclusions: string[];
  meetingPoint: MeetingPoint;
  images: TourImage[];
  basePrice: number;
  currency: TourCurrency;
  cancellationPolicy: string;
  minParticipants: number;
  maxParticipants: number;
  ageRestrictions: {
    minAge: number;
    maxAge: number | null;
  };
  difficultyLevel: DifficultyLevel;
  languages: string[];
  tags: string[];
  instantBooking: boolean;
  status: TourStatus;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// FETCH ALL TOURS PARAMS
// minDuration and maxDuration are in DAYS
// ============================================

export interface FetchAllToursParams {
  search?: string;
  destinationId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  difficultyLevel?: DifficultyLevel;
  language?: string;
  date?: string;
  participants?: number;
  page?: number;
  limit?: number;
  sort?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "rating"
    | "duration_asc";
}

export interface FetchAllToursResponse {
  tours: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TourState {
  currentTour: Tour | null;
  tours: Tour[];
  detailsLoading: boolean;
  toursLoading: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: TourState = {
  currentTour: null,
  tours: [],
  detailsLoading: false,
  toursLoading: false,
  submitting: false,
  error: null,
  successMessage: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// ============================================
// HELPERS
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

const getTourFromResponse = (data: {
  tour?: Tour;
  data?: Tour;
}): Tour => {
  const tour = data.tour ?? data.data;

  if (!tour) {
    throw new Error("The server did not return the tour.");
  }

  return tour;
};

// ============================================
// 1. FETCH ALL PUBLISHED TOURS
// GET /api/tours
// ============================================

export const fetchAllTours = createAsyncThunk<
  FetchAllToursResponse,
  FetchAllToursParams | void,
  { rejectValue: string }
>(
  "tours/fetchAllTours",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/tours", {
        params: params || {},
      });

      return {
        tours: response.data.tours ?? [],
        total: response.data.total ?? 0,
        page: response.data.page ?? 1,
        limit: response.data.limit ?? 10,
        totalPages: response.data.totalPages ?? 0,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load tours.")
      );
    }
  }
);

// ============================================
// 2. FETCH PUBLISHED TOUR BY ID
// GET /api/tours/id/:id
// ============================================

export const fetchTourById = createAsyncThunk<
  Tour,
  string,
  { rejectValue: string }
>(
  "tours/fetchTourById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tours/id/${id}`);
      return getTourFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load tour details.")
      );
    }
  }
);

// ============================================
// 3. FETCH OPERATOR'S TOURS
// GET /api/tours/operator/my-tours
// ============================================

export const fetchMyTours = createAsyncThunk<
  Tour[],
  { status?: TourStatus; page?: number; limit?: number } | void,
  { rejectValue: string }
>(
  "tours/fetchMyTours",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/tours/operator/my-tours", {
        params: params || {},
        withCredentials: true,
      });

      return (response.data.tours ?? []) as Tour[];
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load your tours.")
      );
    }
  }
);

// ============================================
// 4. CREATE TOUR
// POST /api/tours/create
// ============================================

export const createTour = createAsyncThunk<
  Tour,
  FormData,
  { rejectValue: string }
>(
  "tours/createTour",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/tours/create", formData, {
        withCredentials: true,
      });

      return getTourFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to create the tour.")
      );
    }
  }
);

// ============================================
// 5. UPDATE TOUR
// PATCH /api/tours/:id
// ============================================

export interface UpdateTourPayload {
  tourId: string;
  updates: FormData | Record<string, unknown>;
}

export const updateTour = createAsyncThunk<
  Tour,
  UpdateTourPayload,
  { rejectValue: string }
>(
  "tours/updateTour",
  async ({ tourId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tours/${tourId}`,
        updates,
        { withCredentials: true }
      );

      return getTourFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to update the tour.")
      );
    }
  }
);

// ============================================
// 6. PUBLISH TOUR
// PATCH /api/tours/:id/publish
// ============================================

export const publishTour = createAsyncThunk<
  Tour,
  string,
  { rejectValue: string }
>(
  "tours/publishTour",
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tours/${tourId}/publish`,
        {},
        { withCredentials: true }
      );

      return getTourFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to publish the tour.")
      );
    }
  }
);

// ============================================
// 7. UNPUBLISH TOUR
// PATCH /api/tours/:id/unpublish
// ============================================

export const unpublishTour = createAsyncThunk<
  Tour,
  string,
  { rejectValue: string }
>(
  "tours/unpublishTour",
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tours/${tourId}/unpublish`,
        {},
        { withCredentials: true }
      );

      return getTourFromResponse(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to unpublish the tour.")
      );
    }
  }
);

// ============================================
// 8. DELETE TOUR
// DELETE /api/tours/:id
// ============================================

export const deleteTour = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "tours/deleteTour",
  async (tourId, { rejectWithValue }) => {
    try {
      await api.delete(`/tours/${tourId}`, {
        withCredentials: true,
      });

      return tourId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to delete the tour.")
      );
    }
  }
);

// ============================================
// SLICE
// ============================================

const tourSlice = createSlice({
  name: "tours",
  initialState,

  reducers: {
    clearCurrentTour(state) {
      state.currentTour = null;
      state.detailsLoading = false;
    },

    clearTourError(state) {
      state.error = null;
    },

    clearTourSuccessMessage(state) {
      state.successMessage = null;
    },

    clearTourMessages(state) {
      state.error = null;
      state.successMessage = null;
    },

    setCurrentTour(state, action: PayloadAction<Tour>) {
      state.currentTour = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // FETCH ALL PUBLISHED TOURS
      .addCase(fetchAllTours.pending, (state) => {
        state.toursLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTours.fulfilled, (state, action) => {
        state.toursLoading = false;
        state.tours = action.payload.tours;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAllTours.rejected, (state, action) => {
        state.toursLoading = false;
        state.error = action.payload || "Unable to load tours.";
      })

      // FETCH TOUR BY ID
      .addCase(fetchTourById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchTourById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentTour = action.payload;
      })
      .addCase(fetchTourById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload || "Unable to load tour details.";
      })

      // FETCH OPERATOR TOURS
      .addCase(fetchMyTours.pending, (state) => {
        state.toursLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTours.fulfilled, (state, action) => {
        state.toursLoading = false;
        state.tours = action.payload;
      })
      .addCase(fetchMyTours.rejected, (state, action) => {
        state.toursLoading = false;
        state.error =
          action.payload || "Unable to load your tours.";
      })

      // CREATE TOUR
      .addCase(createTour.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createTour.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentTour = action.payload;
        state.tours = [
          action.payload,
          ...state.tours.filter(
            (tour) => tour._id !== action.payload._id
          ),
        ];
        state.successMessage =
          "Tour created successfully as a draft.";
      })
      .addCase(createTour.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to create the tour.";
      })

      // UPDATE TOUR
      .addCase(updateTour.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateTour.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentTour = action.payload;
        state.tours = state.tours.map((tour) =>
          tour._id === action.payload._id ? action.payload : tour
        );
        state.successMessage = "Tour updated successfully.";
      })
      .addCase(updateTour.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to update the tour.";
      })

      // PUBLISH TOUR
      .addCase(publishTour.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(publishTour.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentTour = action.payload;
        state.tours = state.tours.map((tour) =>
          tour._id === action.payload._id ? action.payload : tour
        );
        state.successMessage = "Tour published successfully.";
      })
      .addCase(publishTour.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to publish the tour.";
      })

      // UNPUBLISH TOUR
      .addCase(unpublishTour.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(unpublishTour.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentTour = action.payload;
        state.tours = state.tours.map((tour) =>
          tour._id === action.payload._id ? action.payload : tour
        );
        state.successMessage = "Tour unpublished successfully.";
      })
      .addCase(unpublishTour.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to unpublish the tour.";
      })

      // DELETE TOUR
      .addCase(deleteTour.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteTour.fulfilled, (state, action) => {
        state.submitting = false;
        state.tours = state.tours.filter(
          (tour) => tour._id !== action.payload
        );

        if (state.currentTour?._id === action.payload) {
          state.currentTour = null;
        }

        state.successMessage = "Tour deleted successfully.";
      })
      .addCase(deleteTour.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to delete the tour.";
      });
  },
});

export const {
  clearCurrentTour,
  clearTourError,
  clearTourSuccessMessage,
  clearTourMessages,
  setCurrentTour,
} = tourSlice.actions;

export default tourSlice.reducer;
