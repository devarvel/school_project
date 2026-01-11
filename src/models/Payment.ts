import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    studentId: mongoose.Types.ObjectId;
    amount: number;
    reference: string; // Paystack reference
    classAtTimeOfPayment: number; // Snapshot of level when paid
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        amount: { type: Number, required: true },
        reference: { type: String, required: true, unique: true },
        classAtTimeOfPayment: { type: Number, required: true },
    },
    { timestamps: true }
);

// Indexes
PaymentSchema.index({ reference: 1 });
PaymentSchema.index({ studentId: 1 });

export const Payment = (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);
