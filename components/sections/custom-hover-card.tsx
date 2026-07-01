import { Globe } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Icons } from "@/components/icons";

export function CustomHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">a student</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEItcjH8NfMhVmKxAzk0snGS3pR2rOLb8tZ1UHu" />
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-semibold">
              @mthlish{" "}
              <a
                href="https://x.com/mthlish"
                className="hover:text-white/70 transition inline-flex items-center ml-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.XSocial />
              </a>
            </h4>
            <p className="text-sm">
              Hey, Lisham out here – creator and maintainer of OpenStud.
            </p>
            <div className="flex items-center pt-2">
              <Globe className="mr-2 size-4 opacity-70" />{" "}
              <span className="text-xs text-muted-foreground">
                Reach out{" "}
                <a
                  href="https://lisham.dev/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary bg-clip-text font-medium"
                >
                  here
                </a>
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
