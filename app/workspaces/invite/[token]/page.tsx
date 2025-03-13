"use client";

import { useParams } from "next/navigation";
import { InvitationClient } from "./invitation-client";

export default function InvitePage() {
  // Use the useParams hook to access the token
  const params = useParams();
  const token = Array.isArray(params.token) 
    ? params.token[0] 
    : (params.token as string);

  return <InvitationClient token={token} />;
}
