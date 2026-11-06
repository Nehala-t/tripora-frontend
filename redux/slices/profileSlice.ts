
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";
import type { AuthUser } from "./authSlice";

// ========================================
// TYPES
// ========================================

export interface ProfileImagePayload {
  url: string | null;
  publicId?: string | null;
}

export interface OperatorProfileData {
  businessName?: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  website?: string;
  businessAddress?: string;
}

export interface NotificationPreferencesData {
  email?: boolean;
  inApp?: boolean;
  bookingReminders?: boolean;
  marketingEmails?: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  bio?: string;
  country?: string;
  city?: string;
  profileImage?: ProfileImagePayload;
  preferredLanguage?: string;
  preferredCurrency?: "INR" | "USD" | "EUR" | "GBP" | "AED" | string;
  preferredDestinations?: string[];
  travelStyle?: string;
  budget?: string;
  travelInterests?: string[];
  operatorProfile?: OperatorProfileData;
  notificationPreferences?: NotificationPreferencesData;
}

interface ProfileApiResponse {
  success?: boolean;
  message?: string;
  user?: AuthUser;
  profile?: AuthUser;
  data?:
    | AuthUser
    | {
        user?: AuthUser;
        profile?: AuthUser;
      };
}

interface OperatorProfileApiResponse {
  success?: boolean;
  message?: string;
  operator?: AuthUser;
  operatorProfile?: OperatorProfileData;
  data?: {
    operator?: AuthUser;
    operatorProfile?: OperatorProfileData;
    user?: AuthUser;
    profile?: AuthUser;
  };
}

interface ProfileState {
  profile: AuthUser | null;
  loading: boolean;
  updating: boolean;
  uploadingAvatar: boolean;
  error: string | null;
  successMessage: string | null;
}

interface ThunkConfig {
  rejectValue: string;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  updating: false,
  uploadingAvatar: false,
  error: null,
  successMessage: null,
};

// ========================================
// HELPERS
// ========================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          error?: string;
          errors?: Array<{ message?: string; msg?: string }>;
        }
      | undefined;

    if (data?.message) return data.message;
    if (data?.error) return data.error;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((item) => item.message || item.msg)
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) return messages.join(", ");
    }

    if (error.code === "ERR_NETWORK") {
      return "Cannot connect to the server. Check your backend connection.";
    }

    return error.message || "Something went wrong.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

// ========================================
// EXTRACT USER PROFILE
// ========================================

function extractProfileData(
  response: ProfileApiResponse
): AuthUser | null {
  if (response.user) return response.user;
  if (response.profile) return response.profile;

  const data = response.data;

  if (!data) return null;

  if ("user" in data && data.user) return data.user;
  if ("profile" in data && data.profile) return data.profile;

  if ("_id" in data || "id" in data || "email" in data) {
    return data as AuthUser;
  }

  return null;
}

// ========================================
// EXTRACT OPERATOR PROFILE
// ========================================

function extractOperatorProfile(
  response: OperatorProfileApiResponse
): AuthUser | null {
  const operator =
    response.operator ??
    response.data?.operator ??
    response.data?.user ??
    response.data?.profile;

  if (!operator) {
    return null;
  }

  const businessDetails =
    response.operatorProfile ??
    response.data?.operatorProfile;

  if (!businessDetails) {
    return operator;
  }

  return {
    ...operator,
    operatorProfile: {
      ...operator.operatorProfile,
      ...businessDetails,
    },
  };
}

// ========================================
// REQUEST PROFILE
// ========================================

async function requestProfile(
  request: Promise<{ data: ProfileApiResponse }>
): Promise<AuthUser> {
  const response = await request;
  const profile = extractProfileData(response.data);

  if (profile) return profile;

  const refreshedResponse = await api.get<ProfileApiResponse>(
    "/user-profile/me"
  );

  const refreshedProfile = extractProfileData(
    refreshedResponse.data
  );

  if (!refreshedProfile) {
    throw new Error(
      "The server did not return updated profile data."
    );
  }

  return refreshedProfile;
}

// ========================================
// FETCH USER PROFILE
// GET /user-profile/me
// ========================================

export const fetchUserProfile = createAsyncThunk<
  AuthUser,
  void,
  ThunkConfig
>(
  "profile/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ProfileApiResponse>(
        "/user-profile/me"
      );

      const profile = extractProfileData(response.data);

      if (!profile) {
        return rejectWithValue(
          "Profile data was not returned by the server."
        );
      }

      return profile;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// FETCH OPERATOR PROFILE
// GET /operator-profile/me
// ========================================

export const fetchOperatorProfile = createAsyncThunk<
  AuthUser,
  void,
  ThunkConfig
>(
  "profile/fetchOperatorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<OperatorProfileApiResponse>(
        "/operator-profile/me"
      );

      const operator = extractOperatorProfile(response.data);

      if (!operator) {
        return rejectWithValue(
          "Operator profile data was not returned by the server."
        );
      }

      return operator;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// UPDATE PERSONAL PROFILE
// PATCH /user-profile/me
// ========================================

export const updateUserProfile = createAsyncThunk<
  AuthUser,
  UpdateProfilePayload,
  ThunkConfig
>(
  "profile/updateUserProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      return await requestProfile(
        api.patch<ProfileApiResponse>(
          "/user-profile/me",
          profileData
        )
      );
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// UPDATE TRAVEL PREFERENCES
// PATCH /user-profile/preferences
// ========================================

export const updateTravelPreferences = createAsyncThunk<
  AuthUser,
  Pick<
    UpdateProfilePayload,
    | "preferredLanguage"
    | "preferredCurrency"
    | "preferredDestinations"
    | "travelStyle"
    | "budget"
    | "travelInterests"
  >,
  ThunkConfig
>(
  "profile/updateTravelPreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      return await requestProfile(
        api.patch<ProfileApiResponse>(
          "/user-profile/preferences",
          preferences
        )
      );
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// UPDATE NOTIFICATION PREFERENCES
// PATCH /user-profile/notifications
// ========================================

export const updateNotificationPreferences = createAsyncThunk<
  AuthUser,
  NotificationPreferencesData,
  ThunkConfig
>(
  "profile/updateNotificationPreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      return await requestProfile(
        api.patch<ProfileApiResponse>(
          "/user-profile/notifications",
          preferences
        )
      );
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// UPLOAD PROFILE IMAGE
// PATCH /user-profile/image
// ========================================

export const uploadProfileAvatar = createAsyncThunk<
  AuthUser,
  FormData,
  ThunkConfig
>(
  "profile/uploadProfileAvatar",
  async (formData, { rejectWithValue }) => {
    try {
      return await requestProfile(
        api.patch<ProfileApiResponse>(
          "/user-profile/image",
          formData
        )
      );
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// UPDATE OPERATOR BUSINESS DETAILS
// PATCH /operator-profile/business
// ========================================

export const updateOperatorBusinessDetails = createAsyncThunk<
  AuthUser,
  OperatorProfileData,
  ThunkConfig
>(
  "profile/updateOperatorBusinessDetails",
  async (businessData, { rejectWithValue }) => {
    try {
      // Save operator business details.
      await api.patch(
        "/operator-profile/business",
        businessData
      );

      // Fetch the complete updated operator profile.
      const response = await api.get<OperatorProfileApiResponse>(
        "/operator-profile/me"
      );

      const operator = extractOperatorProfile(response.data);

      if (!operator) {
        return rejectWithValue(
          "Business details were saved, but the updated operator profile could not be retrieved."
        );
      }

      return operator;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ========================================
// SLICE
// ========================================

const profileSlice = createSlice({
  name: "profile",
  initialState,

  reducers: {
    setProfile(state, action: PayloadAction<AuthUser | null>) {
      state.profile = action.payload;
    },

    clearProfileError(state) {
      state.error = null;
    },

    clearProfileSuccessMessage(state) {
      state.successMessage = null;
    },

    resetProfileState(state) {
      state.profile = null;
      state.loading = false;
      state.updating = false;
      state.uploadingAvatar = false;
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================================
      // FETCH USER PROFILE
      // ========================================

      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })

      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to load profile details.";
      })

      // ========================================
      // FETCH OPERATOR PROFILE
      // ========================================

      .addCase(fetchOperatorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOperatorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })

      .addCase(fetchOperatorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to load operator profile.";
      })

      // ========================================
      // UPDATE PERSONAL PROFILE
      // ========================================

      .addCase(updateUserProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.successMessage = "Profile updated successfully!";
        state.error = null;
      })

      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update profile.";
      })

      // ========================================
      // TRAVEL PREFERENCES
      // ========================================

      .addCase(updateTravelPreferences.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateTravelPreferences.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.successMessage =
          "Travel preferences updated successfully!";
        state.error = null;
      })

      .addCase(updateTravelPreferences.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update travel preferences.";
      })

      // ========================================
      // NOTIFICATION PREFERENCES
      // ========================================

      .addCase(updateNotificationPreferences.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.successMessage =
          "Notification preferences updated successfully!";
        state.error = null;
      })

      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update notification preferences.";
      })

      // ========================================
      // AVATAR UPLOAD
      // ========================================

      .addCase(uploadProfileAvatar.pending, (state) => {
        state.uploadingAvatar = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(uploadProfileAvatar.fulfilled, (state, action) => {
        state.uploadingAvatar = false;
        state.profile = action.payload;
        state.successMessage =
          "Profile picture updated successfully!";
        state.error = null;
      })

      .addCase(uploadProfileAvatar.rejected, (state, action) => {
        state.uploadingAvatar = false;
        state.error =
          action.payload || "Failed to upload profile picture.";
      })

      // ========================================
      // UPDATE OPERATOR BUSINESS DETAILS
      // ========================================

      .addCase(updateOperatorBusinessDetails.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateOperatorBusinessDetails.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateOperatorBusinessDetails.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update business details.";
      });
  },
});

// ========================================
// EXPORTS
// ========================================

export const {
  setProfile,
  clearProfileError,
  clearProfileSuccessMessage,
  resetProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;
