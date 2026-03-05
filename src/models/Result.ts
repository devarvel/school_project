import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScore {
    subject: string;
    ca: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
}

export interface IResult extends Document {
    studentId: mongoose.Types.ObjectId;
    term: string; // e.g., "First", "Second", "Third"
    session: string; // e.g., "2023/2024"
    scores: IScore[];
    classTeacherRemark?: string;
    headTeacherRemark?: string;
    attendance?: {
        daysPresent: number;
        daysAbsent: number;
    };
    affectiveTraits?: Record<string, number>; // Maps trait name to 1-5 score
    psychomotorSkills?: Record<string, number>; // Maps skill name to 1-5 score
    position?: string; // e.g. "1st", "2nd"
    isPaid: boolean;
    accessToken?: string; // 6-digit token
    accessTokenExpiresAt?: Date;
    accessTokenUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>({
    subject: { type: String, required: true },
    ca: { type: Number, required: true, min: 0, max: 40 },
    exam: { type: Number, required: true, min: 0, max: 60 },
    total: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    remark: { type: String, required: true },
}, { _id: false });

const ResultSchema = new Schema<IResult>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        term: { type: String, required: true },
        session: { type: String, required: true },
        scores: { type: [ScoreSchema], default: [] },
        classTeacherRemark: { type: String },
        headTeacherRemark: { type: String },
        attendance: {
            daysPresent: { type: Number },
            daysAbsent: { type: Number },
        },
        affectiveTraits: { type: Map, of: Number },
        psychomotorSkills: { type: Map, of: Number },
        position: { type: String },
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
