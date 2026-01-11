import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccessTokenEmail(email: string, studentName: string, accessToken: string, term: string, session: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Scholar Portal Pro <onboarding@resend.dev>', // Replace with verified domain in production
      to: [email],
      subject: `Result Access Token - ${term} Term ${session}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Unlock Your Results</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your payment for the <strong>${term} Term (${session})</strong> result was successful.</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Your Access Token</p>
            <h1 style="margin: 10px 0; color: #1e293b; font-size: 48px; letter-spacing: 10px;">${accessToken}</h1>
          </div>
          <p>Go to your dashboard, click on the result, and enter this token to view your PDF.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
       console.error('Resend Error:', error);
       return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email Send Error:', error);
    return { success: false, error };
  }
}
