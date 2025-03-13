"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getWorkspaceInvitations,
  deleteWorkspaceInvitation,
} from "@/actions/workspace-invitations";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TeamRole } from "@prisma/client";

// Helper to get role badge color
const getRoleBadgeVariant = (role: TeamRole) => {
  switch (role) {
    case "OWNER":
      return "destructive";
    case "ADMIN":
      return "default";
    case "MEMBER":
      return "secondary";
    default:
      return "outline";
  }
};

interface PendingInvitationsProps {
  teamId: string;
}

export function PendingInvitations({ teamId }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Fetch invitations on component mount and when teamId changes
  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true);
      try {
        const result = await getWorkspaceInvitations(teamId);
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          setInvitations(result.data);
        }
      } catch (error) {
        console.error("Error fetching invitations:", error);
        toast.error("Failed to load invitations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitations();
  }, [teamId]);

  // Handle invitation deletion
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteWorkspaceInvitation(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation deleted successfully");
        // Remove the deleted invitation from the state
        setInvitations((prev) => prev.filter((inv) => inv.id !== deleteId));
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Handle copying invite link to clipboard
  const copyToClipboard = async (token: string) => {
    const inviteLink = `${
      process.env.NEXT_PUBLIC_APP_URL! || "http://localhost:3000"
    }/workspaces/invite/${token}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedMap((prev) => ({ ...prev, [token]: true }));
      toast.success("Invitation link copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [token]: false }));
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage invitations to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage invitations to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No pending invitations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>Manage invitations to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(invitation.role)}>
                    {invitation.role.charAt(0) +
                      invitation.role.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(invitation.expires), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {invitation.maxUses === null ? (
                    <span className="text-sm text-muted-foreground">
                      Unlimited
                    </span>
                  ) : (
                    <span className="text-sm">
                      {invitation.usedCount} / {invitation.maxUses}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(invitation.token)}
                    >
                      {copiedMap[invitation.token] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this invitation?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-muted dark:text-primary hover:bg-destructive/90"
                          >
                            {isDeleting && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
