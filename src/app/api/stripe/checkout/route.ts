export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key_for_build", {
  apiVersion: "2024-12-18.preview" as any,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { tierId } = await request.json();
    
    let price = 59;
    let name = "MovieVerse VIP Monthly Pass";
    
    if (tierId === "yearly") {
      price = 599;
      name = "MovieVerse VIP Yearly Pass";
    } else if (tierId === "lifetime") {
      price = 1999;
      name = "MovieVerse VIP Lifetime Pass";
    }

    // Check if Stripe is configured
    const isMock = !process.env.STRIPE_SECRET_KEY || 
                   process.env.STRIPE_SECRET_KEY.includes("sk_test_51P...") ||
                   process.env.STRIPE_SECRET_KEY === "";

    if (isMock) {
      // Stripe not configured, return a mock URL
      const mockCheckoutUrl = `/premium/checkout?tierId=${tierId}&amount=${price}`;
      return NextResponse.json({ url: mockCheckoutUrl });
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name,
              description: "Access to VIP Golden Profile Badges, custom lists, AI search, and ad-free trailers.",
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/premium?status=success&tierId=${tierId}`,
      cancel_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/premium?status=cancelled`,
      metadata: {
        userId: session.user.id,
        tierId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
