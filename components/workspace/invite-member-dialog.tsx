"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TeamRole } from "@prisma/client";
import { toast } from "sonner";
import { createWorkspaceInvitation } from "@/actions/workspace-invitations";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Copy, Check } from "lucide-react";

// Form schema for invitation
const inviteFormSchema = z.object({
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  maxUses: z
    .union([z.number().int().min(1).max(100), z.literal(null)])
    .default(null),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteMemberDialogProps {
  teamId: string;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({
  teamId,
  trigger,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form with default values
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      role: TeamRole.MEMBER,
      expiresInDays: 7,
      maxUses: null,
    },
  });

  // Handle form submission
  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true);
    try {
      const result = await createWorkspaceInvitation(teamId, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        toast.success("Invitation created successfully");
      } else if (result.data) {
        // If we have data but no inviteLink, construct it
        setInviteLink(
          `${
            process.env.NEXT_PUBLIC_APP_URL! || "http://localhost:3000"
          }/invite/${result.data.token}`
        );
        toast.success("Invitation created successfully");
      }
    } catch (error) {
      toast.error("Failed to create invitation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copying invite link to clipboard
  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invitation link copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Reset form and state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setInviteLink(null);
      setCopied(false);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create universal invitation link</DialogTitle>
          <DialogDescription>
            Generate a link that can be shared with anyone to join your
            workspace.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                        <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={TeamRole.OWNER}>Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role determines what permissions the user will have.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires in (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      The invitation will expire after this many days.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max uses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Unlimited"
                        // Convert null to empty string for the input
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          // Convert empty string back to null, or parse as integer
                          const value =
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited uses or set a specific number of
                      times the invitation can be used.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Invitation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Invitation Link</p>
              <div className="flex items-center space-x-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={copied}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with the person you want to invite. They will
                need to be logged in to accept the invitation.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInviteLink(null);
                  form.reset();
                }}
              >
                Create Another
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
