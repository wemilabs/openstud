import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is OpenStud?",
    answer:
      "OpenStud is a comprehensive study management platform designed to help students organize their learning process, track progress, and improve their academic performance through smart features and analytics.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "You can try OpenStud free for 14 days with full access to all Pro features. No credit card required. At the end of the trial, you can choose to upgrade or continue with the free plan.",
  },
  {
    question: "Can I use OpenStud for multiple subjects?",
    answer:
      "Yes! The free plan allows up to 3 subjects, while Pro and Team plans offer unlimited subjects. Each subject can have its own study plan, resources, and progress tracking.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security measures to protect your data. Your study materials and personal information are completely private and secure.",
  },
  {
    question: "Can I collaborate with other students?",
    answer:
      "Yes! Pro and Team plans include collaboration features that let you share notes, create study groups, and work together with classmates.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up for a free account, choose your subjects, and start organizing your study materials. Our onboarding process will guide you through setting up your first study plan.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container py-20 md:py-32">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Frequently Asked Questions
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Find answers to common questions
        </p>
      </div>
      <div className="mx-auto max-w-[700px] mt-16 px-6 md:px-0">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
