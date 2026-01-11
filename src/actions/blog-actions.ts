'use server';

import connectToDatabase from '@/lib/db';
import { BlogPost } from '@/models/BlogPost';
import { revalidatePath } from 'next/cache';
import { BlogPostSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function createBlogPost(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = BlogPostSchema.parse({
            ...formData,
            published: formData.published === 'on' || formData.published === true,
        });

        const post = await BlogPost.create({
            ...validatedData,
            slug: validatedData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        });

        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        revalidatePath('/');
        return { success: true, post: JSON.parse(JSON.stringify(post)) };
    } catch (err: any) {
        return { success: false, error: err.message || 'Validation failed' };
    }
}

export async function updateBlogPost(id: string, formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = BlogPostSchema.parse({
            ...formData,
            published: formData.published === 'on' || formData.published === true || formData.published === 'true',
        });

        const post = await BlogPost.findByIdAndUpdate(
            id,
            {
                ...validatedData,
                slug: validatedData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            },
            { new: true }
        );

        if (!post) return { success: false, error: 'Post not found' };

        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        revalidatePath(`/blog/${post.slug}`);
        revalidatePath('/');
        return { success: true, post: JSON.parse(JSON.stringify(post)) };
    } catch (err: any) {
        return { success: false, error: err.message || 'Validation failed' };
    }
}

export async function deleteBlogPost(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        await BlogPost.findByIdAndDelete(id);
        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

