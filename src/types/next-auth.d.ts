import { DefaultSession } from "next-auth"
import { UserRole } from "@/types/enums"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            assignedLevel?: number
            admissionNum?: string
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        assignedLevel?: number
        admissionNum?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: UserRole
        assignedLevel?: number
        admissionNum?: string
    }
}
