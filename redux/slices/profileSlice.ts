
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

function extractProfileData(response: ProfileApiResponse): AuthUser | null {
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

async function requestProfile(
  request: Promise<{ data: ProfileApiResponse }>
): Promise<AuthUser> {
  const response = await request;
  const profile = extractProfileData(response.data);

  // Some controllers return only a success message.
  // In that case, fetch the updated profile from the backend.
  if (profile) return profile;

  const refreshedResponse = await api.get<ProfileApiResponse>(
    "/user-profile/me"
  );

  const refreshedProfile = extractProfileData(refreshedResponse.data);

  if (!refreshedProfile) {
    throw new Error("The server did not return updated profile data.");
  }

  return refreshedProfile;
}

// ========================================
// FETCH PROFILE
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
        return rejectWithValue("Profile data was not returned by the server.");
      }

      return profile;
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
// Field name: profileImage
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
// OPERATOR APPLICATION
// No matching endpoint exists in the router provided.
// ========================================

export const submitOperatorVerification = createAsyncThunk<
  AuthUser,
  OperatorProfileData,
  ThunkConfig
>(
  "profile/submitOperatorVerification",
  async (_, { rejectWithValue }) => {
    return rejectWithValue(
      "Operator application is not connected yet. Add an operator application endpoint to the backend first."
    );
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
      // Fetch
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

      // Update personal profile
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

      // Travel preferences
      .addCase(updateTravelPreferences.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateTravelPreferences.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.successMessage = "Travel preferences updated successfully!";
      })
      .addCase(updateTravelPreferences.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update travel preferences.";
      })

      // Notification preferences
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
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update notification preferences.";
      })

      // Avatar upload
      .addCase(uploadProfileAvatar.pending, (state) => {
        state.uploadingAvatar = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(uploadProfileAvatar.fulfilled, (state, action) => {
        state.uploadingAvatar = false;
        state.profile = action.payload;
        state.successMessage = "Profile picture updated successfully!";
        state.error = null;
      })
      .addCase(uploadProfileAvatar.rejected, (state, action) => {
        state.uploadingAvatar = false;
        state.error =
          action.payload || "Failed to upload profile picture.";
      })

      // Operator application
      .addCase(submitOperatorVerification.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitOperatorVerification.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.successMessage =
          "Operator application submitted successfully!";
      })
      .addCase(submitOperatorVerification.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to submit operator application.";
      });
  },
});

export const {
  setProfile,
  clearProfileError,
  clearProfileSuccessMessage,
  resetProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;
