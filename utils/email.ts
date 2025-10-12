import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.office365.com', // Outlook SMTP host
    port: 587,                  // TLS port
    secure: false,              // use STARTTLS, not SSL
    auth: {
      user: process.env.EMAIL_USER,     // your Outlook email address
      pass: process.env.EMAIL_PASSWORD, // Outlook app password
    },
    tls: {
      ciphers: 'SSLv3', // optional
    },
  });
};

// Send 2FA code via email
export const send2FACode = async (email: string, code: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Cooncierge - 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Cooncierge - 2FA Verification</h2>
          <p>Your 2FA verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from Karvaan Admin System.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('2FA code sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return false;
  }
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};
