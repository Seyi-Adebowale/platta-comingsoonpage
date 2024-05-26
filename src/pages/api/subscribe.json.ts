export const prerender = false;

import type { APIRoute } from "astro";
import validateEmail from "../../lib/validateEmail";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    console.log("Received email:", email); // Debugging log

    if (!email) {
      throw new Error("Please provide an email");
    }

    if (!validateEmail(email)) {
      throw new Error("Please provide a valid email");
    }

    const subRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${import.meta.env.CONVERT_KIT_SECRET_KEY}&email_address=${email}`
    );

    if (!subRes.ok) {
      console.error("ConvertKit subscription check failed:", subRes.statusText);
      throw new Error("Error checking subscription status");
    }

    const subData = await subRes.json();
    const isSubscribed = subData.total_subscribers > 0;

    if (isSubscribed) {
      return new Response(JSON.stringify({ message: "🥳 You’re already subscribed!" }), { status: 200 });
    }

    const res = await fetch("https://api.convertkit.com/v3/forms/920122/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        api_key: import.meta.env.CONVERT_KIT_API_KEY,
        email,
      }),
    });

    if (!res.ok) {
      console.error("ConvertKit subscription failed:", res.statusText);
      throw new Error("Subscribing failed");
    }

    const resText = await res.json();
    if (resText.error) {
      console.error("ConvertKit API returned an error:", resText.error.message);
      throw new Error(resText.error.message);
    }

    return new Response(JSON.stringify({ message: "👀 Thanks! Please check your email to confirm your subscription." }), { status: 200 });

  } catch (error) {
    let errorMessage = "There is an unexpected error";
    if (error instanceof Error) {
      console.error("Error processing subscription request:", error.message);
      errorMessage = error.message;
    } else {
      console.error("Unknown error:", error);
    }
    return new Response(JSON.stringify({ message: errorMessage }), { status: 400 });
  }
};