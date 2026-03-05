import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import { Admin, Student, IAdmin, IStudent } from "@/models/User";
import { UserRole } from "@/types/enums";
import bcrypt from "bcryptjs";
import { loginRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

/**
 * Ensure Super Admin exists in DB.
 * On first run, seeds from environment variables with hashed password.
 * This allows password changes from the UI.
 */
async function ensureSuperAdminSeeded() {
    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    const superPass = process.env.SUPER_ADMIN_PASSWORD;

    if (!superEmail || !superPass) return;

    const existing = await Admin.findOne({ email: superEmail, role: UserRole.SUPER_ADMIN });
    if (!existing) {
        const hashedPassword = await bcrypt.hash(superPass, 10);
        await Admin.create({
            email: superEmail,
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
        });
        console.log('[AUTH] Super Admin seeded into database from env vars.');
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        // Super Admin & Class Admin Login
        CredentialsProvider({
            id: "admin-login",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                // Rate limiting by IP
                try {
                    const headersList = await headers();
                    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
                    const rateCheck = loginRateLimit(ip);
                    if (!rateCheck.success) {
                        throw new Error('Too many login attempts. Please wait a minute and try again.');
                    }
                } catch (e: any) {
                    if (e.message?.includes('Too many')) throw e;
                    // If headers() fails, continue without rate limiting
                }

                await connectToDatabase();

                // Ensure Super Admin is seeded in DB on first login
                await ensureSuperAdminSeeded();

                // Check DB for any admin (Super Admin or Class Admin)
                const user = await Admin.findOne({ email: credentials.email });
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password || "");
                if (!isValid) return null;

                if (user.role === UserRole.SUPER_ADMIN) {
                    return {
                        id: user._id.toString(),
                        name: 'Super Admin',
                        email: user.email,
                        role: UserRole.SUPER_ADMIN,
                    };
                }

                return {
                    id: user._id.toString(),
                    name: "Class Admin",
                    email: user.email,
                    role: user.role,
                    assignedLevel: user.assignedLevel,
                };
            },
        }),
        // Student Login
        CredentialsProvider({
            id: "student-login",
            name: "Student Login",
            credentials: {
                admissionNum: { label: "Admission Number", type: "text" },
                surname: { label: "Surname", type: "text" },
            },
            async authorize(credentials, req) {
                if (!credentials?.admissionNum || !credentials?.surname) return null;

                // Rate limiting by IP
                try {
                    const headersList = await headers();
                    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
                    const rateCheck = loginRateLimit(ip);
                    if (!rateCheck.success) {
                        throw new Error('Too many login attempts. Please wait a minute and try again.');
                    }
                } catch (e: any) {
                    if (e.message?.includes('Too many')) throw e;
                }

                await connectToDatabase();

                const student = await Student.findOne({
                    admissionNum: credentials.admissionNum.toUpperCase(),
                });

                if (!student) return null;

                // Check for custom password first
                if (student.password) {
                    const isValid = await bcrypt.compare(credentials.surname, student.password);
                    if (!isValid) return null;
                } else {
                    // Fallback to surname check
                    if (student.surname.toUpperCase() !== credentials.surname.toUpperCase()) {
                        return null;
                    }
                }

                return {
                    id: student._id.toString(),
                    name: `${student.surname} (${student.admissionNum})`,
                    role: UserRole.STUDENT,
                    admissionNum: student.admissionNum,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.assignedLevel = user.assignedLevel;
                token.admissionNum = user.admissionNum;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.assignedLevel = token.assignedLevel as number | undefined;
                session.user.admissionNum = token.admissionNum as string | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login", // Custom login page
        error: "/login",
    },
};
