"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Loader2 } from "lucide-react";

export function CourseSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const [isSearching, setIsSearching] = useState(false);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Don't trigger search if value is empty and there was no previous search
    if (!debouncedValue && !searchParams.get("search")) return;

    setIsSearching(true);

    const params = new URLSearchParams(searchParams);
    if (debouncedValue) {
      params.set("search", debouncedValue);
      params.set("page", "1"); // Reset to first page on new search
    } else {
      params.delete("search");
    }

    // Use setTimeout to simulate network delay for a better UX
    const timeoutId = setTimeout(() => {
      router.push(`?${params.toString()}`);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [debouncedValue, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search courses..."
        className="w-full pl-9 pr-9"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
