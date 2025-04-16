"use client";

import { useLinkStatus } from "next/link";
import { Icons } from "@/components/icons";

export default function LoadingIndicator() {
  const { pending } = useLinkStatus();

  return pending ? (
    <Icons.spinner className="size-4 animate-spin ml-1" />
  ) : null;
}
