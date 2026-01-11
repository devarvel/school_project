import { PublicNavbar } from "@/components/layout/PublicNavbar";
import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    await connectToDatabase();
    const post = await BlogPost.findOne({ slug, published: true });

    if (!post) notFound();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col pt-20">
            <PublicNavbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to News
                </Link>

                <article className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="space-y-6 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-slate-800 rounded-full hidden md:block"></span>
                            {post.author && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter leading-tight italic">
                            {post.title}
                        </h1>

                        <p className="text-xl text-slate-400 italic font-medium leading-relaxed">
                            {post.excerpt}
                        </p>
                    </header>

                    {post.imageHeader && (
                        <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                            <img
                                src={post.imageHeader}
                                alt={post.title}
                                className="w-full object-cover max-h-[500px]"
                            />
                        </div>
                    )}

                    <div
                        className="prose prose-invert prose-slate max-w-none text-slate-300 leading-loose text-lg"
                        dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
                    />
                </article>

                {/* Call to Action */}
                <div className="mt-20 p-12 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center space-y-6">
                    <h3 className="text-2xl font-bold text-white">Digitalizing Academic Success</h3>
                    <p className="text-slate-400 max-w-md mx-auto">Access your results securely and instantly through our premium academic portal.</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20"
                    >
                        Login to Portal
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                </div>
            </main>

            <footer className="py-12 border-t border-slate-900 border-opacity-50 text-center text-slate-600 text-xs">
                © 2026 Scholar Portal Pro
            </footer>
        </div>
    );
}
