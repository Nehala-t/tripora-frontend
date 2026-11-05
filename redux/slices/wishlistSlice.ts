
import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";
import type { Tour } from "./tourSlice";

// ============================================
// TYPES
// ============================================

interface WishlistState {
  wishlistTours: Tour[];
  wishlistIds: string[];
  loading: boolean;
  submittingIds: string[];
  clearing: boolean;
  error: string | null;
  wishlistChecks: Record<string, boolean>;
}

interface ApiError {
  rejectValue: string;
}

interface CheckWishlistResponse {
  tourId: string;
  isWishlisted: boolean;
}

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

// ============================================
// INITIAL STATE
// ============================================

const initialState: WishlistState = {
  wishlistTours: [],
  wishlistIds: [],
  loading: false,
  submittingIds: [],
  clearing: false,
  error: null,
  wishlistChecks: {},
};

// ============================================
// 1. FETCH MY WISHLIST
// GET /api/wishlist
// ============================================

export const fetchMyWishlist = createAsyncThunk<
  Tour[],
  void,
  ApiError
>(
  "wishlist/fetchMyWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/wishlist", {
        withCredentials: true,
      });

      return response.data.data ?? [];
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to load your wishlist.")
      );
    }
  }
);

// ============================================
// 2. ADD TOUR TO WISHLIST
// POST /api/wishlist
// Body: { tourId }
// ============================================

export const addToWishlist = createAsyncThunk<
  string,
  string,
  ApiError
>(
  "wishlist/addToWishlist",
  async (tourId, { rejectWithValue }) => {
    try {
      await api.post(
        "/wishlist/add",
        { tourId },
        { withCredentials: true }
      );

      return tourId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to add tour to wishlist.")
      );
    }
  }
);

// ============================================
// 3. REMOVE TOUR FROM WISHLIST
// DELETE /api/wishlist/:tourId
// ============================================

export const removeFromWishlist = createAsyncThunk<
  string,
  string,
  ApiError
>(
  "wishlist/removeFromWishlist",
  async (tourId, { rejectWithValue }) => {
    try {
      await api.delete(`/wishlist/${tourId}`, {
        withCredentials: true,
      });

      return tourId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to remove tour from wishlist.")
      );
    }
  }
);

// ============================================
// 4. CHECK IF TOUR IS WISHLISTED
// GET /api/wishlist/check/:tourId
// ============================================

export const checkWishlist = createAsyncThunk<
  CheckWishlistResponse,
  string,
  ApiError
>(
  "wishlist/checkWishlist",
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/wishlist/check/${tourId}`,
        { withCredentials: true }
      );

      return {
        tourId,
        isWishlisted: Boolean(
          response.data.data?.isWishlisted
        ),
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to check wishlist.")
      );
    }
  }
);

// ============================================
// 5. CLEAR ENTIRE WISHLIST
// DELETE /api/wishlist
// ============================================

export const clearWishlist = createAsyncThunk<
  void,
  void,
  ApiError
>(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/wishlist", {
        withCredentials: true,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to clear wishlist.")
      );
    }
  }
);

// ============================================
// SLICE
// ============================================

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,

  reducers: {
    clearWishlistError(state) {
      state.error = null;
    },

    resetWishlist(state) {
      state.wishlistTours = [];
      state.wishlistIds = [];
      state.loading = false;
      state.submittingIds = [];
      state.clearing = false;
      state.error = null;
      state.wishlistChecks = {};
    },

    setWishlistCheck(
      state,
      action: PayloadAction<{
        tourId: string;
        isWishlisted: boolean;
      }>
    ) {
      const { tourId, isWishlisted } = action.payload;

      state.wishlistChecks[tourId] = isWishlisted;

      if (isWishlisted && !state.wishlistIds.includes(tourId)) {
        state.wishlistIds.push(tourId);
      }

      if (!isWishlisted) {
        state.wishlistIds = state.wishlistIds.filter(
          (id) => id !== tourId
        );

        state.wishlistTours = state.wishlistTours.filter(
          (tour) => tour._id !== tourId
        );
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // FETCH WISHLIST
      .addCase(fetchMyWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlistTours = action.payload;
        state.wishlistIds = action.payload.map(
          (tour) => tour._id
        );

        state.wishlistChecks = Object.fromEntries(
          state.wishlistIds.map((id) => [id, true])
        );
      })
      .addCase(fetchMyWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Unable to load your wishlist.";
      })

      // ADD TOUR
      .addCase(addToWishlist.pending, (state, action) => {
        const tourId = action.meta.arg;

        state.error = null;

        if (!state.submittingIds.includes(tourId)) {
          state.submittingIds.push(tourId);
        }
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const tourId = action.payload;

        state.submittingIds = state.submittingIds.filter(
          (id) => id !== tourId
        );

        if (!state.wishlistIds.includes(tourId)) {
          state.wishlistIds.push(tourId);
        }

        state.wishlistChecks[tourId] = true;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        const tourId = action.meta.arg;

        state.submittingIds = state.submittingIds.filter(
          (id) => id !== tourId
        );

        state.error =
          action.payload ?? "Unable to add tour to wishlist.";
      })

      // REMOVE TOUR
      .addCase(removeFromWishlist.pending, (state, action) => {
        const tourId = action.meta.arg;

        state.error = null;

        if (!state.submittingIds.includes(tourId)) {
          state.submittingIds.push(tourId);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const tourId = action.payload;

        state.submittingIds = state.submittingIds.filter(
          (id) => id !== tourId
        );

        state.wishlistIds = state.wishlistIds.filter(
          (id) => id !== tourId
        );

        state.wishlistTours = state.wishlistTours.filter(
          (tour) => tour._id !== tourId
        );

        state.wishlistChecks[tourId] = false;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        const tourId = action.meta.arg;

        state.submittingIds = state.submittingIds.filter(
          (id) => id !== tourId
        );

        state.error =
          action.payload ?? "Unable to remove tour from wishlist.";
      })

      // CHECK WISHLIST
      .addCase(checkWishlist.fulfilled, (state, action) => {
        const { tourId, isWishlisted } = action.payload;

        state.wishlistChecks[tourId] = isWishlisted;

        if (isWishlisted && !state.wishlistIds.includes(tourId)) {
          state.wishlistIds.push(tourId);
        }

        if (!isWishlisted) {
          state.wishlistIds = state.wishlistIds.filter(
            (id) => id !== tourId
          );
        }
      })

      // CLEAR WISHLIST
      .addCase(clearWishlist.pending, (state) => {
        state.clearing = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.clearing = false;
        state.wishlistTours = [];
        state.wishlistIds = [];
        state.wishlistChecks = {};
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.clearing = false;
        state.error =
          action.payload ?? "Unable to clear wishlist.";
      });
  },
});

export const {
  clearWishlistError,
  resetWishlist,
  setWishlistCheck,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
