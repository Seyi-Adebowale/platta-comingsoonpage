export const prerender = false;

import type { APIRoute } from "astro";
import validateEmail from "../../lib/validateEmail";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    console.log("Received email:", email); // Debugging log

    if (!email) throw new Error("Please provide an email");

    if (!validateEmail(email)) throw new Error("Please provide a valid email");

    const subRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${import.meta.env.CONVERT_KIT_SECRET_KEY}&email_address=${email}`
    );
    if (!subRes.ok) throw new Error("Big Yikes!");

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

    if (!res.ok) throw new Error("Subscribing failed");

    const resText = await res.json();
    if (resText.error) throw new Error(resText.error.message);

    return new Response(JSON.stringify({ message: "👀 Thanks! Please check your email to confirm your subscription." }), { status: 200 });

  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : "There is an unexpected error" }), { status: 400 });
  }
};
