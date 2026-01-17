import { z } from 'zod';

// Admin Validation
export const AdminSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    assignedLevel: z.coerce.number().min(1).max(14).optional(),
});

// Student Validation
export const StudentSchema = z.object({
    admissionNum: z.string().min(3, 'Admission number is too short').toUpperCase(),
    surname: z.string().min(2, 'Surname is too short').toUpperCase(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    currentLevel: z.coerce.number().min(1).max(14),
});

// Blog Post Validation
export const BlogPostSchema = z.object({
    title: z.string().min(5, 'Title is too short'),
    excerpt: z.string().min(10, 'Excerpt is too short'),
    content: z.string().min(20, 'Content is too short'),
    imageHeader: z.string().url('Invalid image URL').optional().or(z.literal('')),
    published: z.boolean().default(false),
});

// Result Upload Validation
export const ResultSchema = z.object({
    studentId: z.string().min(12, 'Invalid Student ID'),
    term: z.enum(['First', 'Second', 'Third']),
    session: z.string().regex(/^\d{4}\/\d{4}$/, 'Session must be in format YYYY/YYYY'),
    pdfUrl: z.string().url('Invalid PDF URL'),
});

// Paystack Webhook Metadata Validation
export const WebhookMetadataSchema = z.object({
    resultId: z.string(),
    studentId: z.string(),
    admissionNum: z.string(),
});
