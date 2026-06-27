import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter using Gmail.
 * Requires EMAIL_USER and EMAIL_PASS in .env
 * EMAIL_PASS should be a Gmail App Password (not your regular password).
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a password reset email with the reset link.
 * @param {string} toEmail - Recipient email address
 * @param {string} resetToken - The reset token generated for this user
 * @param {string} frontendUrl - Base URL of the frontend (e.g. http://localhost:3000)
 */
export const sendPasswordResetEmail = async (toEmail, resetToken, frontendUrl = 'http://localhost:3000') => {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"CareerPath Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your password – CareerPath',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Reset Your Password</title>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid rgba(255,158,66,0.2);border-radius:8px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1a1a,#0d0d0d);padding:32px 40px;border-bottom:2px solid rgba(255,158,66,0.3);text-align:center;">
                    <h1 style="margin:0;color:#ff9e42;font-size:22px;font-weight:800;letter-spacing:0.05em;">CAREERPATH</h1>
                    <p style="margin:6px 0 0;color:#666;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Your AI-Powered Career Guide</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:700;">Reset your password</h2>
                    <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
                      We received a request to reset the password for your CareerPath account associated with <strong style="color:#ff9e42;">${toEmail}</strong>.
                    </p>
                    <p style="margin:0 0 28px;color:#aaaaaa;font-size:14px;line-height:1.7;">
                      Click the button below to set a new password. This link is valid for <strong style="color:#ffffff;">1 hour</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}"
                             style="display:inline-block;background:#ff9e42;color:#0a0a0a;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;padding:14px 36px;border-radius:4px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:28px 0 0;color:#666;font-size:12px;line-height:1.6;">
                      If the button doesn't work, copy and paste this link into your browser:<br/>
                      <a href="${resetUrl}" style="color:#ff9e42;word-break:break-all;">${resetUrl}</a>
                    </p>

                    <hr style="border:none;border-top:1px solid rgba(255,158,66,0.1);margin:28px 0;"/>

                    <p style="margin:0;color:#555;font-size:12px;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#0d0d0d;padding:20px 40px;border-top:1px solid rgba(255,158,66,0.1);text-align:center;">
                    <p style="margin:0;color:#444;font-size:11px;">
                      © ${new Date().getFullYear()} CareerPath. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Password reset email sent to ${toEmail}`);
};
