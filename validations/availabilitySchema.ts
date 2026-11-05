
import * as yup from "yup";

export const availabilitySchema = yup
  .object({
    tourId: yup.string().required("Please select a tour."),

    startAt: yup
      .string()
      .required("Start date and time are required.")
      .test(
        "not-in-past",
        "Start date and time cannot be in the past.",
        (value) => {
          if (!value) return false;

          const start = new Date(value);

          return (
            !Number.isNaN(start.getTime()) &&
            start.getTime() >= Date.now()
          );
        }
      ),

    endAt: yup
      .string()
      .required("End date and time are required.")
      .test(
        "after-start",
        "End date and time must be after the start date and time.",
        function (value) {
          const { startAt } = this.parent;

          if (!value || !startAt) return true;

          const start = new Date(startAt).getTime();
          const end = new Date(value).getTime();

          if (Number.isNaN(start) || Number.isNaN(end)) {
            return false;
          }

          return end > start;
        }
      ),

    capacity: yup
      .number()
      .typeError("Capacity must be a number.")
      .integer("Capacity must be a whole number.")
      .min(1, "Capacity must be at least 1.")
      .required("Capacity is required.")
      .test(
        "capacity-not-below-reservations",
        "Capacity cannot be less than the number of reserved participants.",
        function (value) {
          const minimum = this.options.context?.minimumCapacity;

          return typeof value === "number" &&
            typeof minimum === "number"
            ? value >= minimum
            : true;
        }
      ),

    price: yup
      .number()
      .typeError("Price must be a number.")
      .min(0, "Price cannot be negative.")
      .required("Price is required."),

    currency: yup
      .mixed<"INR" | "USD" | "EUR" | "GBP" | "AED">()
      .oneOf(["INR", "USD", "EUR", "GBP", "AED"])
      .required("Please select a currency."),
  })
  .required();

export type AvailabilityFormValues = yup.InferType<
  typeof availabilitySchema
>;
