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
      "You can start with our 14-day free trial, with full access to all Pro features. No credit card required. At the end of the trial, you can choose to upgrade or continue with the free plan.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security measures to protect your data. Your study materials and personal information are completely private and secure.",
  },
  {
    question: "Who can use OpenStud?",
    answer:
      "From students to teachers, researchers to supervisors, and professionals: OpenStud is a platform for everyone who needs to work on academic projects.",
  },
  {
    question: "Can I collaborate with other students?",
    answer:
      "Not only can you collaborate with other students, but also with teachers and supervisors. With our seamless `Workspace` feature, you can work on your projects with others in real-time. Assignments, exams, presentations, lab work, reading, projects, study sessions, and other academic work can be done within the platform.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up for a free account. We made the app simple and intuitive so you can start using it right away. No bunch of garbage functionalities. Only the best and essential. No need for any tutorials. You can navigate the app as you think.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container pt-32 pb-20 mx-auto">
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
