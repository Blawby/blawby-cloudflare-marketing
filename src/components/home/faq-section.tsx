"use client";

import { HOME_FAQS } from "@/data/home/faq";
import { useState } from "react";
import { SectionLabel } from "./section-label";

export function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="container section-faq" id="faq">
      <SectionLabel num="08">Frequently asked</SectionLabel>
      <h2 className="display h2">
        Common objections, <em>answered.</em>
      </h2>
      <div className="faq-list">
        {HOME_FAQS.map((f, i) => (
          <div
            key={f.question}
            className={"faq-item " + (open === i ? "is-open" : "")}
          >
            <button
              type="button"
              className="faq-q-row"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              aria-controls={`faq-panel-${i}`}
            >
              <span className="mono faq-num">Q.0{i + 1}</span>
              <span className="faq-q display">{f.question}</span>
              <span className="faq-toggle mono" aria-hidden="true">
                {open === i ? "—" : "+"}
              </span>
            </button>
            <div
              className="faq-a-wrap"
              id={`faq-panel-${i}`}
              role="region"
              aria-hidden={open !== i}
            >
              <div className="faq-a">{f.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
