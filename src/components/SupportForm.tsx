"use client";

import { useState } from "react";
import { TextInput } from "@/components/input";
import { Button } from "@/components/button";

export function SupportForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", description: "" });
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/help-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", description: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto px-4 py-12">
      <div className="bg-white/90 shadow-sm rounded-2xl border border-gray-950/10 dark:bg-gray-950/90 dark:border-white/10 p-8">
        <h2 className="text-2xl/7 font-medium tracking-tight text-pretty text-gray-950 dark:text-white mb-6">
          Contact Support
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextInput
            placeholder="Your Name (optional)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            name="name"
            autoComplete="name"
          />
          <TextInput
            placeholder="Your Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <TextInput
            placeholder="Subject"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            name="subject"
            required
          />
          <textarea
            className="block w-full rounded-2xl border border-gray-950/10 bg-white/75 px-4 py-2 text-base/7 text-gray-950 shadow-sm backdrop-blur-sm placeholder:text-gray-500 focus:outline-2 focus:outline-gray-950/20 dark:bg-gray-950/75 dark:text-white dark:placeholder:text-gray-500 dark:border-white/10 dark:focus:outline-white/20"
            placeholder="Describe your issue"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            name="description"
            rows={5}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-x-2 rounded-full bg-gray-950 px-3 py-0.5 text-sm/7 font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {loading ? "Sending..." : "Send"}
          </Button>
          {status === "success" && <p className="text-base/7 text-green-600 mt-2">Your message has been sent!</p>}
          {status === "error" && <p className="text-base/7 text-red-600 mt-2">There was an error sending your message. Please try again.</p>}
        </form>
      </div>
    </div>
  );
} 