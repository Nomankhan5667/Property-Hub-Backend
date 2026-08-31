import transporter from '../config/nodemailer.js';

const FROM = process.env.EMAIL_FROM || 'PropertyHub <noreply@propertyhub.com>';

/**
 * Send welcome email to newly registered user
 */
export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: 'Welcome to PropertyHub! 🏠',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;letter-spacing:-0.5px;">🏠 PropertyHub</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Your trusted real estate marketplace</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a2e;font-size:24px;margin:0 0 16px;">Welcome aboard, ${name}! 🎉</h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
              Thank you for joining PropertyHub! We're thrilled to have you as part of our community.
              Whether you're looking to buy, rent, or list properties, we've got everything you need.
            </p>
            <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:0 0 24px;">
              <h3 style="color:#1a73e8;margin:0 0 12px;font-size:16px;">What you can do on PropertyHub:</h3>
              <ul style="color:#555;margin:0;padding-left:20px;line-height:1.8;">
                <li>Browse thousands of properties across Pakistan</li>
                <li>Save your favorite listings for quick access</li>
                <li>Connect directly with verified property agents</li>
                <li>Get AI-powered property recommendations</li>
              </ul>
            </div>
            <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
              Explore Properties →
            </a>
          </div>
          <div style="background:#f4f7f9;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:13px;margin:0;">
              © ${new Date().getFullYear()} PropertyHub. All rights reserved.<br>
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send forgot password email with reset link
 */
export const sendForgotPasswordEmail = async (email, name, resetUrl) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: 'Reset Your PropertyHub Password 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;">🏠 PropertyHub</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Password Reset Request</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a2e;font-size:24px;margin:0 0 16px;">Hi ${name},</h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
              We received a request to reset your password. Click the button below to create a new password.
              This link will expire in <strong>15 minutes</strong> for security reasons.
            </p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#e53935,#c62828);color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Reset My Password
              </a>
            </div>
            <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;padding:16px;margin:20px 0;">
              <p style="color:#555;margin:0;font-size:14px;">
                ⚠️ <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email.
                Your account remains secure.
              </p>
            </div>
            <p style="color:#999;font-size:13px;margin:16px 0 0;">
              Or copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color:#1a73e8;word-break:break-all;">${resetUrl}</a>
            </p>
          </div>
          <div style="background:#f4f7f9;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:13px;margin:0;">© ${new Date().getFullYear()} PropertyHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send inquiry notification to agent
 */
export const sendInquiryNotificationEmail = async (agentEmail, agentName, propertyTitle, userName, message) => {
  const mailOptions = {
    from: FROM,
    to: agentEmail,
    subject: `New Inquiry for "${propertyTitle}" 📩`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;">🏠 PropertyHub</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">New Inquiry Received</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a2e;font-size:24px;margin:0 0 8px;">Hi ${agentName},</h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
              You have received a new inquiry for your property listing.
            </p>
            <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:0 0 24px;">
              <p style="color:#1a73e8;font-weight:700;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Property</p>
              <p style="color:#1a1a2e;font-size:18px;font-weight:600;margin:0 0 16px;">${propertyTitle}</p>
              <p style="color:#1a73e8;font-weight:700;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">From</p>
              <p style="color:#1a1a2e;font-size:16px;font-weight:500;margin:0 0 16px;">${userName}</p>
              <p style="color:#1a73e8;font-weight:700;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Message</p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0;background:#fff;padding:12px;border-radius:6px;border:1px solid #e0e0e0;">
                ${message}
              </p>
            </div>
            <a href="${process.env.FRONTEND_URL}/dashboard/inquiries" style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
              View Inquiry →
            </a>
          </div>
          <div style="background:#f4f7f9;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:13px;margin:0;">© ${new Date().getFullYear()} PropertyHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send property approval/rejection notification to owner
 */
export const sendPropertyApprovalEmail = async (ownerEmail, ownerName, propertyTitle, status) => {
  const isApproved = status === 'approved';
  const mailOptions = {
    from: FROM,
    to: ownerEmail,
    subject: `Property ${isApproved ? 'Approved ✅' : 'Rejected ❌'}: ${propertyTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,${isApproved ? '#2e7d32,#1b5e20' : '#c62828,#7f0000'});padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;">🏠 PropertyHub</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Property ${isApproved ? 'Approved' : 'Rejected'}</p>
          </div>
          <div style="padding:40px 30px;">
            <div style="text-align:center;font-size:60px;margin:0 0 20px;">${isApproved ? '✅' : '❌'}</div>
            <h2 style="color:#1a1a2e;font-size:24px;margin:0 0 16px;text-align:center;">
              Hi ${ownerName}, your property has been ${isApproved ? 'approved' : 'rejected'}!
            </h2>
            <div style="background:${isApproved ? '#e8f5e9' : '#ffebee'};border-radius:8px;padding:20px;margin:0 0 24px;">
              <p style="color:#555;font-size:15px;margin:0 0 8px;"><strong>Property:</strong> ${propertyTitle}</p>
              <p style="color:#555;font-size:15px;margin:0;"><strong>Status:</strong>
                <span style="color:${isApproved ? '#2e7d32' : '#c62828'};font-weight:700;">${status.toUpperCase()}</span>
              </p>
            </div>
            ${isApproved
              ? `<p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                  Congratulations! Your property is now live on PropertyHub and visible to potential buyers/renters.
                </p>
                <a href="${process.env.FRONTEND_URL}/properties" style="display:inline-block;background:linear-gradient(135deg,#2e7d32,#1b5e20);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                  View Live Listing →
                </a>`
              : `<p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                  Unfortunately, your property listing did not meet our guidelines. Please review the listing and make the necessary adjustments, then resubmit for approval.
                </p>
                <a href="${process.env.FRONTEND_URL}/dashboard/properties" style="display:inline-block;background:linear-gradient(135deg,#c62828,#7f0000);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                  Edit & Resubmit →
                </a>`
            }
          </div>
          <div style="background:#f4f7f9;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:13px;margin:0;">© ${new Date().getFullYear()} PropertyHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};
