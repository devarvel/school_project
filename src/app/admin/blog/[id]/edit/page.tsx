import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import { BlogForm } from "@/components/admin/BlogForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    console.log('Editing blog post ID:', id);

    await connectToDatabase();
    let post;
    try {
        post = await BlogPost.findById(id);
    } catch (err) {
        console.error('Error finding post:', err);
    }

    if (!post) {
        console.log('Post not found for ID:', id);
        notFound();
    }

    const postData = JSON.parse(JSON.stringify(post));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/blog" className="p-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-3xl font-bold text-white tracking-tight">Edit Article</h2>
            </div>

            <BlogForm initialData={postData} />
        </div>
    );
}


