import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
    resultUnlockFee: number;
    schoolLogo?: string;
    schoolStamp?: string;
    directorSignature?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
    {
        resultUnlockFee: { type: Number, required: true, default: 0 },
        schoolLogo: { type: String },
        schoolStamp: { type: String },
        directorSignature: { type: String },
    },
    { timestamps: true }
);

export const Settings = (mongoose.models.Settings as Model<ISettings>) || mongoose.model<ISettings>('Settings', SettingsSchema);
