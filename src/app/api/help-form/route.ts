import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const SUPPORT_EMAIL = "paulchrisluke@gmail.com";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, subject, description } = await req.json();
    if (!email || !subject || !description) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    // Basic email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    const text = `Name: ${name || "(not provided)"}\nEmail: ${email}\nSubject: ${subject}\n\n${description}`;
    // Send to admin
    await resend.emails.send({
      from: `Blawby Support <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      subject: `[Support] ${subject}`,
      replyTo: email,
      text,
    });
    // Send confirmation to user
    await resend.emails.send({
      from: `Blawby Support <${SUPPORT_EMAIL}>`,
      to: email,
      subject: `We received your support request: ${subject}`,
      text: `Hi${name ? ` ${name}` : ""},\n\nThank you for contacting Blawby support! We have received your request and will get back to you as soon as possible.\n\nHere is a copy of your message:\n\nSubject: ${subject}\n${description}\n\nIf you have any additional information, just reply to this email.\n\nBest,\nThe Blawby Team`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
} 