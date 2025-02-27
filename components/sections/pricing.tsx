import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out OpenStud",
    price: "0",
    features: [
      "Basic study planning",
      "Limited progress tracking",
      "Up to 3 subjects",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Pro",
    description: "For serious students",
    price: "9.99",
    features: [
      "Advanced study planning",
      "Unlimited progress tracking",
      "Unlimited subjects",
      "Advanced analytics",
      "Priority support",
      "Focus mode",
      "Study groups",
      "Custom templates",
    ],
  },
  {
    name: "Team",
    description: "For study groups & classes",
    price: "19.99",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Shared resources",
      "Team analytics",
      "Admin controls",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="pt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the perfect plan for your study needs
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-y-8 sm:gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ring-1 ring-muted/10 ${
                plan.name === "Pro"
                  ? "relative bg-primary text-primary-foreground lg:scale-105"
                  : "bg-card"
              }`}
            >
              <h3 className="text-lg font-semibold leading-8">{plan.name}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">
                  ${plan.price}
                </span>
                <span className="text-sm font-semibold leading-6">/month</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm leading-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-5 w-5 flex-none" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.name === "Pro" ? "secondary" : "default"}
                size="lg"
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
