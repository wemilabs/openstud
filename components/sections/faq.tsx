import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the free trial work?",
    answer:
      "You can try OpenStud free for 14 days with full access to all Pro features. No credit card required. At the end of the trial, you can choose to upgrade or continue with the free plan.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security measures to protect your data. Your study materials and personal information are completely private and secure.",
  },
  {
    question: "Can I collaborate with other students?",
    answer:
      "Yes! Pro and Ultimate plans include collaboration features that let you share notes, create study groups, and work together with classmates.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up for a free account. We made the app simple and intuitive so you can start using it right away. No bunch of garbage functionalities. Only the best and essential. No need for any tutorials. You can navigate the app as you think.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container py-20 mx-auto">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
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
