
import * as yup from 'yup';

export const categorySchema = yup.object({
    name: yup
        .string()
        .trim()
        .required('Category name is required.')
        .min(2, 'Category name must contain at least 2 characters.')
        .max(100, 'Category name cannot exceed 100 characters.'),

    description: yup
        .string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters.')
        .default(''),

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

export type CategoryFormValues = yup.InferType<
    typeof categorySchema
>;
