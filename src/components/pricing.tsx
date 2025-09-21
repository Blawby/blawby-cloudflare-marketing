import { CheckmarkIcon } from "@/icons/checkmark-icon";
import React from "react";
import { Button } from "./button";
import { PaymentMethods } from "./payment-methods";

export function Pricing({
  price,
  error,
}: {
  price: number;
  error?: string | null;
}) {
  const includedFeatures = [
    "IOLTA compliance",
    "PCI compliance ($150 value)",
    "Debit, credit, and ACH/Bank Transfer payment types",
    "Billing and invoicing",
  ];

  // Format price as $40, $99, etc.
  const formattedPrice = `$${price}`;

  return (
    <div className="relative mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none dark:ring-white/10">
      <div className="p-8 sm:p-10 lg:flex-auto">
        <h3 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
          Standard
        </h3>
        <p className="text-base mt-6 text-base leading-7 font-bold text-gray-700 dark:text-gray-300">
          Cards and wallets - 2.9% + 30¢ per successful charge
        </p>
        <p className="text-base mt-2 text-base leading-7 text-gray-700 dark:text-gray-300">
          Integrated per-transaction pricing means no setup fees. The price is
          the same for all cards and digital wallets. Accept large payments or
          recurring charges securely with ACH debit or ACH credit.
        </p>
        {/* Payment Logos */}
        <div className="mt-8">
          <PaymentMethods />
        </div>
        <div className="mt-10 flex items-center gap-x-4">
          <h4 className="flex-none text-sm leading-6 font-semibold text-gray-950 dark:text-white">
            What's included
          </h4>
          <div className="h-px flex-auto bg-gray-100 dark:bg-white/10" />
        </div>
        <ul
          role="list"
          className="text-base mt-8 grid grid-cols-1 gap-4 text-sm leading-6 sm:grid-cols-2 sm:gap-6"
        >
          {includedFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-x-3">
              <CheckmarkIcon
                className="h-6 w-5 flex-none text-gray-950 dark:text-white"
                aria-hidden="true"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
        <div className="rounded-2xl py-10 text-center ring-1 ring-gray-200 ring-inset lg:flex lg:flex-col lg:justify-center lg:py-16 dark:ring-white/10">
          <div className="mx-auto max-w-xs px-8">
            <p className="text-base text-base font-semibold text-gray-700 dark:text-gray-300">
              Pay monthly, love forever
            </p>
            <p className="mt-6 mb-4 flex items-end justify-center gap-x-2">
              <span className="text-5xl font-bold tracking-tight text-gray-950 dark:text-white">
                {formattedPrice}
              </span>
              <span className="text-sm leading-6 font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                /month
              </span>
            </p>
            <Button
              href="https://app.blawby.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Get access
            </Button>
            <p className="text-base mt-6 text-xs leading-5 text-gray-700 dark:text-gray-300">
              +Applicable fees{" "}
              <span className="text-gray-950 dark:text-white">
                <a href="/pricing#pricingDetail">Learn More</a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
