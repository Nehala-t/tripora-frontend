
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";

// ============================================
// TYPES
// ============================================

export type AvailabilityStatus =
  | "available"
  | "full"
  | "blocked"
  | "cancelled";

export type AvailabilityCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED";

export interface AvailabilityTour {
  _id: string;
  title: string;
  slug?: string;
}

export interface AvailabilitySlot {
  _id: string;
  tourId: string | AvailabilityTour;
  startAt: string;
  endAt: string;
  capacity: number;
  reservedCount: number;
  price: number;
  currency: AvailabilityCurrency;
  status: AvailabilityStatus;
  isBlockedDate: boolean;
  blockedReason?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AvailabilityQuery {
  tourId?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface CreateAvailabilityPayload {
  tourId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  price: number;
  currency: AvailabilityCurrency;
}

interface UpdateAvailabilityPayload {
  slotId: string;
  updates: Partial<
    Pick<
      AvailabilitySlot,
      | "startAt"
      | "endAt"
      | "capacity"
      | "price"
      | "currency"
      | "status"
      | "blockedReason"
    >
  >;
}

interface BlockAvailabilityPayload {
  slotId: string;
  blockedReason?: string;
}

interface AvailabilityResponse {
  success: boolean;
  message?: string;
  slots?: AvailabilitySlot[];
  slot?: AvailabilitySlot;
  total?: number;
  page?: number;
  pages?: number;
  count?: number;
}

interface AvailabilityState {
  slots: AvailabilitySlot[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  message: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: AvailabilityState = {
  slots: [],
  total: 0,
  page: 1,
  pages: 0,
  loading: false,
  actionLoading: false,
  error: null,
  message: null,
};

// ============================================
// ERROR HANDLER
// ============================================

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    const responseError = error.response?.data?.error;

    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    if (typeof responseError === "string") {
      return responseError;
    }

    return error.message || "An availability request failed.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected availability error occurred.";
};

// ============================================
// FETCH OPERATOR AVAILABILITY
// GET /api/availability/operator/my-slots
// ============================================

export const fetchOperatorAvailability = createAsyncThunk<
  AvailabilityResponse,
  AvailabilityQuery | undefined,
  { rejectValue: string }
>(
  "availability/fetchOperatorAvailability",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get<AvailabilityResponse>(
        "/availability/operator/my-slots",
        { params: params || {} }
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// CREATE AVAILABILITY SLOT
// POST /api/availability
// ============================================

export const createAvailabilitySlot = createAsyncThunk<
  AvailabilityResponse,
  CreateAvailabilityPayload,
  { rejectValue: string }
>(
  "availability/createAvailabilitySlot",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<AvailabilityResponse>(
        "/availability",
        payload
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// UPDATE AVAILABILITY SLOT
// PATCH /api/availability/:id
// ============================================

export const updateAvailabilitySlot = createAsyncThunk<
  AvailabilityResponse,
  UpdateAvailabilityPayload,
  { rejectValue: string }
>(
  "availability/updateAvailabilitySlot",
  async ({ slotId, updates }, { rejectWithValue }) => {
    try {
      if (!slotId || slotId === "undefined") {
        return rejectWithValue("Availability slot ID is missing.");
      }

      const response = await api.patch<AvailabilityResponse>(
        `/availability/${slotId}`,
        updates
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// BLOCK AVAILABILITY SLOT
// PATCH /api/availability/:id/block
// ============================================

export const blockAvailabilitySlot = createAsyncThunk<
  AvailabilityResponse,
  BlockAvailabilityPayload,
  { rejectValue: string }
>(
  "availability/blockAvailabilitySlot",
  async ({ slotId, blockedReason }, { rejectWithValue }) => {
    try {
      const response = await api.patch<AvailabilityResponse>(
        `/availability/${slotId}/block`,
        { blockedReason: blockedReason || "" }
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// UNBLOCK AVAILABILITY SLOT
// PATCH /api/availability/:id/unblock
// ============================================

export const unblockAvailabilitySlot = createAsyncThunk<
  AvailabilityResponse,
  string,
  { rejectValue: string }
>(
  "availability/unblockAvailabilitySlot",
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await api.patch<AvailabilityResponse>(
        `/availability/${slotId}/unblock`
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// DELETE AVAILABILITY SLOT
// DELETE /api/availability/:id
// ============================================

export const deleteAvailabilitySlot = createAsyncThunk<
  { slotId: string; message: string },
  string,
  { rejectValue: string }
>(
  "availability/deleteAvailabilitySlot",
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await api.delete<AvailabilityResponse>(
        `/availability/${slotId}`
      );

      return {
        slotId,
        message:
          response.data.message ||
          "Availability slot deleted successfully.",
      };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ============================================
// SLICE
// ============================================

const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    clearAvailabilityError(state) {
      state.error = null;
    },

    clearAvailabilityMessage(state) {
      state.message = null;
    },

    clearAvailabilityState() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================================
      // FETCH
      // ========================================

      .addCase(fetchOperatorAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchOperatorAvailability.fulfilled,
        (state, action) => {
          state.loading = false;
          state.slots = action.payload.slots || [];
          state.total = action.payload.total ?? state.slots.length;
          state.page = action.payload.page ?? 1;
          state.pages = action.payload.pages ?? 1;
        }
      )

      .addCase(
        fetchOperatorAvailability.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ?? action.error.message ??
            "Unable to load availability slots.";
        }
      )

      // ========================================
      // CREATE
      // ========================================

      .addCase(createAvailabilitySlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(createAvailabilitySlot.fulfilled, (state, action) => {
        state.actionLoading = false;

        if (action.payload.slot) {
          state.slots.push(action.payload.slot);

          state.slots.sort(
            (a, b) =>
              new Date(a.startAt).getTime() -
              new Date(b.startAt).getTime()
          );

          state.total += 1;
        }

        state.message =
          action.payload.message ||
          "Availability slot created successfully.";
      })

      .addCase(createAvailabilitySlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload ?? action.error.message ??
          "Unable to create availability slot.";
      })

      // ========================================
      // UPDATE
      // ========================================

      .addCase(updateAvailabilitySlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(updateAvailabilitySlot.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = action.payload.slot;

        if (updated) {
          const index = state.slots.findIndex(
            (slot) => slot._id === updated._id
          );

          if (index !== -1) {
            state.slots[index] = updated;
          }
        }

        state.message =
          action.payload.message ||
          "Availability slot updated successfully.";
      })

      .addCase(updateAvailabilitySlot.rejected, (state, action) => {
        state.actionLoading = false;

        state.error =
          action.payload ?? action.error.message ??
          "Unable to update availability slot.";
      })

      // ========================================
      // BLOCK
      // ========================================

      .addCase(blockAvailabilitySlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(blockAvailabilitySlot.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = action.payload.slot;

        if (updated) {
          const index = state.slots.findIndex(
            (slot) => slot._id === updated._id
          );

          if (index !== -1) {
            state.slots[index] = updated;
          }
        }

        state.message =
          action.payload.message || "Availability slot blocked.";
      })

      .addCase(blockAvailabilitySlot.rejected, (state, action) => {
        state.actionLoading = false;

        state.error =
          action.payload ?? action.error.message ??
          "Unable to block availability slot.";
      })

      // ========================================
      // UNBLOCK
      // ========================================

      .addCase(unblockAvailabilitySlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(unblockAvailabilitySlot.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = action.payload.slot;

        if (updated) {
          const index = state.slots.findIndex(
            (slot) => slot._id === updated._id
          );

          if (index !== -1) {
            state.slots[index] = updated;
          }
        }

        state.message =
          action.payload.message || "Availability slot unblocked.";
      })

      .addCase(unblockAvailabilitySlot.rejected, (state, action) => {
        state.actionLoading = false;

        state.error =
          action.payload ?? action.error.message ??
          "Unable to unblock availability slot.";
      })

      // ========================================
      // DELETE
      // ========================================

      .addCase(deleteAvailabilitySlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(deleteAvailabilitySlot.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.slots = state.slots.filter(
          (slot) => slot._id !== action.payload.slotId
        );

        state.total = Math.max(0, state.total - 1);
        state.message = action.payload.message;
      })

      .addCase(deleteAvailabilitySlot.rejected, (state, action) => {
        state.actionLoading = false;

        state.error =
          action.payload ?? action.error.message ??
          "Unable to delete availability slot.";
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  clearAvailabilityError,
  clearAvailabilityMessage,
  clearAvailabilityState,
} = availabilitySlice.actions;

export default availabilitySlice.reducer;
