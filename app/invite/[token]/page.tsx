import { InvitationClient } from "./invitation-client";

export default function InvitePage(props: any) {
  const { token } = props.params;

  return <InvitationClient token={token} />;
}
