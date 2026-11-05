
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";

// ======================================================
// TYPES
// ======================================================

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hidden";

export interface ModerateReviewPayload {
  reviewId: string;
  status: "approved" | "rejected" | "hidden";
  moderationNote?: string;
}

export interface PopulatedReviewTour {
  _id: string;
  title: string;
  images?: {
    url: string;
    publicId?: string;
  }[];
}

export interface PopulatedReviewUser {
  _id: string;
  name?: string;
  firstName?: string;
  email?: string;
}

export interface PopulatedReviewBooking {
  _id: string;
  bookingReference?: string;
  status?: string;
}

export interface Review {
  _id: string;

  bookingId: string | PopulatedReviewBooking;

  userId: string | PopulatedReviewUser;

  tourId: string | PopulatedReviewTour;

  rating: number;
  comment: string;

  status: ReviewStatus;

  moderatedBy?: string | null;
  moderatedAt?: string | null;
  moderationNote?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewPayload {
  reviewId: string;
  rating?: number;
  comment?: string;
}

// ======================================================
// API RESPONSE TYPES
// ======================================================

interface ReviewResponse {
  success?: boolean;
  message?: string;
  review?: Review;
  data?: Review | { review?: Review };
}

interface ReviewsResponse {
  success?: boolean;
  message?: string;
  reviews?: Review[];
  data?: Review[] | { reviews?: Review[] };
}

// ======================================================
// REDUX STATE
// ======================================================

interface ReviewState {
  // Traveler review data
  reviews: Review[];
  currentReview: Review | null;

  // Operator moderation data
  moderationReviews: Review[];

  // Loading states
  loading: boolean;
  submitting: boolean;
  updating: boolean;
  deleting: boolean;

  moderationLoading: boolean;
  moderating: boolean;

  // Messages
  error: string | null;
  successMessage: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  currentReview: null,

  moderationReviews: [],

  loading: false,
  submitting: false,
  updating: false,
  deleting: false,

  moderationLoading: false,
  moderating: false,

  error: null,
  successMessage: null,
};

// ======================================================
// HELPER FUNCTIONS
// ======================================================

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

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const extractReview = (
  response: ReviewResponse | Review
): Review | null => {
  const result = response as ReviewResponse;

  if (result.review) {
    return result.review;
  }

  if (result.data) {
    if (
      typeof result.data === "object" &&
      "review" in result.data &&
      result.data.review
    ) {
      return result.data.review;
    }

    if (
      typeof result.data === "object" &&
      "_id" in result.data
    ) {
      return result.data as Review;
    }
  }

  if ("_id" in response) {
    return response as Review;
  }

  return null;
};

const extractReviews = (
  response: ReviewsResponse | Review[]
): Review[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.reviews)) {
    return response.reviews;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (
    response.data &&
    !Array.isArray(response.data) &&
    Array.isArray(response.data.reviews)
  ) {
    return response.data.reviews;
  }

  return [];
};

// ======================================================
// CREATE REVIEW
// ======================================================

export const createReview = createAsyncThunk<
  Review,
  CreateReviewPayload,
  { rejectValue: string }
>(
  "reviews/createReview",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<ReviewResponse>(
        "/reviews",
        payload
      );

      const review = extractReview(response.data);

      if (!review) {
        return rejectWithValue(
          "Invalid review response from server."
        );
      }

      return review;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to submit review.")
      );
    }
  }
);

// ======================================================
// FETCH MY REVIEWS
// ======================================================

export const fetchMyReviews = createAsyncThunk<
  Review[],
  void,
  { rejectValue: string }
>(
  "reviews/fetchMyReviews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ReviewsResponse>(
        "/reviews/my-reviews"
      );

      return extractReviews(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to fetch your reviews.")
      );
    }
  }
);

// ======================================================
// FETCH TOUR REVIEWS
// ======================================================

export const fetchTourReviews = createAsyncThunk<
  Review[],
  string,
  { rejectValue: string }
>(
  "reviews/fetchTourReviews",
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await api.get<ReviewsResponse>(
        `/reviews/tour/${tourId}`
      );

      return extractReviews(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to fetch tour reviews.")
      );
    }
  }
);

// ======================================================
// UPDATE MY REVIEW
// ======================================================

export const updateReview = createAsyncThunk<
  Review,
  UpdateReviewPayload,
  { rejectValue: string }
>(
  "reviews/updateReview",
  async (
    { reviewId, rating, comment },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put<ReviewResponse>(
        `/reviews/${reviewId}`,
        {
          rating,
          comment,
        }
      );

      const review = extractReview(response.data);

      if (!review) {
        return rejectWithValue(
          "Invalid review response from server."
        );
      }

      return review;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to update review.")
      );
    }
  }
);

// ======================================================
// DELETE MY REVIEW
// ======================================================

export const deleteReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "reviews/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${reviewId}`);

      return reviewId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to delete review.")
      );
    }
  }
);

// ======================================================
// FETCH REVIEWS FOR OPERATOR / ADMIN MODERATION
// ======================================================


export const fetchReviewsForModeration = createAsyncThunk<
  Review[],
  void,
  { rejectValue: string }
>(
  "reviews/fetchReviewsForModeration",
  async (_, { rejectWithValue }) => {
    try {
      const statuses: ReviewStatus[] = [
        "pending",
        "approved",
        "rejected",
        "hidden",
      ];

      const responses = await Promise.all(
        statuses.map((status) =>
          api.get<ReviewsResponse>("/reviews/moderation", {
            params: { status },
          })
        )
      );

      const allReviews = responses.flatMap((response) =>
        extractReviews(response.data)
      );

      // Remove duplicate reviews.
      const uniqueReviews = Array.from(
        new Map(
          allReviews.map((review) => [review._id, review])
        ).values()
      );

      return uniqueReviews;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Unable to fetch reviews."
        )
      );
    }
  }
);


// ======================================================
// MODERATE REVIEW
// Approve / Reject / Hide
// ======================================================

export const moderateReview = createAsyncThunk<
  Review,
  ModerateReviewPayload,
  { rejectValue: string }
>(
  "reviews/moderateReview",
  async (
    { reviewId, status, moderationNote },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch<ReviewResponse>(
        `/reviews/${reviewId}/moderate`,
        {
          status,
          moderationNote,
        }
      );

      const review = extractReview(response.data);

      if (!review) {
        return rejectWithValue(
          "Invalid moderation response from server."
        );
      }

      return review;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Unable to moderate review."
        )
      );
    }
  }
);

// ======================================================
// REVIEW SLICE
// ======================================================

const reviewSlice = createSlice({
  name: "reviews",
  initialState,

  reducers: {
    clearReviewMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    clearCurrentReview: (state) => {
      state.currentReview = null;
    },

    resetReviews: (state) => {
      state.reviews = [];
      state.currentReview = null;
      state.moderationReviews = [];
      state.error = null;
      state.successMessage = null;
    },

    clearModerationReviews: (state) => {
      state.moderationReviews = [];
    },
  },

  extraReducers: (builder) => {
    builder

      // ================================================
      // CREATE REVIEW
      // ================================================

      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentReview = action.payload;

        state.reviews = [
          action.payload,
          ...state.reviews.filter(
            (review) => review._id !== action.payload._id
          ),
        ];

        state.successMessage = "Review submitted successfully.";
      })

      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload || "Unable to submit review.";
      })

      // ================================================
      // FETCH MY REVIEWS
      // ================================================

      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })

      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to fetch your reviews.";
      })

      // ================================================
      // FETCH TOUR REVIEWS
      // ================================================

      .addCase(fetchTourReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchTourReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })

      .addCase(fetchTourReviews.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to fetch tour reviews.";
      })

      // ================================================
      // UPDATE REVIEW
      // ================================================

      .addCase(updateReview.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateReview.fulfilled, (state, action) => {
        state.updating = false;

        state.reviews = state.reviews.map((review) =>
          review._id === action.payload._id
            ? action.payload
            : review
        );

        if (
          state.currentReview?._id === action.payload._id
        ) {
          state.currentReview = action.payload;
        }

        state.successMessage = "Review updated successfully.";
      })

      .addCase(updateReview.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Unable to update review.";
      })

      // ================================================
      // DELETE REVIEW
      // ================================================

      .addCase(deleteReview.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deleting = false;

        state.reviews = state.reviews.filter(
          (review) => review._id !== action.payload
        );

        state.moderationReviews =
          state.moderationReviews.filter(
            (review) => review._id !== action.payload
          );

        if (
          state.currentReview?._id === action.payload
        ) {
          state.currentReview = null;
        }

        state.successMessage = "Review deleted successfully.";
      })

      .addCase(deleteReview.rejected, (state, action) => {
        state.deleting = false;
        state.error =
          action.payload || "Unable to delete review.";
      })

      // ================================================
      // FETCH REVIEWS FOR MODERATION
      // ================================================

      .addCase(
        fetchReviewsForModeration.pending,
        (state) => {
          state.moderationLoading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchReviewsForModeration.fulfilled,
        (state, action) => {
          state.moderationLoading = false;
          state.moderationReviews = action.payload;
        }
      )

      .addCase(
        fetchReviewsForModeration.rejected,
        (state, action) => {
          state.moderationLoading = false;
          state.error =
            action.payload ||
            "Unable to fetch reviews for moderation.";
        }
      )

      // ================================================
      // MODERATE REVIEW
      // ================================================

      .addCase(moderateReview.pending, (state) => {
        state.moderating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(moderateReview.fulfilled, (state, action) => {
        state.moderating = false;

        const index = state.moderationReviews.findIndex(
          (review) => review._id === action.payload._id
        );

        if (index !== -1) {
          state.moderationReviews[index] = action.payload;
        }

        // Also update the ordinary review list if present.
        const reviewIndex = state.reviews.findIndex(
          (review) => review._id === action.payload._id
        );

        if (reviewIndex !== -1) {
          state.reviews[reviewIndex] = action.payload;
        }

        if (
          state.currentReview?._id === action.payload._id
        ) {
          state.currentReview = action.payload;
        }

        state.successMessage = "Review moderated successfully.";
      })

      .addCase(moderateReview.rejected, (state, action) => {
        state.moderating = false;
        state.error =
          action.payload || "Unable to moderate review.";
      });
  },
});

// ======================================================
// EXPORTS
// ======================================================

export const {
  clearReviewMessages,
  clearCurrentReview,
  resetReviews,
  clearModerationReviews,
} = reviewSlice.actions;

export default reviewSlice.reducer;
