export const dynamic = "force-static";
// ============================================
// MovieVerse — OTP Generation & Delivery API
// POST /api/auth/otp/send
// ============================================

import { NextResponse } from "next/server";
import { generateOTP, sendEmail } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = generateOTP(cleanEmail);

    // Send the email (will be real if Resend/Brevo keys are configured, otherwise simulated)
    const result = await sendEmail(cleanEmail, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to deliver OTP email." },
        { status: 500 }
      );
    }

    if (result.simulated) {
      return NextResponse.json({
        success: true,
        message: "OTP generated! (Email API keys not configured. Code logged to server console.)",
        simulated: true,
        otp: otp
      });
    }

    return NextResponse.json({
      success: true,
      message: "A verification code has been sent to your email address.",
      simulated: false
    });
  } catch (error: any) {
    console.error("POST /api/auth/otp/send error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
