import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/enums";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const { token } = req.nextauth;
        const role = token?.role;

        // 1. Admin Routes Protection
        // Matches /admin, /admin/dashboard, etc.
        if (pathname.startsWith("/admin")) {
            if (role !== UserRole.SUPER_ADMIN && role !== UserRole.CLASS_ADMIN) {
                return NextResponse.redirect(new URL("/login", req.url));
            }

            // Super Admin only routes
            const superAdminOnlyPaths = [
                "/admin/users",
                "/admin/audit",
                "/admin/promotion",
                "/admin/blog",
                "/admin/settings",
            ];

            if (superAdminOnlyPaths.some(path => pathname.startsWith(path)) && role !== UserRole.SUPER_ADMIN) {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
        }

        // 2. Student Routes Protection
        if (pathname.startsWith("/student")) {
            // Allow Admins to view student results (e.g. for printing)
            if (pathname.startsWith("/student/result/")) {
                if (role !== UserRole.STUDENT && role !== UserRole.SUPER_ADMIN && role !== UserRole.CLASS_ADMIN) {
                    return NextResponse.redirect(new URL("/login", req.url));
                }
            } else {
                // strict student-only for other /student/ routes (dashboard, etc.)
                if (role !== UserRole.STUDENT) {
                    return NextResponse.redirect(new URL("/login", req.url));
                }
            }
        }

        // 3. API Protection (Optional - usually good to protect mutation APIs)
        if (pathname.startsWith("/api/admin")) {
            if (role !== UserRole.SUPER_ADMIN && role !== UserRole.CLASS_ADMIN) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Requires the user to be logged in for matched routes
        },
        pages: {
            signIn: "/login",
        },
    }
);

// Matcher: Protects the routes we care about
export const config = {
    matcher: [
        "/admin/:path*",
        "/student/:path*",
        "/api/admin/:path*",
    ],
};
