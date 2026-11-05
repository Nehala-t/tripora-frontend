
import * as yup from "yup";

// ============================================
// TOUR DATE AND PARTICIPANTS VALIDATION
// ============================================

export const bookingSchema = yup.object({
  selectedDate: yup
    .string()
    .required("Please select a booking date.")
    .test(
      "valid-date",
      "Please select a valid date.",
      (value) => {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return false;
        }

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        );
      }
    )
    .test(
      "future-date",
      "Booking date cannot be in the past.",
      (value) => {
        if (!value) return false;

        const [year, month, day] = value.split("-").map(Number);
        const selected = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return selected >= today;
      }
    ),

  participants: yup
    .number()
    .typeError("Please select the number of participants.")
    .integer("Participants must be a whole number.")
    .min(1, "At least 1 participant is required.")
    .required("Please select participants."),
});

export type BookingDateFormValues = yup.InferType<
  typeof bookingSchema
>;

// Backwards compatibility if another existing page imports this type.
export type BookingFormValues = BookingDateFormValues;

// ============================================
// TRAVELER INFORMATION VALIDATION
// ============================================

export const bookingFormSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Please enter your full name.")
    .max(100, "Name cannot exceed 100 characters."),

  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .required("Please enter your email address."),

  phone: yup
    .string()
    .trim()
    .required("Please enter your phone number.")
    .max(25, "Phone number cannot exceed 25 characters.")
    .matches(
      /^[+]?[\d\s()-]+$/,
      "Please enter a valid phone number."
    ),

  specialRequests: yup
    .string()
    .trim()
    .max(
      1000,
      "Special requests cannot exceed 1000 characters."
    )
    .defined(),
});

export type BookingTravelerFormValues = yup.InferType<
  typeof bookingFormSchema
>;
