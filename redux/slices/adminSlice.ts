
import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import axios from "axios";
import api from "@/lib/api";
import type { AuthUser } from "./authSlice";

// ==================================================
// DASHBOARD STATISTICS TYPES
// ==================================================

export interface AdminStats {
  users: {
    total: number;
  };

  operators: {
    total: number;
  };

  tours: {
    total: number;
    published: number;
  };

  bookings: {
    total: number;
    pending: number;
    confirmed: number;
  };

  payments: {
    total: number;
    successful: number;
    pending: number;
    failed: number;
    refunded: number;
  };

  financials: {
    grossPaymentAmount: number;
    platformCommission: number;
    operatorEarnings: number;
    commissionPercentage: number;
    totalPaidBookings: number;
    totalPaidParticipants: number;
  };
}

// ==================================================
// PAYLOAD TYPES
// ==================================================

export interface OperatorVerificationPayload {
  operatorId: string;
  action: "approved" | "rejected";
  rejectionReason?: string;
}

export interface OperatorStatusPayload {
  operatorId: string;
  status: "active" | "inactive";
}

export interface UserStatusPayload {
  userId: string;
  status: "active" | "inactive" | "suspended";
}

export interface TourStatusPayload {
  tourId: string;
  status: "draft" | "published" | "archived";
}

export interface DeleteAdminTourPayload {
  tourId: string;
}

// ==================================================
// REVIEW TYPES
// ==================================================

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hidden";

export interface AdminReview {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  moderationNote?: string;
  createdAt: string;
  updatedAt?: string;

  userId?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;

  tourId?: {
    _id: string;
    title?: string;
    images?: {
      url: string;
      publicId?: string;
    }[];
  } | null;

  bookingId?: {
    _id: string;
    bookingReference?: string;
    status?: string;
  } | null;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchReviewsParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  userId?: string;
  tourId?: string;
  rating?: number;
}

interface FetchReviewsResponse {
  reviews: AdminReview[];
  stats: ReviewStats;
  pagination: ReviewPagination;
}

// ==================================================
// CATEGORY TYPES
// ==================================================

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | {
    url: string;
    publicId?: string;
  };
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  image?: File | string;
  [key: string]: unknown;
}

export interface UpdateCategoryPayload {
  categoryId: string;
  name?: string;
  description?: string;
  image?: File | string;
  [key: string]: unknown;
}

export interface CategoryStatusPayload {
  categoryId: string;
  isActive: boolean;
}

export interface DeleteCategoryPayload {
  categoryId: string;
}

// ==================================================
// DESTINATION TYPES
// ==================================================

export interface AdminDestination {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  image?: string | {
    url: string;
    publicId?: string;
  };
  coordinates?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  highlights?: string[];
  status: "active" | "inactive";
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DestinationPayload {
  name: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  image?: File | string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  highlights?: string[];
  [key: string]: unknown;
}

export interface UpdateDestinationPayload {
  destinationId: string;
  name?: string;
  slug?: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  image?: File | string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  highlights?: string[];
  [key: string]: unknown;
}

export interface DestinationFetchParams {
  search?: string;
  country?: string;
  region?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface DeleteDestinationPayload {
  destinationId: string;
}

// ==================================================
// ADMIN STATE
// ==================================================

interface AdminState {
  stats: AdminStats | null;

  users: AuthUser[];
  operators: AuthUser[];

  tours: Record<string, unknown>[];
  bookings: Record<string, unknown>[];

  reports: Record<string, unknown> | null;

  // Reviews
  reviews: AdminReview[];
  reviewStats: ReviewStats;
  reviewPagination: ReviewPagination;

  // Categories
  categories: AdminCategory[];

  // Destinations
  destinations: AdminDestination[];

  // Loading
  loadingStats: boolean;
  loadingUsers: boolean;
  loadingOperators: boolean;
  loadingTours: boolean;
  loadingBookings: boolean;
  loadingReports: boolean;
  loadingReviews: boolean;
  loadingCategories: boolean;
  loadingDestinations: boolean;

  actionLoading: boolean;

  error: string | null;
  successMessage: string | null;
}

// ==================================================
// INITIAL STATE
// ==================================================

const initialState: AdminState = {
  stats: null,

  users: [],
  operators: [],

  tours: [],
  bookings: [],

  reports: null,

  reviews: [],

  reviewStats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    hidden: 0,
  },

  reviewPagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  categories: [],
  destinations: [],

  loadingStats: false,
  loadingUsers: false,
  loadingOperators: false,
  loadingTours: false,
  loadingBookings: false,
  loadingReports: false,
  loadingReviews: false,
  loadingCategories: false,
  loadingDestinations: false,

  actionLoading: false,

  error: null,
  successMessage: null,
};

// ==================================================
// HELPERS
// ==================================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong."
    );
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

function extractArray<T>(
  responseData: unknown,
  key?: string
): T[] {
  if (
    typeof responseData !== "object" ||
    responseData === null
  ) {
    return [];
  }

  const response = responseData as Record<string, unknown>;
  const data = response.data;

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (typeof data === "object" && data !== null) {
    const nested = data as Record<string, unknown>;

    if (key && Array.isArray(nested[key])) {
      return nested[key] as T[];
    }
  }

  if (key && Array.isArray(response[key])) {
    return response[key] as T[];
  }

  return [];
}

function extractObject<T>(responseData: unknown): T {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "data" in responseData
  ) {
    return (responseData as { data: T }).data;
  }

  return responseData as T;
}

function getRecordId(
  record: Record<string, unknown>
): string | undefined {
  const id = record._id ?? record.id;

  return typeof id === "string" ? id : undefined;
}

/**
 * Converts an object into FormData.
 *
 * - File values are appended directly.
 * - Strings and numbers are appended as strings.
 * - Arrays and objects are JSON-stringified.
 * - Undefined and null values are skipped.
 *
 * The image field must be named "image" because
 * the Express routes use upload.single("image").
 */
function createFormData(
    data: Record<string, unknown>
): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            console.log(`SKIPPED: ${key}`);
            return;
        }

        if (value instanceof File) {
            console.log(`FILE: ${key}`, {
                name: value.name,
                type: value.type,
                size: value.size,
            });

            formData.append(key, value);
            return;
        }

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            console.log(`FIELD: ${key}`, value);
            formData.append(key, String(value));
            return;
        }

        console.log(`OBJECT/ARRAY: ${key}`, value);

        formData.append(key, JSON.stringify(value));
    });

    return formData;
}
// ==================================================
// DASHBOARD STATISTICS
// GET /api/admin/dashboard
// ==================================================

export const fetchAdminStats = createAsyncThunk<
  AdminStats,
  void,
  { rejectValue: string }
>(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/dashboard");

      return extractObject<AdminStats>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// USERS
// GET /api/admin/users
// ==================================================

export const fetchAllUsers = createAsyncThunk<
  AuthUser[],
  void,
  { rejectValue: string }
>(
  "admin/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/users");

      return extractArray<AuthUser>(
        response.data,
        "users"
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// UPDATE USER STATUS
// PATCH /api/admin/users/:userId/status
// ==================================================

export const updateUserStatus = createAsyncThunk<
  AuthUser,
  UserStatusPayload,
  { rejectValue: string }
>(
  "admin/updateUserStatus",
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/admin/users/${userId}/status`,
        { status }
      );

      return extractObject<AuthUser>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// OPERATORS
// GET /api/admin/operators
// ==================================================

export const fetchAllOperators = createAsyncThunk<
  AuthUser[],
  void,
  { rejectValue: string }
>(
  "admin/fetchAllOperators",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/operators");

      return extractArray<AuthUser>(
        response.data,
        "operators"
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// UPDATE OPERATOR STATUS
// PATCH /api/admin/operators/:operatorId/status
// ==================================================

export const updateOperatorStatus = createAsyncThunk<
  AuthUser,
  OperatorStatusPayload,
  { rejectValue: string }
>(
  "admin/updateOperatorStatus",
  async ({ operatorId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/admin/operators/${operatorId}/status`,
        { status }
      );

      return extractObject<AuthUser>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// UPDATE OPERATOR VERIFICATION
// PATCH /api/admin/operators/:operatorId/verification
// ==================================================

export const updateOperatorVerification = createAsyncThunk<
  AuthUser,
  OperatorVerificationPayload,
  { rejectValue: string }
>(
  "admin/updateOperatorVerification",
  async (
    { operatorId, action, rejectionReason },
    { rejectWithValue }
  ) => {
    try {
      const verificationStatus =
        action === "approved" ? "verified" : "rejected";

      const response = await api.patch(
        `/admin/operators/${operatorId}/verification`,
        {
          verificationStatus,
          rejectionReason,
        }
      );

      return extractObject<AuthUser>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// TOURS
// GET /api/admin/tours
// ==================================================

export const fetchAllTours = createAsyncThunk<
  Record<string, unknown>[],
  void,
  { rejectValue: string }
>(
  "admin/fetchAllTours",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/tours");

      return extractArray<Record<string, unknown>>(
        response.data,
        "tours"
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// UPDATE TOUR STATUS
// PATCH /api/admin/tours/:tourId/status
// ==================================================

export const updateTourStatus = createAsyncThunk<
  Record<string, unknown>,
  TourStatusPayload,
  { rejectValue: string }
>(
  "admin/updateTourStatus",
  async ({ tourId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/admin/tours/${tourId}/status`,
        { status }
      );

      return extractObject<Record<string, unknown>>(
        response.data
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// DELETE TOUR
// DELETE /api/admin/tours/:tourId
// ==================================================

export const deleteAdminTour = createAsyncThunk<
  string,
  DeleteAdminTourPayload,
  { rejectValue: string }
>(
  "admin/deleteAdminTour",
  async ({ tourId }, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/tours/${tourId}`);

      return tourId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// BOOKINGS
// GET /api/admin/bookings
// ==================================================

export const fetchAllBookings = createAsyncThunk<
  Record<string, unknown>[],
  void,
  { rejectValue: string }
>(
  "admin/fetchAllBookings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/bookings");

      return extractArray<Record<string, unknown>>(
        response.data,
        "bookings"
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// REPORTS
// GET /api/admin/reports
// ==================================================

export const fetchAdminReports = createAsyncThunk<
  Record<string, unknown>,
  void,
  { rejectValue: string }
>(
  "admin/fetchReports",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/reports");

      return extractObject<Record<string, unknown>>(
        response.data
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// REVIEWS
// GET /api/admin/reviews
// ==================================================

export const fetchAllReviews = createAsyncThunk<
  FetchReviewsResponse,
  FetchReviewsParams | void,
  { rejectValue: string }
>(
  "admin/fetchAllReviews",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/reviews", {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,

          ...(params?.status && {
            status: params.status,
          }),

          ...(params?.userId && {
            userId: params.userId,
          }),

          ...(params?.tourId && {
            tourId: params.tourId,
          }),

          ...(params?.rating !== undefined && {
            rating: params.rating,
          }),
        },
      });

      const responseData = response.data;

      return {
        reviews: Array.isArray(responseData.data)
          ? responseData.data
          : [],

        stats: responseData.stats ?? {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          hidden: 0,
        },

        pagination: responseData.pagination ?? {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// CATEGORIES
// ==================================================

// GET /api/categories

export const fetchAllCategories = createAsyncThunk<
    AdminCategory[],
    void,
    { rejectValue: string }
>(
    "admin/fetchAllCategories",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/admin/Categories");

            return extractArray<AdminCategory>(response.data);
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);


// POST /api/categories/create
export const createCategory = createAsyncThunk<
  AdminCategory,
  CategoryPayload,
  { rejectValue: string }
>(
  "admin/createCategory",
  async (data, { rejectWithValue }) => {
    try {
      const formData = createFormData(
        data as Record<string, unknown>
      );

      const response = await api.post(
        "/categories/create",
        formData
      );

      return extractObject<AdminCategory>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// PATCH /api/categories/:id
export const updateCategory = createAsyncThunk<
  AdminCategory,
  UpdateCategoryPayload,
  { rejectValue: string }
>(
  "admin/updateCategory",
  async (
    { categoryId, ...data },
    { rejectWithValue }
  ) => {
    try {
      const formData = createFormData(
        data as Record<string, unknown>
      );

      const response = await api.patch(
        `/categories/${categoryId}`,
        formData
      );

      return extractObject<AdminCategory>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// PATCH /api/categories/:id/status
export const updateCategoryStatus = createAsyncThunk<
  AdminCategory,
  CategoryStatusPayload,
  { rejectValue: string }
>(
  "admin/updateCategoryStatus",
  async (
    { categoryId, isActive },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(
        `/categories/${categoryId}/status`,
        { isActive }
      );

      return extractObject<AdminCategory>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// DELETE /api/categories/:id
export const deleteCategory = createAsyncThunk<
  string,
  DeleteCategoryPayload,
  { rejectValue: string }
>(
  "admin/deleteCategory",
  async ({ categoryId }, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${categoryId}`);

      return categoryId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// DESTINATIONS
// ==================================================

// GET /api/destinations
export const fetchAllDestinations = createAsyncThunk<
  AdminDestination[],
  DestinationFetchParams | void,
  { rejectValue: string }
>(
  "admin/fetchAllDestinations",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/destinations", {
        params: {
          ...(params?.search && {
            search: params.search,
          }),

          ...(params?.country && {
            country: params.country,
          }),

          ...(params?.region && {
            region: params.region,
          }),

          page: params?.page ?? 1,
          limit: params?.limit ?? 100,

          ...(params?.sort && {
            sort: params.sort,
          }),
        },
      });

      return extractArray<AdminDestination>(
        response.data,
        "destinations"
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// POST /api/destinations/create
export const createDestination = createAsyncThunk<
  AdminDestination,
  DestinationPayload,
  { rejectValue: string }
>(
  "admin/createDestination",
  async (data, { rejectWithValue }) => {
    try {
      const formData = createFormData(
        data as Record<string, unknown>
      );

      const response = await api.post(
        "/destinations/create",
        formData
      );

      return extractObject<AdminDestination>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// PATCH /api/destinations/:id
export const updateDestination = createAsyncThunk<
  AdminDestination,
  UpdateDestinationPayload,
  { rejectValue: string }
>(
  "admin/updateDestination",
  async (
    { destinationId, ...data },
    { rejectWithValue }
  ) => {
    try {
      const formData = createFormData(
        data as Record<string, unknown>
      );

      const response = await api.patch(
        `/destinations/${destinationId}`,
        formData
      );

      return extractObject<AdminDestination>(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// DELETE /api/destinations/:id
export const deleteDestination = createAsyncThunk<
  string,
  DeleteDestinationPayload,
  { rejectValue: string }
>(
  "admin/deleteDestination",
  async ({ destinationId }, { rejectWithValue }) => {
    try {
      await api.delete(`/destinations/${destinationId}`);

      return destinationId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==================================================
// ADMIN SLICE
// ==================================================

const adminSlice = createSlice({
  name: "admin",
  initialState,

  reducers: {
    clearAdminError(state) {
      state.error = null;
    },

    clearAdminSuccessMessage(state) {
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ============================================
      // DASHBOARD STATISTICS
      // ============================================

      .addCase(fetchAdminStats.pending, (state) => {
        state.loadingStats = true;
        state.error = null;
      })

      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.stats = action.payload;
      })

      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loadingStats = false;
        state.error =
          action.payload || "Failed to load dashboard stats.";
      })

      // ============================================
      // USERS
      // ============================================

      .addCase(fetchAllUsers.pending, (state) => {
        state.loadingUsers = true;
        state.error = null;
      })

      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload;
      })

      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loadingUsers = false;
        state.error =
          action.payload || "Failed to load users.";
      })

      // ============================================
      // UPDATE USER STATUS
      // ============================================

      .addCase(updateUserStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedUser = action.payload;
        const id = updatedUser._id || updatedUser.id;

        state.users = state.users.map((user) =>
          (user._id || user.id) === id ? updatedUser : user
        );

        state.successMessage =
          "User status updated successfully.";
      })

      .addCase(updateUserStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update user status.";
      })

      // ============================================
      // OPERATORS
      // ============================================

      .addCase(fetchAllOperators.pending, (state) => {
        state.loadingOperators = true;
        state.error = null;
      })

      .addCase(fetchAllOperators.fulfilled, (state, action) => {
        state.loadingOperators = false;
        state.operators = action.payload;
      })

      .addCase(fetchAllOperators.rejected, (state, action) => {
        state.loadingOperators = false;
        state.error =
          action.payload || "Failed to load operators.";
      })

      // ============================================
      // UPDATE OPERATOR STATUS
      // ============================================

      .addCase(updateOperatorStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateOperatorStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedOperator = action.payload;
        const id = updatedOperator._id || updatedOperator.id;

        state.operators = state.operators.map((operator) =>
          (operator._id || operator.id) === id
            ? updatedOperator
            : operator
        );

        state.successMessage =
          "Operator account status updated successfully.";
      })

      .addCase(updateOperatorStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload ||
          "Failed to update operator account status.";
      })

      // ============================================
      // OPERATOR VERIFICATION
      // ============================================

      .addCase(
        updateOperatorVerification.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      .addCase(
        updateOperatorVerification.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const updatedOperator = action.payload;
          const id = updatedOperator._id || updatedOperator.id;

          state.operators = state.operators.map((operator) =>
            (operator._id || operator.id) === id
              ? updatedOperator
              : operator
          );

          state.successMessage =
            "Operator verification updated successfully.";
        }
      )

      .addCase(
        updateOperatorVerification.rejected,
        (state, action) => {
          state.actionLoading = false;
          state.error =
            action.payload ||
            "Failed to update operator verification.";
        }
      )

      // ============================================
      // TOURS
      // ============================================

      .addCase(fetchAllTours.pending, (state) => {
        state.loadingTours = true;
        state.error = null;
      })

      .addCase(fetchAllTours.fulfilled, (state, action) => {
        state.loadingTours = false;
        state.tours = action.payload;
      })

      .addCase(fetchAllTours.rejected, (state, action) => {
        state.loadingTours = false;
        state.error =
          action.payload || "Failed to load tours.";
      })

      // ============================================
      // UPDATE TOUR STATUS
      // ============================================

      .addCase(updateTourStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateTourStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedTour = action.payload;
        const id = getRecordId(updatedTour);

        state.tours = state.tours.map((tour) =>
          getRecordId(tour) === id ? updatedTour : tour
        );

        state.successMessage =
          "Tour status updated successfully.";
      })

      .addCase(updateTourStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update tour status.";
      })

      // ============================================
      // DELETE TOUR
      // ============================================

      .addCase(deleteAdminTour.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteAdminTour.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.tours = state.tours.filter(
          (tour) => getRecordId(tour) !== action.payload
        );

        state.successMessage = "Tour deleted successfully.";
      })

      .addCase(deleteAdminTour.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to delete tour.";
      })

      // ============================================
      // BOOKINGS
      // ============================================

      .addCase(fetchAllBookings.pending, (state) => {
        state.loadingBookings = true;
        state.error = null;
      })

      .addCase(fetchAllBookings.fulfilled, (state, action) => {
        state.loadingBookings = false;
        state.bookings = action.payload;
      })

      .addCase(fetchAllBookings.rejected, (state, action) => {
        state.loadingBookings = false;
        state.error =
          action.payload || "Failed to load bookings.";
      })

      // ============================================
      // REPORTS
      // ============================================

      .addCase(fetchAdminReports.pending, (state) => {
        state.loadingReports = true;
        state.error = null;
      })

      .addCase(fetchAdminReports.fulfilled, (state, action) => {
        state.loadingReports = false;
        state.reports = action.payload;
      })

      .addCase(fetchAdminReports.rejected, (state, action) => {
        state.loadingReports = false;
        state.error =
          action.payload || "Failed to load reports.";
      })

      // ============================================
      // REVIEWS
      // ============================================

      .addCase(fetchAllReviews.pending, (state) => {
        state.loadingReviews = true;
        state.error = null;
      })

      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loadingReviews = false;

        state.reviews = action.payload.reviews;
        state.reviewStats = action.payload.stats;
        state.reviewPagination = action.payload.pagination;
      })

      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loadingReviews = false;
        state.error =
          action.payload || "Failed to load reviews.";
      })

      // ============================================
      // CATEGORIES - FETCH
      // ============================================

      .addCase(fetchAllCategories.pending, (state) => {
        state.loadingCategories = true;
        state.error = null;
      })

      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        state.categories = action.payload;
      })

      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.loadingCategories = false;
        state.error =
          action.payload || "Failed to load categories.";
      })

      // ============================================
      // CATEGORIES - CREATE
      // ============================================

      .addCase(createCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createCategory.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.categories.unshift(action.payload);

        state.successMessage =
          "Category created successfully.";
      })

      .addCase(createCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to create category.";
      })

      // ============================================
      // CATEGORIES - UPDATE
      // ============================================

      .addCase(updateCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateCategory.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedCategory = action.payload;

        state.categories = state.categories.map((category) =>
          category._id === updatedCategory._id
            ? updatedCategory
            : category
        );

        state.successMessage =
          "Category updated successfully.";
      })

      .addCase(updateCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update category.";
      })

      // ============================================
      // CATEGORIES - STATUS
      // ============================================

      .addCase(updateCategoryStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateCategoryStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedCategory = action.payload;

        state.categories = state.categories.map((category) =>
          category._id === updatedCategory._id
            ? updatedCategory
            : category
        );

        state.successMessage =
          "Category status updated successfully.";
      })

      .addCase(updateCategoryStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update category status.";
      })

      // ============================================
      // CATEGORIES - DELETE
      // ============================================

      .addCase(deleteCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.categories = state.categories.filter(
          (category) => category._id !== action.payload
        );

        state.successMessage =
          "Category deleted successfully.";
      })

      .addCase(deleteCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to delete category.";
      })

      // ============================================
      // DESTINATIONS - FETCH
      // ============================================

      .addCase(fetchAllDestinations.pending, (state) => {
        state.loadingDestinations = true;
        state.error = null;
      })

      .addCase(fetchAllDestinations.fulfilled, (state, action) => {
        state.loadingDestinations = false;
        state.destinations = action.payload;
      })

      .addCase(fetchAllDestinations.rejected, (state, action) => {
        state.loadingDestinations = false;
        state.error =
          action.payload || "Failed to load destinations.";
      })

      // ============================================
      // DESTINATIONS - CREATE
      // ============================================

      .addCase(createDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.destinations.unshift(action.payload);

        state.successMessage =
          "Destination created successfully.";
      })

      .addCase(createDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to create destination.";
      })

      // ============================================
      // DESTINATIONS - UPDATE
      // ============================================

      .addCase(updateDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updatedDestination = action.payload;

        state.destinations = state.destinations.map(
          (destination) =>
            destination._id === updatedDestination._id
              ? updatedDestination
              : destination
        );

        state.successMessage =
          "Destination updated successfully.";
      })

      .addCase(updateDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to update destination.";
      })

      // ============================================
      // DESTINATIONS - DELETE
      // ============================================

      .addCase(deleteDestination.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteDestination.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.destinations = state.destinations.filter(
          (destination) =>
            destination._id !== action.payload
        );

        state.successMessage =
          "Destination deleted successfully.";
      })

      .addCase(deleteDestination.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to delete destination.";
      });
  },
});

// ==================================================
// EXPORTS
// ==================================================

export const {
  clearAdminError,
  clearAdminSuccessMessage,
} = adminSlice.actions;

export default adminSlice.reducer;
