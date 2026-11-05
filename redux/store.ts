import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import notificationReducer from "./slices/notificationSlice";
import profileReducer from "./slices/profileSlice"
import adminReducer from "./slices/adminSlice"
import destinationReducer from "./slices/destinationSlice";
import tourReducer from "./slices/tourSlice";
import operatorReducer from "./slices/operatorSlice";
import wishlistReducer from "./slices/wishlistSlice";
import passwordResetReducer from "./slices/passwordResetSlice";
import emailVerificationReducer from "@/redux/slices/emailVerificationSlice";
import availabilityReducer from "@/redux/slices/availabilitySlice";
import bookingReducer from "./slices/bookingSlice";
import reviewReducer from "./slices/reviewSlice";



// =========================
// Redux Store
// =========================

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    profile: profileReducer,
    admin: adminReducer,
    destinations: destinationReducer,
    tours: tourReducer,
    operator: operatorReducer,
    wishlist: wishlistReducer,
    passwordReset: passwordResetReducer,
    emailVerification: emailVerificationReducer,
    availability: availabilityReducer,
    bookings: bookingReducer,
    reviews: reviewReducer,
  },
});

// =========================
// TypeScript Types
// =========================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;