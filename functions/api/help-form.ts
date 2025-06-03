import { Resend } from 'resend';

export const onRequestPost = async (context: any) => {
  const SUPPORT_EMAIL = "paulchrisluke@gmail.com";
  try {
    const { name, email, subject, description } = await context.request.json();
    if (!email || !subject || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address." }), { status: 400 });
    }
    const resend = new Resend(context.env.RESEND_API_KEY);
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
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Support form error:", err);
    return new Response(JSON.stringify({ error: "Failed to send message." }), { status: 500 });
  }
}; 