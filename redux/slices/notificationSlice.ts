
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/api";

export interface TriporaNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  relatedBookingId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationState {
  notifications: TriporaNotification[];
  unreadCount: number;
  loading: boolean;
  actionLoading: string | null;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  actionLoading: null,
  error: null,
};

// Supports API responses such as:
// { notifications: [...] }
// { data: { notifications: [...] } }
// { data: [...] }
function extractNotifications(responseData: any): TriporaNotification[] {
  const data = responseData?.data ?? responseData;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function extractUnreadCount(responseData: any): number {
  const data = responseData?.data ?? responseData;

  const count =
    data?.unreadCount ??
    data?.count ??
    data?.unread ??
    0;

  return Math.max(0, Number(count) || 0);
}

// Fetch all notifications
export const fetchNotifications = createAsyncThunk<
  TriporaNotification[],
  void,
  { rejectValue: string }
>(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications");
      return extractNotifications(response.data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load notifications"
      );
    }
  }
);

// Fetch unread notification count
export const fetchUnreadNotificationCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/notifications/unread-count"
      );

      return extractUnreadCount(response.data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch unread count"
      );
    }
  }
);

// Mark one notification as read
export const markNotificationAsRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.patch(
        `/notifications/${notificationId}/read`
      );

      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to mark notification as read"
      );
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notifications/mark-all-read");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to mark all notifications as read"
      );
    }
  }
);

// Delete one notification
export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete notification"
      );
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(
          (notification) => !notification.readAt
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to load notifications";
      })

      // Fetch unread count
      .addCase(
        fetchUnreadNotificationCount.fulfilled,
        (state, action) => {
          state.unreadCount = action.payload;
        }
      )

      // Mark one as read
      .addCase(
        markNotificationAsRead.fulfilled,
        (state, action) => {
          const notification = state.notifications.find(
            (item) => item._id === action.payload
          );

          if (notification && !notification.readAt) {
            notification.readAt = new Date().toISOString();
            state.unreadCount = Math.max(
              0,
              state.unreadCount - 1
            );
          }
        }
      )

      // Mark all as read
      .addCase(
        markAllNotificationsAsRead.pending,
        (state) => {
          state.actionLoading = "mark-all";
          state.error = null;
        }
      )
      .addCase(
        markAllNotificationsAsRead.fulfilled,
        (state) => {
          const now = new Date().toISOString();

          state.notifications = state.notifications.map(
            (notification) => ({
              ...notification,
              readAt: notification.readAt || now,
            })
          );

          state.unreadCount = 0;
          state.actionLoading = null;
        }
      )
      .addCase(
        markAllNotificationsAsRead.rejected,
        (state, action) => {
          state.actionLoading = null;
          state.error =
            action.payload ?? "Failed to mark all as read";
        }
      )

      // Delete one notification
      .addCase(deleteNotification.pending, (state, action) => {
        state.actionLoading = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (item) => item._id === action.payload
        );

        if (notification && !notification.readAt) {
          state.unreadCount = Math.max(
            0,
            state.unreadCount - 1
          );
        }

        state.notifications = state.notifications.filter(
          (item) => item._id !== action.payload
        );

        state.actionLoading = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.actionLoading = null;
        state.error =
          action.payload ?? "Failed to delete notification";
      });
  },
});

export const { resetNotifications } = notificationSlice.actions;

export default notificationSlice.reducer;
