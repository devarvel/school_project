import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import Link from "next/link";
import { BlogActions } from "@/components/admin/BlogActions";


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/enums";


export default async function AdminBlogPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.SUPER_ADMIN) {
        redirect('/admin/dashboard');
    }

    await connectToDatabase();
    const posts = await BlogPost.find({}).sort({ createdAt: -1 });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Blog Management</h2>
                    <p className="text-slate-400">Manage promotional content and school news.</p>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Article
                </Link>
            </div>

            <div className="grid gap-6">
                {posts.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-slate-500">
                            No blog posts found. Create your first article!
                        </CardContent>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <Card key={post._id.toString()}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    {post.imageHeader ? (
                                        <img
                                            src={post.imageHeader}
                                            alt={post.title}
                                            className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-slate-600" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-1">{post.excerpt}</p>
                                        <div className="flex gap-3 mt-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${post.published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {post.published ? 'PUBLISHED' : 'DRAFT'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <BlogActions postId={post._id.toString()} />

                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
