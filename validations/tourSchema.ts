import * as yup from "yup";

export const tourSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, "Tour title must be at least 3 characters")
    .max(150, "Tour title cannot exceed 150 characters")
    .required("Tour title is required"),

  destinationId: yup
    .string()
    .required("Please select a destination"),

  categoryId: yup
    .string()
    .required("Please select a category"),

  description: yup
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .required("Tour description is required"),

  durationDays: yup
    .number()
    .typeError("Please enter a valid duration")
    .integer("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day")
    .required("Duration is required"),

  nights: yup
    .number()
    .typeError("Please enter a valid number of nights")
    .integer("Nights must be a whole number")
    .min(0, "Nights cannot be negative")
    .test(
      "valid-nights",
      "Nights must be less than the number of days",
      function (value) {
        if (value === undefined) return true;

        return value < Number(this.parent.durationDays);
      }
    )
    .required("Number of nights is required"),

  durationMinutes: yup
    .number()
    .typeError("Duration in minutes is required")
    .positive("Duration must be greater than zero")
    .required("Duration in minutes is required"),

  basePrice: yup
    .number()
    .typeError("Please enter a valid price")
    .min(0, "Price cannot be negative")
    .required("Tour price is required"),

  currency: yup
    .string()
    .oneOf(["INR", "USD", "EUR", "GBP", "AED"], "Invalid currency")
    .required("Currency is required"),

  highlights: yup.array().of(yup.string().trim().required()).default([]),

  inclusions: yup.array().of(yup.string().trim().required()).default([]),

  exclusions: yup.array().of(yup.string().trim().required()).default([]),

  days: yup
    .array()
    .of(
      yup.object({
        title: yup.string().trim().required("Day title is required"),
        description: yup
          .string()
          .trim()
          .required("Day description is required"),
        time: yup.string().trim().default(""),
      })
    )
    .min(1, "Add at least one itinerary day")
    .required("Itinerary is required"),

  meetingPoint: yup
    .object({
      name: yup.string().trim().required("Meeting point name is required"),
      address: yup.string().trim().required("Meeting point address is required"),
      instructions: yup.string().trim().default(""),
      coordinates: yup
        .object({
          lat: yup.number().nullable().optional(),
          lng: yup.number().nullable().optional(),
        })
        .required(),
    })
    .required("Meeting point details are required"),

  whatsappNumber: yup
    .string()
    .trim()
    .matches(
      /^\+[1-9]\d{7,14}$/,
      "Enter a valid international WhatsApp number"
    )
    .optional()
    .default(""),

  images: yup
    .array()
    .of(
      yup.object({
        url: yup.string().required(),
        publicId: yup.string().required(),
      })
    )
    .max(10, "A tour can have a maximum of 10 images")
    .default([]),

  cancellationPolicy: yup
    .string()
    .trim()
    .required("Cancellation policy is required"),

  minParticipants: yup
    .number()
    .integer()
    .min(1, "Minimum participants must be at least 1")
    .required("Minimum participants is required"),

  maxParticipants: yup
    .number()
    .integer()
    .min(1, "Maximum participants must be at least 1")
    .test(
      "participant-range",
      "Maximum participants must be greater than or equal to minimum participants",
      function (value) {
        if (value === undefined) return true;

        return value >= Number(this.parent.minParticipants);
      }
    )
    .required("Maximum participants is required"),

  ageRestrictions: yup
    .object({
      minAge: yup
        .number()
        .integer()
        .min(0, "Minimum age cannot be negative")
        .required("Minimum age is required"),

      maxAge: yup
        .number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === "" ? null : value
        )
        .min(0, "Maximum age cannot be negative")
        .optional()
        .default(null),
    })
    .required(),

  difficultyLevel: yup
    .string()
    .oneOf(["easy", "moderate", "challenging", "extreme"])
    .required("Difficulty level is required"),

  languages: yup.array().of(yup.string().trim().required()).default([]),

  tags: yup.array().of(yup.string().trim().required()).default([]),

  instantBooking: yup.boolean().default(false),

  status: yup
    .string()
    .oneOf(["draft", "published", "archived"])
    .required("Tour status is required"),
});

export type TourFormValues = yup.InferType<typeof tourSchema>;