import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import { Admin, Student, IAdmin, IStudent } from "@/models/User";
import { UserRole } from "@/types/enums";
import bcrypt from "bcryptjs";

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
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await connectToDatabase();

                // Check Hardcoded Super Admin first (MVP)
                const superEmail = process.env.SUPER_ADMIN_EMAIL;
                const superPass = process.env.SUPER_ADMIN_PASSWORD;

                if (superEmail && credentials.email === superEmail) {
                    if (credentials.password === superPass) {
                        // Return phantom Super Admin user
                        return {
                            id: 'super-admin-id',
                            name: 'Super Admin',
                            email: superEmail,
                            role: UserRole.SUPER_ADMIN,
                        };
                    }
                }

                // Check DB for Class Admins
                const user = await Admin.findOne({ email: credentials.email });
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password || "");
                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    name: "Class Admin",
                    email: user.email,
                    role: user.role, // Should be CLASS_ADMIN usually, but if DB has SUPER_ADMIN that works too
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
            async authorize(credentials) {
                if (!credentials?.admissionNum || !credentials?.surname) return null;

                await connectToDatabase();

                const student = await Student.findOne({
                    admissionNum: credentials.admissionNum.toUpperCase(),
                    surname: credentials.surname.toUpperCase(),
                });

                if (!student) return null;

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
