import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole, StudentStatus } from '@/types/enums';

export { UserRole, StudentStatus }; // Re-export for convenience if needed, but better to import from types

// --- Admin Interface & Schema ---
export interface IAdmin extends Document {
    email: string;
    password?: string; // Optional because Super-Admin might use Env vars, but usually we hash it. 
    // For MVP Super-Admin credentials are in ENV, but secondary admins need DB storage.
    role: UserRole.SUPER_ADMIN | UserRole.CLASS_ADMIN;
    assignedLevel?: number; // Only for Class-Admin
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String }, // Hashed
        role: { type: String, enum: [UserRole.SUPER_ADMIN, UserRole.CLASS_ADMIN], required: true },
        assignedLevel: { type: Number }, // 1-6 etc.
    },
    { timestamps: true }
);

// --- Student Interface & Schema ---
export interface IStudent extends Document {
    admissionNum: string;
    surname: string;
    firstName?: string;
    otherNames?: string;
    email?: string; // For result token notifications
    currentLevel: number;
    status: StudentStatus;
    isRepeat: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
    {
        admissionNum: { type: String, required: true, unique: true, uppercase: true },
        surname: { type: String, required: true, uppercase: true }, // Uppercase for consistent matching
        firstName: { type: String, uppercase: true },
        otherNames: { type: String, uppercase: true },
        email: { type: String }, // For result token notifications
        currentLevel: { type: Number, required: true },
        status: { type: String, enum: Object.values(StudentStatus), default: StudentStatus.ACTIVE },
        isRepeat: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes
StudentSchema.index({ currentLevel: 1 });

// Prevent model recompilation errors in Next.js hot reload
export const Admin = (mongoose.models.Admin as Model<IAdmin>) || mongoose.model<IAdmin>('Admin', AdminSchema);
export const Student = (mongoose.models.Student as Model<IStudent>) || mongoose.model<IStudent>('Student', StudentSchema);
