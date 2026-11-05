import * as yup from "yup";

export const signupSchema = yup
  .object({
    firstName: yup
     .string()
    .trim()
    .required("Please enter your first name")
    .matches(
      /^[A-Za-z]+(?: [A-Za-z]+)*$/,
      "First name should contain only letters"),

    lastName: yup
      .string()
    .trim()
    .required("Please enter your last name")
    .matches(
      /^[A-Za-z]+(?: [A-Za-z]+)*$/,
      "Last name should contain only letters"
    ),

    email: yup
      .string()
    .trim()
    .required("Please enter your email")
    .email("Please enter a valid email address"),

    phone: yup
      .string()
      .trim()
      .max(20, "Phone number cannot exceed 20 characters")
      .defined(),

    role: yup
      .mixed<"TRAVELER" | "OPERATOR">()
      .oneOf(["TRAVELER", "OPERATOR"], "Please select an account type")
      .required("Account type is required"),

    city: yup.string().when("role", {
      is: "OPERATOR",
      then: (schema) =>
        schema
          .trim()
          .max(100, "City cannot exceed 100 characters")
          .required("Operating city is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    businessName: yup.string().when("role", {
      is: "OPERATOR",
      then: (schema) =>
        schema
          .trim()
          .max(150, "Business name cannot exceed 150 characters")
          .required("Business name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    password: yup
      .string()
    .required("Please enter your password")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[A-Z]/,
      "Password must contain at least 1 capital letter"
    )
    .matches(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character"
    ),

    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords do not match")
      .required("Please confirm your password"),

    agreeTerms: yup
      .boolean()
      .oneOf([true], "Please accept the Terms of Service and Privacy Policy")
      .required(),
  })
  .required();

export type SignupFormValues = yup.InferType<typeof signupSchema>;