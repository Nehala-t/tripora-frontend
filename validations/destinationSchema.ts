
import * as yup from 'yup';

export const destinationSchema = yup.object({
    name: yup
        .string()
        .trim()
        .required('Destination name is required.')
        .min(2, 'Destination name must contain at least 2 characters.')
        .max(100, 'Destination name cannot exceed 100 characters.'),

    country: yup
        .string()
        .trim()
        .required('Country is required.')
        .max(100, 'Country cannot exceed 100 characters.'),

    region: yup
        .string()
        .trim()
        .max(100, 'Region cannot exceed 100 characters.')
        .default(''),

    description: yup
        .string()
        .trim()
        .required('Destination description is required.')
        .min(20, 'Description must contain at least 20 characters.'),

    highlights: yup
        .string()
        .default(''),

    bestTimeToVisit: yup
        .string()
        .trim()
        .max(200, 'Best time to visit cannot exceed 200 characters.')
        .default(''),

    latitude: yup
        .number()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === null
                ? undefined
                : value
        )
        .typeError('Latitude must be a valid number.')
        .required('Latitude is required.')
        .min(-90, 'Latitude must be at least -90.')
        .max(90, 'Latitude cannot exceed 90.'),

    longitude: yup
        .number()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === null
                ? undefined
                : value
        )
        .typeError('Longitude must be a valid number.')
        .required('Longitude is required.')
        .min(-180, 'Longitude must be at least -180.')
        .max(180, 'Longitude cannot exceed 180.'),

    image: yup
        .mixed<File>()
        .nullable()
        .notRequired()
        .test(
            'image-type',
            'Please select a valid image file.',
            (file) =>
                !file ||
                ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        )
        .test(
            'image-size',
            'Image size cannot exceed 5 MB.',
            (file) => !file || file.size <= 5 * 1024 * 1024
        ),
});

export type DestinationFormValues = yup.InferType<
    typeof destinationSchema
>;
