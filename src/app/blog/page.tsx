import { PublicNavbar } from "@/components/layout/PublicNavbar";
import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
    await connectToDatabase();
    const posts = await BlogPost.find({ published: true }).sort({ createdAt: -1 });

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col pt-20">
            <PublicNavbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">School News & <span className="text-indigo-500">Updates</span></h2>
                    <p className="text-slate-400 text-lg">Stay informed with the latest happenings, academic calendars, and announcements from Scholar Portal Pro.</p>
                </div>

                {posts.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500">No published articles yet. Stay tuned!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post._id.toString()}
                                href={`/blog/${post.slug}`}
                                className="group flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all"
                            >
                                {post.imageHeader ? (
                                    <img
                                        src={post.imageHeader}
                                        alt={post.title}
                                        className="aspect-video object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                ) : (
                                    <div className="aspect-video bg-slate-800 flex items-center justify-center">
                                        <GraduationCap className="w-12 h-12 text-slate-700" />
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">{post.excerpt}</p>

                                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold pt-4 border-t border-slate-800 group-hover:gap-3 transition-all">
                                        Read Article
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <footer className="py-12 border-t border-slate-900 text-center text-slate-600 text-xs">
                © 2026 Scholar Portal Pro
            </footer>
        </div>
    );
}

function GraduationCap(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
    );
}
