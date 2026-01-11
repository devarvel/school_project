import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import { Result } from '@/models/Result';
import { Payment } from '@/models/Payment';
import { Student } from '@/models/User';
import { WebhookMetadataSchema } from '@/lib/validations';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
    const body = await req.json();
    const signature = req.headers.get('x-paystack-signature');

    // 1. Verify Signature
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');

    if (hash !== signature) {
        return new NextResponse('Invalid Signature', { status: 401 });
    }

    // 2. Handle Event
    const event = body.event;

    if (event === 'charge.success') {
        const data = body.data;

        // 2.1 Validate Metadata
        const validation = WebhookMetadataSchema.safeParse(data.metadata);
        if (!validation.success) {
            return new NextResponse('Invalid Metadata', { status: 400 });
        }
        const { resultId, studentId } = validation.data;

        await connectToDatabase();

        // Idempotency check
        const existingPayment = await Payment.findOne({ reference: data.reference });
        if (existingPayment) {
            return NextResponse.json({ message: 'Processed already' });
        }

        // 3. Update Result
        const accessToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit token
        const result = await Result.findByIdAndUpdate(resultId, {
            isPaid: true,
            accessToken,
            accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
        }, { new: true });

        // 4. Create Payment Record
        const student = await Student.findById(studentId);
        if (!student) return new NextResponse('Student not found', { status: 404 });

        await Payment.create({
            studentId: student._id,
            amount: data.amount / 100,
            reference: data.reference,
            classAtTimeOfPayment: student.currentLevel,
        });

        // 5. Internal Logging (Email dependency removed as per user request)
        console.log(`[PAYMENT SUCCESS] Student: ${student.surname} (${student.admissionNum}), Access Token: ${accessToken}`);

        return NextResponse.json({ status: 'success' });
    }

    return NextResponse.json({ status: 'ignored' });
}
