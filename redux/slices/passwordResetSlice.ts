
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "@/lib/api";

interface PasswordResetState {
  loading: boolean;
  successMessage: string;
  error: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

const initialState: PasswordResetState = {
  loading: false,
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

export const forgotPassword = createAsyncThunk<
  string,
  ForgotPasswordPayload,
  { rejectValue: string }
>("passwordReset/forgotPassword", async (payload, thunkAPI) => {
  try {
    const response = await api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      payload
    );

    return response.data.message;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const resetPassword = createAsyncThunk<
  string,
  ResetPasswordPayload,
  { rejectValue: string }
>("passwordReset/resetPassword", async (payload, thunkAPI) => {
  try {
    const response = await api.post<ForgotPasswordResponse>(
      "/auth/reset-password",
      payload
    );

    return response.data.message;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

const passwordResetSlice = createSlice({
  name: "passwordReset",
  initialState,
  reducers: {
    clearPasswordResetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to process your request.";
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to reset your password.";
      });
  },
});

export const { clearPasswordResetState } = passwordResetSlice.actions;
export default passwordResetSlice.reducer;
