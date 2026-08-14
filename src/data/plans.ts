export type Plan = {
  id: string;
  name: string;
  price: string;
  /** Fraction taken off add-on prices, e.g. 0.15 = 15% off. */
  discount: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

/**
 * PLACEHOLDER — pricing, features and discount rates are all invented for the
 * demo and need replacing with real numbers before anything ships.
 *
 * The subscription is a recurring cost and is deliberately kept separate from
 * the one-off add-on total; a plan's only effect on the order is `discount`.
 */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    discount: 0.05,
    tagline: "One core module, solo deployment",
    features: ["Single dwelling module", "Standard build queue", "Community support"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "$89/mo",
    discount: 0.15,
    tagline: "The full dwelling, ready to move in",
    features: [
      "Full multi-zone dwelling",
      "Priority build queue",
      "Live chat support",
      "1 free reconfiguration",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$149/mo",
    discount: 0.25,
    tagline: "Full customization, priority everything",
    features: [
      "Everything in Standard",
      "Unlimited reconfigurations",
      "Dedicated engine specialist",
      "Expedited delivery",
    ],
  },
];

export const findPlan = (id: string | null) => PLANS.find((p) => p.id === id) ?? null;

/**
 * Single source of truth for what a plan does to an order, so the order
 * summary and the payment panel can never disagree about the price.
 */
export function applyPlanDiscount(
  totals: { subtotal: number; tax: number; total: number; dueToday: number },
  planId: string | null,
  depositRate: number,
) {
  const plan = findPlan(planId);
  const discount = plan ? Math.round(totals.subtotal * plan.discount) : 0;
  const total = totals.total - discount;
  return { ...totals, discount, total, dueToday: Math.round(total * depositRate) };
}

/** Highest discount on offer — used to tease the saving before a plan is picked. */
export const MAX_DISCOUNT = Math.max(...PLANS.map((p) => p.discount));
