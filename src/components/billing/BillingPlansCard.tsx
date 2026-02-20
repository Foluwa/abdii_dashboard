"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { useBillingPlans } from "@/hooks/useApi";
import type { BillingPlan } from "@/types/api";
import { ChevronDownIcon } from "@/icons";

function PlanDetails({ plan }: { plan: BillingPlan }) {
  return (
    <div className="pt-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium text-gray-700 dark:text-white/80">Apple</div>
          <div className="font-mono break-all">{plan.apple_product_id || "—"}</div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium text-gray-700 dark:text-white/80">Google</div>
          <div className="font-mono break-all">{plan.google_product_id || "—"}</div>
          <div className="font-mono break-all">{plan.google_base_plan_id || "—"}</div>
        </div>
      </div>

      {plan.features?.length ? (
        <ul className="mt-3 list-disc pl-5 text-xs text-gray-600 dark:text-gray-300 space-y-1">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function BillingPlansCard() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const billingCountryCode = (process.env.NEXT_PUBLIC_BILLING_COUNTRY_CODE || "").trim().toUpperCase();
  const { plans, isLoading, isError, refresh } = useBillingPlans(billingCountryCode || undefined);
  const countrySuffix = billingCountryCode ? `?country_code=${encodeURIComponent(billingCountryCode)}` : "";
  const plansUrl = `${apiBaseUrl}/api/v1/billing/plans${countrySuffix}`;

  const [expandedPlanId, setExpandedPlanId] = React.useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Billing Plans
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live from <span className="font-mono break-all">{plansUrl}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-[160px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-[160px] text-red-500">
            Failed to load billing plans
          </div>
        ) : plans.length === 0 ? (
          <div className="flex items-center justify-center h-[160px]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No billing plans returned by the API.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.plan_id;
              const detailsId = `billing-plan-${plan.plan_id}`;

              return (
                <div
                  key={plan.plan_id}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.plan_id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {plan.name}
                        </div>
                        {plan.is_popular && (
                          <Badge size="sm" color="primary">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-white/80">{plan.plan_id}</span>
                        {plan.billing_period ? ` • ${plan.billing_period}` : ""}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {plan.price_display}
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div id={detailsId}>
                      <PlanDetails plan={plan} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
