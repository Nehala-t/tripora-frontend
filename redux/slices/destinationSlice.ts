import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";

// ========================================
// TYPES
// ========================================

export interface DestinationImage {
  url: string;
  publicId: string;
}

export interface DestinationCoordinates {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  [key: string]: number | undefined;
}

export interface Destination {
  _id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  coordinates?: DestinationCoordinates;
  image?: DestinationImage;
  region?: string;
  highlights?: string[];
  bestTimeToVisit?: string;
  isFeatured?: boolean;
  status?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DestinationFilters {
  search?: string;
  country?: string;
  region?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc";
}

// Backend list response:
// {
//   success: true,
//   results: 6,
//   pagination: { page, limit, total, totalPages },
//   data: [...]
// }

interface DestinationResponse {
  success: boolean;
  message?: string;
  results: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  data: Destination[];
}

interface SingleDestinationResponse {
  success: boolean;
  message: string;
  destination: Destination;
}

interface DestinationState {
  destinations: Destination[];
  currentDestination: Destination | null;
  featuredDestinations: Destination[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  featuredLoading: boolean;
  detailsLoading: boolean;
  error: string | null;
}

const initialState: DestinationState = {
  destinations: [],
  currentDestination: null,
  featuredDestinations: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  loading: false,
  featuredLoading: false,
  detailsLoading: false,
  error: null,
};

// ========================================
// ERROR HANDLER
// ========================================

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong";
};

// ========================================
// 1. FETCH ALL DESTINATIONS (PUBLIC)
// GET /api/destinations
// ========================================

export const fetchDestinations = createAsyncThunk<
  DestinationResponse,
  DestinationFilters | void,
  { rejectValue: string }
>(
  "destinations/fetchAll",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get<DestinationResponse>(
        "/destinations",
        {
          params: {
            search: filters?.search || undefined,
            country: filters?.country || undefined,
            region: filters?.region || undefined,
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
            sort: filters?.sort ?? "newest",
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error("FETCH DESTINATIONS ERROR:", error);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 2. FETCH DESTINATION BY ID (PUBLIC)
// GET /api/destinations/:id
// ========================================

export const fetchDestinationById = createAsyncThunk<
  Destination,
  string,
  { rejectValue: string }
>(
  "destinations/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get<SingleDestinationResponse>(
        `/destinations/${id}`
      );

      return response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 3. FETCH DESTINATION BY SLUG (PUBLIC)
// GET /api/destinations/slug/:slug
// ========================================

export const fetchDestinationBySlug = createAsyncThunk<
  Destination,
  string,
  { rejectValue: string }
>(
  "destinations/fetchBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await api.get<SingleDestinationResponse>(
        `/destinations/slug/${slug}`
      );

      return response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 4. FETCH FEATURED DESTINATIONS (PUBLIC)
// GET /api/destinations/featured
// ========================================

export const fetchFeaturedDestinations = createAsyncThunk<
  DestinationResponse,
  number | void,
  { rejectValue: string }
>(
  "destinations/fetchFeatured",
  async (limit, { rejectWithValue }) => {
    try {
      const response = await api.get<DestinationResponse>(
        "/destinations/featured",
        {
          params: {
            limit: limit ?? 6,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error("FETCH FEATURED DESTINATIONS ERROR:", error);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 5. FETCH DESTINATIONS BY COUNTRY (PUBLIC)
// GET /api/destinations/country/:country
// ========================================

export const fetchDestinationsByCountry = createAsyncThunk<
  DestinationResponse,
  string,
  { rejectValue: string }
>(
  "destinations/fetchByCountry",
  async (country, { rejectWithValue }) => {
    try {
      const response = await api.get<DestinationResponse>(
        `/destinations/country/${encodeURIComponent(country)}`
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 6. CREATE DESTINATION (OPERATOR ONLY)
// POST /api/destinations
// ========================================

export const createDestination = createAsyncThunk<
  Destination,
  FormData,
  { rejectValue: string }
>(
  "destinations/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post<SingleDestinationResponse>(
        "/destinations",
        formData
      );

      return response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 7. UPDATE DESTINATION (OPERATOR ONLY)
// PATCH /api/destinations/:id
// ========================================

export const updateDestination = createAsyncThunk<
  Destination,
  { id: string; formData: FormData },
  { rejectValue: string }
>(
  "destinations/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.patch<SingleDestinationResponse>(
        `/destinations/${id}`,
        formData
      );

      return response.data.destination;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// 8. DELETE DESTINATION (OPERATOR ONLY)
// DELETE /api/destinations/:id
// ========================================

export const deleteDestination = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "destinations/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/destinations/${id}`);

      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// REDUX SLICE
// ========================================

const destinationSlice = createSlice({
  name: "destinations",
  initialState,

  reducers: {
    clearDestinationError: (state) => {
      state.error = null;
    },

    clearCurrentDestination: (state) => {
      state.currentDestination = null;
    },

    setCurrentDestination: (
      state,
      action: PayloadAction<Destination | null>
    ) => {
      state.currentDestination = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================================
      // FETCH ALL DESTINATIONS
      // ========================================

      .addCase(fetchDestinations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchDestinations.fulfilled, (state, action) => {
        state.loading = false;

        // Backend returns the array in action.payload.data
        state.destinations = action.payload.data ?? [];

        // Backend pagination is nested inside pagination
        state.total =
          action.payload.pagination?.total ??
          action.payload.results ??
          action.payload.data?.length ??
          0;

        state.page = action.payload.pagination?.page ?? 1;
        state.limit = action.payload.pagination?.limit ?? 10;

        state.totalPages =
          action.payload.pagination?.totalPages ??
          (state.limit > 0
            ? Math.ceil(state.total / state.limit)
            : 0);

        state.error = null;
      })

      .addCase(fetchDestinations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to fetch destinations";
      })

      // ========================================
      // FETCH DESTINATION BY ID
      // ========================================

      .addCase(fetchDestinationById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchDestinationById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentDestination = action.payload;
      })

      .addCase(fetchDestinationById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload ?? "Failed to fetch destination";
      })

      // ========================================
      // FETCH DESTINATION BY SLUG
      // ========================================

      .addCase(fetchDestinationBySlug.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchDestinationBySlug.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentDestination = action.payload;
      })

      .addCase(fetchDestinationBySlug.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload ?? "Failed to fetch destination";
      })

      // ========================================
      // FETCH FEATURED DESTINATIONS
      // ========================================

      .addCase(fetchFeaturedDestinations.pending, (state) => {
        state.featuredLoading = true;
        state.error = null;
      })

      .addCase(fetchFeaturedDestinations.fulfilled, (state, action) => {
        state.featuredLoading = false;

        // Featured endpoint uses the same list response structure
        state.featuredDestinations = action.payload.data ?? [];
      })

      .addCase(fetchFeaturedDestinations.rejected, (state, action) => {
        state.featuredLoading = false;
        state.error =
          action.payload ?? "Failed to fetch featured destinations";
      })

      // ========================================
      // FETCH DESTINATIONS BY COUNTRY
      // ========================================

      .addCase(fetchDestinationsByCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchDestinationsByCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.destinations = action.payload.data ?? [];

        state.total =
          action.payload.pagination?.total ??
          action.payload.results ??
          action.payload.data?.length ??
          0;

        state.page = action.payload.pagination?.page ?? 1;
        state.limit = action.payload.pagination?.limit ?? 10;

        state.totalPages =
          action.payload.pagination?.totalPages ??
          (state.limit > 0
            ? Math.ceil(state.total / state.limit)
            : 0);

        state.error = null;
      })

      .addCase(fetchDestinationsByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to fetch destinations by country";
      })

      // ========================================
      // CREATE DESTINATION
      // ========================================

      .addCase(createDestination.fulfilled, (state, action) => {
        state.destinations.unshift(action.payload);
        state.total += 1;
        state.error = null;
      })

      .addCase(createDestination.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to create destination";
      })

      // ========================================
      // UPDATE DESTINATION
      // ========================================

      .addCase(updateDestination.fulfilled, (state, action) => {
        const updated = action.payload;

        state.destinations = state.destinations.map((destination) =>
          destination._id === updated._id ? updated : destination
        );

        if (state.currentDestination?._id === updated._id) {
          state.currentDestination = updated;
        }

        state.featuredDestinations = state.featuredDestinations.map(
          (destination) =>
            destination._id === updated._id ? updated : destination
        );

        state.error = null;
      })

      .addCase(updateDestination.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to update destination";
      })

      // ========================================
      // DELETE DESTINATION
      // ========================================

      .addCase(deleteDestination.fulfilled, (state, action) => {
        const deletedId = action.payload;

        state.destinations = state.destinations.filter(
          (destination) => destination._id !== deletedId
        );

        state.featuredDestinations =
          state.featuredDestinations.filter(
            (destination) => destination._id !== deletedId
          );

        if (state.currentDestination?._id === deletedId) {
          state.currentDestination = null;
        }

        state.total = Math.max(0, state.total - 1);
        state.error = null;
      })

      .addCase(deleteDestination.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to delete destination";
      });
  },
});

// ========================================
// EXPORTS
// ========================================

export const {
  clearDestinationError,
  clearCurrentDestination,
  setCurrentDestination,
} = destinationSlice.actions;

export default destinationSlice.reducer;
