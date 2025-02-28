"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      onClick={() => router.back()}
      className="cursor-pointer"
    >
      <ArrowLeft className="size-4" />
      Previous
    </Button>
  );
}
