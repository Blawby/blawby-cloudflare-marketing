"use client";

import { useState } from "react";
import { Button } from "./button";

const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ??
  "https://compass-ts.paulchrisluke.workers.dev";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus({
        kind: "error",
        message: "Please fill in your name, email, and message.",
      });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch(`${WORKER_URL}/api/help-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      form.reset();
      setStatus({ kind: "success" });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-10 flex flex-col gap-y-5 rounded-2xl border border-rule bg-paper p-6 sm:p-8"
      aria-label="Contact form"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name">
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="block w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </Field>
      </div>
      <Field label="How can we help?" htmlFor="contact-message">
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className="block w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          placeholder="Tell us a bit about your firm and what you're trying to solve."
        />
      </Field>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-dim">
          We'll reply by email — usually within one business day.
        </p>
        <Button type="submit" disabled={status.kind === "submitting"}>
          {status.kind === "submitting" ? "Sending…" : "Send message"}
        </Button>
      </div>

      <div aria-live="polite" className="min-h-[1.25rem] text-sm">
        {status.kind === "success" && (
          <span style={{ color: "var(--pos)" }}>
            Thanks — we got your message and sent you a confirmation email.
          </span>
        )}
        {status.kind === "error" && (
          <span style={{ color: "var(--neg)" }}>{status.message}</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
