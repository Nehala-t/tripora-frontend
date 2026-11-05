
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "@/lib/api";

interface EmailVerificationState {
  loading: boolean;
  verifying: boolean;
  successMessage: string;
  error: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

interface ResendVerificationPayload {
  email: string;
}

interface VerifyEmailPayload {
  token: string;
}

const initialState: EmailVerificationState = {
  loading: false,
  verifying: false,
  successMessage: "",
  error: "",
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again."
    );
  }

  return "Something went wrong. Please try again.";
}

// Resend verification email
export const resendVerificationEmail = createAsyncThunk<
  string,
  ResendVerificationPayload,
  { rejectValue: string }
>(
  "emailVerification/resendVerificationEmail",
  async (payload, thunkAPI) => {
    try {
      const response = await api.post<EmailVerificationResponse>(
        "/auth/resend-verification-email",
        {
          email: payload.email.trim().toLowerCase(),
        }
      );

      return (
        response.data.message ||
        "If an unverified account exists, a verification email will be sent."
      );
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

// Verify email using the token from the email link
export const verifyEmail = createAsyncThunk<
  string,
  VerifyEmailPayload,
  { rejectValue: string }
>(
  "emailVerification/verifyEmail",
  async ({ token }, thunkAPI) => {
    try {
      const response = await api.post<EmailVerificationResponse>(
        "/auth/verify-email",
        { token }
      );

      return (
        response.data.message ||
        "Your email address has been verified successfully."
      );
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const emailVerificationSlice = createSlice({
  name: "emailVerification",
  initialState,
  reducers: {
    clearEmailVerificationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Resend verification email
      .addCase(resendVerificationEmail.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(resendVerificationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to resend the verification email.";
      })

      // Verify email
      .addCase(verifyEmail.pending, (state) => {
        state.verifying = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.verifying = false;
        state.successMessage = action.payload;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.verifying = false;
        state.error =
          action.payload || "Unable to verify your email address.";
      });
  },
});

export const { clearEmailVerificationState } =
  emailVerificationSlice.actions;

export default emailVerificationSlice.reducer;
