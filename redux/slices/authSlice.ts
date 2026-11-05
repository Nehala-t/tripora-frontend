
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/lib/api";

// ========================================
// TYPES
// ========================================

export type SignupRole = "TRAVELER" | "OPERATOR";
export type BackendRole = "user" | "operator" | "admin";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: SignupRole;
  city?: string;
  businessName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Added types for email verification and password recovery
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface AuthMessageResponse {
  success?: boolean;
  message?: string;
}

export interface AuthUser {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string | null;

  role?: BackendRole | string;
  status?: string;
  emailVerified?: boolean;

  profileImage?: {
    url?: string | null;
    publicId?: string | null;
  };

  bio?: string;
  country?: string;
  city?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  preferredDestinations?: string[];
  travelStyle?: string;
  budget?: string;
  travelInterests?: string[];

  operatorProfile?: {
    businessName?: string;
    businessDescription?: string;
    businessEmail?: string;
    businessPhone?: string;
    website?: string;
    businessAddress?: string;
  };

  sellerVerificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: AuthUser;
  data?:
    | AuthUser
    | {
        user?: AuthUser;
        profile?: AuthUser;
      };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  message: string | null;
}

interface ThunkConfig {
  rejectValue: string;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,
  message: null,
};

// ========================================
// HELPERS
// ========================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    // Backend may return a plain string
    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const body = data as {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
        details?: unknown;
      };

      // Handle: { message: "Email already exists" }
      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }

      // Handle: { error: "Email already exists" }
      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }

      // Handle validation errors
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        const messages = body.errors
          .map((item: unknown) => {
            if (typeof item === "string") return item;

            if (item && typeof item === "object") {
              const validationError = item as {
                message?: unknown;
                msg?: unknown;
              };

              if (typeof validationError.message === "string") {
                return validationError.message;
              }

              if (typeof validationError.msg === "string") {
                return validationError.msg;
              }
            }

            return "";
          })
          .filter(Boolean);

        if (messages.length > 0) {
          return messages.join("\n");
        }
      }

      if (typeof body.details === "string" && body.details.trim()) {
        return body.details;
      }
    }

    if (!error.response) {
      return error.code === "ERR_NETWORK"
        ? "Cannot connect to the server. Check your backend and API URL."
        : "Network request failed.";
    }

    return `Request failed (${error.response.status}). Please try again.`;
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

function getAuthUser(response: AuthResponse): AuthUser | null {
  if (response.user) {
    return response.user;
  }

  const data = response.data;

  if (!data) return null;

  if ("user" in data && data.user) {
    return data.user;
  }

  if ("profile" in data && data.profile) {
    return data.profile;
  }

  if ("_id" in data || "id" in data || "email" in data) {
    return data as AuthUser;
  }

  return null;
}

// ========================================
// SIGNUP
// POST /api/auth/register
// ========================================

export const signupUser = createAsyncThunk<
  AuthResponse,
  SignupData,
  ThunkConfig
>("auth/signupUser", async (values, { rejectWithValue }) => {
  try {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone?.trim() || "",
      password: values.password,
      role: values.role === "OPERATOR" ? "operator" : "user",

      ...(values.role === "OPERATOR"
        ? {
            city: values.city?.trim() || "",
            operatorProfile: {
              businessName: values.businessName?.trim() || "",
            },
          }
        : {}),
    };

    const response = await api.post<AuthResponse>(
      "/auth/register",
      payload
    );

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// LOGIN
// POST /api/auth/login
// Backend sets the HTTP-only cookie.
// ========================================

export const loginUser = createAsyncThunk<
  AuthUser,
  LoginData,
  ThunkConfig
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }
    );

    let user = getAuthUser(response.data);

    // Some login APIs return only success/message and set a cookie.
    // In that case, retrieve the profile using the new cookie.
    if (!user) {
      const profileResponse = await api.get<AuthResponse>(
        "/user-profile/me"
      );

      user = getAuthUser(profileResponse.data);
    }

    if (!user) {
      return rejectWithValue(
        "Login response did not contain user details. Check your login and profile API responses."
      );
    }

    return user;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// RESTORE SESSION
// GET /api/user-profile/me
// ========================================

export const fetchCurrentUser = createAsyncThunk<
  AuthUser,
  void,
  ThunkConfig
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<AuthResponse>(
      "/user-profile/me"
    );

    const user = getAuthUser(response.data);

    if (!user) {
      return rejectWithValue("No authenticated user was returned.");
    }

    return user;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// VERIFY EMAIL
// POST /api/auth/verify-email
// ========================================

export const verifyEmail = createAsyncThunk<
  AuthMessageResponse,
  VerifyEmailData,
  ThunkConfig
>("auth/verifyEmail", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthMessageResponse>(
      "/auth/verify-email",
      { token }
    );

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification-email
// ========================================

export const resendVerificationEmail = createAsyncThunk<
  AuthMessageResponse,
  ForgotPasswordData,
  ThunkConfig
>("auth/resendVerificationEmail", async ({ email }, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthMessageResponse>(
      "/auth/resend-verification-email",
      { email: email.trim().toLowerCase() }
    );

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ========================================

export const forgotPassword = createAsyncThunk<
  AuthMessageResponse,
  ForgotPasswordData,
  ThunkConfig
>("auth/forgotPassword", async ({ email }, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthMessageResponse>(
      "/auth/forgot-password",
      { email: email.trim().toLowerCase() }
    );

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ========================================

export const resetPassword = createAsyncThunk<
  AuthMessageResponse,
  ResetPasswordData,
  ThunkConfig
>("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthMessageResponse>(
      "/auth/reset-password",
      { token, password }
    );

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// LOGOUT
// POST /api/auth/logout
// ========================================

export const logoutUser = createAsyncThunk<
  void,
  void,
  ThunkConfig
>("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    await api.post("/auth/logout");
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ========================================
// SLICE
// ========================================

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.initialized = true;
    },

    clearAuthError(state) {
      state.error = null;
    },

    clearAuthMessage(state) {
      state.message = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // SIGNUP
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.message =
          action.payload.message || "Account created successfully.";
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Registration failed. Please try again.";
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
        state.error = null;
        state.message = "Login successful.";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Login failed. Please try again.";
      })

      // RESTORE SESSION
      .addCase(fetchCurrentUser.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        if (!state.user) {
          state.isAuthenticated = false;
        }
        state.initialized = true;
      })

      // VERIFY EMAIL
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message =
          action.payload.message || "Email verified successfully.";

        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Email verification failed.";
      })

      // RESEND VERIFICATION EMAIL
      .addCase(resendVerificationEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message =
          action.payload.message || "Verification email sent successfully.";
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to resend the verification email.";
      })

      // FORGOT PASSWORD
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message =
          action.payload.message ||
          "Password reset instructions have been sent.";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to process your request.";
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message =
          action.payload.message || "Password reset successfully.";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Password reset failed.";
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.error = null;
        state.message = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Logout failed.";
      });
  },
});

export const {
  setUser,
  clearAuthError,
  clearAuthMessage,
} = authSlice.actions;

// ========================================
// SELECTORS
// ========================================

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthMessage = (state: { auth: AuthState }) => state.auth.message;

export default authSlice.reducer;
