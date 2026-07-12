// ============================================
// MovieVerse — OTP Store & SMS Delivery Service
// Stores OTPs in a global cache and handles Twilio SMS delivery
// ============================================

interface OTPData {
  otp: string;
  expiresAt: number;
}

// Persist OTP map on globalThis in Next.js development hot-reloads
const globalForOTP = globalThis as unknown as {
  otpMap: Map<string, OTPData> | undefined;
};

if (!globalForOTP.otpMap) {
  globalForOTP.otpMap = new Map<string, OTPData>();
}

export const otpMap = globalForOTP.otpMap;

/**
 * Generates a 4-digit OTP and stores it with a 5-minute expiry.
 */
export function generateOTP(phone: string): string {
  const cleanPhone = phone.replace(/\s+/g, "");
  // Generate random 4-digit code
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

  otpMap.set(cleanPhone, { otp, expiresAt });
  return otp;
}

/**
 * Verifies a phone number's OTP code.
 */
export function verifyOTP(phone: string, inputOtp: string): boolean {
  const cleanPhone = phone.replace(/\s+/g, "");
  const data = otpMap.get(cleanPhone);
  
  if (!data) {
    console.log(`[OTP STORE] No OTP request found for phone: ${cleanPhone}`);
    return false;
  }

  if (Date.now() > data.expiresAt) {
    console.log(`[OTP STORE] OTP expired for phone: ${cleanPhone}`);
    otpMap.delete(cleanPhone);
    return false;
  }

  const isValid = data.otp === inputOtp;
  if (isValid) {
    // Single-use: delete after verification
    otpMap.delete(cleanPhone);
    console.log(`[OTP STORE] OTP verified successfully for phone: ${cleanPhone}`);
  } else {
    console.log(`[OTP STORE] OTP verification failed for phone: ${cleanPhone}. Expected: ${data.otp}, got: ${inputOtp}`);
  }

  return isValid;
}

/**
 * Sends an OTP SMS via Twilio, Fast2SMS, or Vonage API if credentials exist.
 * Otherwise, logs to console and returns info for simulation.
 */
export async function sendSMS(phone: string, otp: string): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  // 1. Fast2SMS Option (Highly recommended for simple OTP in India)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      // Fast2SMS expects numbers without '+' prefix or country code if using local numbers, 
      // but let's sanitize it: numbers is a comma-separated string of 10-digit numbers.
      let localPhone = phone.replace(/\D/g, "");
      if (localPhone.startsWith("91") && localPhone.length === 12) {
        localPhone = localPhone.substring(2);
      }

      const url = "https://www.fast2sms.com/dev/bulkV2";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "authorization": fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: localPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.return === false) {
        throw new Error(data.message || "Fast2SMS API responded with an error");
      }

      console.log(`[Fast2SMS] Real OTP SMS sent to ${localPhone} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error(`[Fast2SMS] Failed to send SMS:`, err.message);
      return { success: false, simulated: false, error: err.message };
    }
  }

  // 2. Vonage Option (Global)
  const vonageKey = process.env.VONAGE_API_KEY;
  const vonageSecret = process.env.VONAGE_API_SECRET;
  const vonageFrom = process.env.VONAGE_FROM || "MovieVerse";
  if (vonageKey && vonageSecret) {
    try {
      const url = "https://rest.nexmo.com/sms/json";
      const body = new URLSearchParams({
        api_key: vonageKey,
        api_secret: vonageSecret,
        to: phone.replace(/\+/g, ""),
        from: vonageFrom,
        text: `Your MovieVerse sign-in OTP is ${otp}. Valid for 5 minutes.`,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();
      if (!response.ok || (data.messages && data.messages[0].status !== "0")) {
        const errMsg = data.messages ? data.messages[0]["error-text"] : `HTTP error ${response.status}`;
        throw new Error(errMsg);
      }

      console.log(`[Vonage] Real OTP SMS sent to ${phone} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error(`[Vonage] Failed to send SMS:`, err.message);
      return { success: false, simulated: false, error: err.message };
    }
  }

  // 3. Twilio Option (Global)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (accountSid && authToken && twilioPhone) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      
      const body = new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: `Your MovieVerse sign-in OTP is ${otp}. Valid for 5 minutes.`,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      console.log(`[Twilio SMS] Real OTP SMS sent to ${phone} successfully. SID: ${data.sid}`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error(`[Twilio SMS] Failed to send real SMS:`, err.message);
      return { success: false, simulated: false, error: err.message };
    }
  }

  // 4. Free Textbelt Option (fallback if no custom credentials are set, 1 free message per day per IP)
  console.log(`[Textbelt SMS] Trying to send free daily SMS to ${phone}...`);
  try {
    const url = "https://textbelt.com/text";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        number: phone,
        message: `Your MovieVerse sign-in OTP is ${otp}. Valid for 5 minutes.`,
        key: "textbelt",
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log(`[Textbelt SMS] Free SMS sent successfully! Text ID: ${data.textId}`);
      return { success: true, simulated: false };
    } else {
      console.warn(`[Textbelt SMS] Free daily quota exceeded or error: ${data.error}`);
    }
  } catch (err: any) {
    console.error(`[Textbelt SMS] Request failed:`, err.message);
  }

  // Fallback simulator for development
  console.log(`\n======================================================`);
  console.log(`[SMS SIMULATOR] SMS environment variables not fully set (or free quota used).`);
  console.log(`[SMS SIMULATOR] Sending code to: ${phone}`);
  console.log(`[SMS SIMULATOR] OTP CODE: ${otp}`);
  console.log(`======================================================\n`);
  
  return { success: true, simulated: true };
}

/**
 * Sends an OTP to the given email address using Resend or Brevo API.
 * Otherwise, logs to console and returns info for simulation.
 */
export async function sendEmail(email: string, otp: string): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. SendGrid Option
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const fromEmail = process.env.SENDGRID_FROM || "onboarding@resend.dev";
      const url = "https://api.sendgrid.com/v3/mail/send";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: cleanEmail }],
            },
          ],
          from: {
            email: fromEmail,
            name: "MovieVerse",
          },
          subject: "Your MovieVerse Verification Code",
          content: [
            {
              type: "text/html",
              value: `<p>Your MovieVerse sign-in OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error ${response.status}`);
      }

      console.log(`[SendGrid Email] Real OTP email sent to ${cleanEmail} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.warn(`[SendGrid Email] Failed to send email:`, err.message);
      // Fall through
    }
  }

  // 2. Resend Option
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const url = "https://api.resend.com/emails";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MovieVerse <onboarding@resend.dev>",
          to: cleanEmail,
          subject: "Your MovieVerse Verification Code",
          html: `<p>Your MovieVerse sign-in OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      console.log(`[Resend Email] Real OTP email sent to ${cleanEmail} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.warn(`[Resend Email] Failed to send email:`, err.message);
      // Fall through instead of returning error
    }
  }

  // 2. Brevo Option
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (brevoKey) {
    try {
      const url = "https://api.brevo.com/v3/smtp/email";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "MovieVerse", email: "onboarding@brevo.com" },
          to: [{ email: cleanEmail }],
          subject: "Your MovieVerse Verification Code",
          htmlContent: `<p>Your MovieVerse sign-in OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      console.log(`[Brevo Email] Real OTP email sent to ${cleanEmail} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.warn(`[Brevo Email] Failed to send email:`, err.message);
      // Fall through
    }
  }

  // 3. SMTP (Nodemailer) Option
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: smtpPort === "465", // true for 465, false for other ports
        auth: {
          user: smtpUser,
          password: smtpPass,
        },
      });

      const fromAddress = process.env.SMTP_FROM || `MovieVerse <${smtpUser}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: "Your MovieVerse Verification Code",
        html: `<p>Your MovieVerse sign-in OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
      });

      console.log(`[SMTP Email] Real OTP email sent to ${cleanEmail} successfully.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.warn(`[SMTP Email] Failed to send email:`, err.message);
      // Fall through
    }
  }

  // Fallback simulator for development
  console.log(`\n======================================================`);
  console.log(`[EMAIL SIMULATOR] Email API keys not fully set or failed.`);
  console.log(`[EMAIL SIMULATOR] Sending code to: ${cleanEmail}`);
  console.log(`[EMAIL SIMULATOR] OTP CODE: ${otp}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

