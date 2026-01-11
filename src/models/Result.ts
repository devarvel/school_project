import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResult extends Document {
    studentId: mongoose.Types.ObjectId;
    term: string; // e.g., "First", "Second", "Third"
    session: string; // e.g., "2023/2024"
    pdfUrl: string; // Cloudinary URL
    isPaid: boolean;
    accessToken?: string; // 6-digit token
    accessTokenExpiresAt?: Date;
    accessTokenUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        term: { type: String, required: true },
        session: { type: String, required: true },
        pdfUrl: { type: String, required: true },
        isPaid: { type: Boolean, default: false },
        accessToken: { type: String },
        accessTokenExpiresAt: { type: Date },
        accessTokenUsed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes for fast lookups
ResultSchema.index({ studentId: 1 });
ResultSchema.index({ session: 1, term: 1 });
ResultSchema.index({ studentId: 1, session: 1, term: 1 }, { unique: true }); // Prevent duplicate uploads for same term

export const Result = (mongoose.models.Result as Model<IResult>) || mongoose.model<IResult>('Result', ResultSchema);
