import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  return (
    <section className="border-t bg-muted/30">
      <div className="container py-20 md:py-32 mx-auto">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
            Stay Updated
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Subscribe to our newsletter for study tips, feature updates, and
            special offers.
          </p>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-12"
            />
            <Button type="submit" size="lg">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
