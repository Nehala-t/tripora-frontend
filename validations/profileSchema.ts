import * as yup from "yup";

// ========================================
// REAL-WORLD REGEX PATTERNS
// ========================================

// Supports international names with accents & apostrophes (e.g. René, O'Connor, Al-Bitar, Müller)
const INTERNATIONAL_NAME_REGEX =
  /^[A-Za-z\u00C0-\u024F]+(?:[ '-][A-Za-z\u00C0-\u024F]+)*$/;

// Validates international telephone numbers with optional leading '+' and 8-15 total digits
const PHONE_NUMBER_REGEX = /^\+?[0-9\s()-]+$/;

// Matches valid top-level domain hostnames
const DOMAIN_HOSTNAME_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// ========================================
// COMMON REUSABLE VALIDATION SCHEMAS
// ========================================

/**
 * Required Phone Number Schema
 */
export const phoneNumberSchema = yup
  .string()
  .trim()
  .required("Phone number is required")
  .matches(PHONE_NUMBER_REGEX, "Please enter a valid phone number format")
  .test(
    "phone-digit-count",
    "Phone number must contain between 8 and 15 digits",
    (value) => {
      if (!value) return false;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    }
  );

/**
 * Optional Phone Number Schema (Allows empty string or null, validates if filled)
 */
export const optionalPhoneNumberSchema = yup
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .notRequired()
  .test(
    "valid-phone",
    "Please enter a valid phone number with 8–15 digits",
    (value) => {
      if (!value) return true; // Accept empty/null
      if (!PHONE_NUMBER_REGEX.test(value)) return false;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    }
  );

/**
 * Flexible Website URL Schema (Supports auto-prepending protocol)
 */
export const optionalWebsiteSchema = yup
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .notRequired()
  .max(2048, "Website URL cannot exceed 2048 characters")
  .test("valid-url", "Please enter a valid website address (e.g., example.com)", (value) => {
    if (!value) return true;

    try {
      const formattedUrl = /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`;
      const parsedUrl = new URL(formattedUrl);

      // Verify protocol and valid domain hostname
      return (
        (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
        DOMAIN_HOSTNAME_REGEX.test(parsedUrl.hostname)
      );
    } catch {
      return false;
    }
  });

// ========================================
// 1. PERSONAL PROFILE VALIDATION
// ========================================

export const profileSchema = yup
  .object({
    firstName: yup
      .string()
      .trim()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .matches(
        INTERNATIONAL_NAME_REGEX,
        "First name can contain letters, spaces, hyphens, and apostrophes only"
      ),

    lastName: yup
      .string()
      .trim()
      .required("Last name is required")
      .min(1, "Last name must be at least 1 character")
      .max(50, "Last name cannot exceed 50 characters")
      .matches(
        INTERNATIONAL_NAME_REGEX,
        "Last name can contain letters, spaces, hyphens, and apostrophes only"
      ),

    phone: optionalPhoneNumberSchema,

    bio: yup
      .string()
      .trim()
      .transform((val) => (val === null ? "" : val))
      .default("")
.min(50, "Business description must be at least 50 characters long")
      .max(500, "Bio cannot exceed 500 characters"),

    country: yup
      .string()
      .trim()
      .transform((val) => (val === null ? "" : val))
      .default("")
      .max(100, "Country name cannot exceed 100 characters"),

    city: yup
      .string()
      .trim()
      .transform((val) => (val === null ? "" : val))
      .default("")
      .max(100, "City name cannot exceed 100 characters"),
  })
  .required();

export type ProfileFormValues = yup.InferType<typeof profileSchema>;

// ========================================
// 2. TRAVEL PREFERENCES VALIDATION
// ========================================

export const travelPreferencesSchema = yup
  .object({
    preferredLanguage: yup
      .string()
      .trim()
      .required("Preferred language is required")
      .max(20, "Language string is too long")
      .default("en"),

    preferredCurrency: yup
      .string()
      .oneOf(
        ["INR", "USD", "EUR", "GBP", "AED"],
        "Please select a valid currency"
      )
      .required("Preferred currency is required")
      .default("INR"),

    preferredDestinations: yup
      .array()
      .of(
        yup
          .string()
          .trim()
          .required("Destination name cannot be empty")
          .max(100, "Destination cannot exceed 100 characters")
      )
      .max(20, "You can select up to 20 destinations")
      .default([]),

    travelStyle: yup
      .string()
      .oneOf(
        [
          "adventure",
          "relaxation",
          "luxury",
          "budget",
          "cultural",
          "family",
          "solo",
        ],
        "Please select a valid travel style"
      )
      .required("Travel style is required")
      .default("adventure"),

    budget: yup
      .string()
      .oneOf(["Low", "Medium", "High"], "Please select a valid budget level")
      .required("Travel budget tier is required")
      .default("Medium"),

    travelInterests: yup
      .array()
      .of(
        yup
          .string()
          .oneOf(
            [
              "adventure",
              "culture",
              "food",
              "nature",
              "sightseeing",
              "water_sports",
              "wildlife",
              "wellness",
            ],
            "Invalid travel interest selected"
          )
          .required()
      )
      .default([]),
  })
  .required();

export type TravelPreferencesFormValues = yup.InferType<
  typeof travelPreferencesSchema
>;

// ========================================
// 3. OPERATOR APPLICATION VALIDATION
// ========================================

export const operatorSchema = yup
  .object({
    businessName: yup
      .string()
      .trim()
      .required("Business name is required")
      .min(2, "Business name must contain at least 2 characters")
      .max(150, "Business name cannot exceed 150 characters"),

    businessEmail: yup
      .string()
      .trim()
      .lowercase()
      .required("Business email address is required")
      .email("Please provide a valid email address")
      .max(254, "Email address is too long"),

    businessPhone: phoneNumberSchema,

    website: optionalWebsiteSchema,

    businessAddress: yup
      .string()
      .trim()
      .required("Business address is required")
      .min(5, "Business address must contain at least 5 characters")
      .max(250, "Business address cannot exceed 250 characters"),

    businessDescription: yup
      .string()
      .trim()
      .required("Business description is required")
      .min(20, "Please provide a detailed description (at least 20 characters)")
      .max(1000, "Description cannot exceed 1000 characters"),
  })
  .required();

export type OperatorFormValues = yup.InferType<typeof operatorSchema>;