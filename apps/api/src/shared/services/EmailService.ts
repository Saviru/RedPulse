import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_123456';
const resend = new Resend(resendApiKey);

class EmailService {
  public async sendOtpEmail(to: string, otp: string, purpose: 'REGISTER' | 'DELETE'): Promise<void> {
    let subject = '';
    let html = '';

    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      console.log(`[EmailService] Test Mode - Skipping email send to ${to} for ${purpose}`);
      return;
    }

    if (purpose === 'REGISTER') {
      subject = 'Welcome to RedPulse - Verify Your Email';
      html = `<p>Hello,</p><p>Thank you for registering. Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`;
    } else if (purpose === 'DELETE') {
      subject = 'RedPulse - Account Deletion Request';
      html = `<p>Hello,</p><p>You requested to delete your account. Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>`;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'RedPulse <no-reply@redpulse.saviru.me>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('[EmailService] Resend API Error:', error);
        throw new Error(error.message || 'Failed to send email via Resend');
      } else {
        console.log(`[EmailService] OTP Email sent via Resend to ${to}. ID: ${data?.id}`);
      }
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
