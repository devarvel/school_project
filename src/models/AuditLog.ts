import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;           // e.g., "CREATE_STUDENT", "DELETE_STUDENT", "UPLOAD_RESULT"
    performedBy: string;      // Admin email or ID
    performedByRole: string;  // "Super-Admin" or "Class-Admin"
    targetType: string;       // "Student", "Result", "Admin", "BlogPost"
    targetId?: string;        // ID of the affected record
    details: string;          // Human-readable description
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedByRole: { type: String, required: true },
        targetType: { type: String, required: true },
        targetId: { type: String },
        details: { type: String, required: true },
    },
    { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = (mongoose.models.AuditLog as Model<IAuditLog>) || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
