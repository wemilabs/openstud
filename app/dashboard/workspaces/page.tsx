"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useWorkspace,
  INDIVIDUAL_WORKSPACE,
} from "@/contexts/workspace-context";
import {
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  deleteWorkspace,
} from "@/lib/actions/workspaces";
import { WorkspaceRoles, type WorkspaceRole } from "@/lib/workspace-roles";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  MoreHorizontal,
  Shield,
  Trash,
  User,
  Users,
} from "lucide-react";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { PendingInvitations } from "@/components/workspace/pending-invitations";

type Member = {
  id: string;
  role: WorkspaceRole;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  workspaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export default function WorkspacesPage() {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workspaceToDeleteId, setWorkspaceToDeleteId] = useState("");

  // Skip individual workspace
  const workspaceList = workspaces.filter(
    (w) => w.id !== INDIVIDUAL_WORKSPACE.id
  );

  // Fetch workspace members
  const fetchMembers = useCallback(async () => {
    if (currentWorkspace.id === INDIVIDUAL_WORKSPACE.id) return;

    setIsLoadingMembers(true);
    try {
      const result = await getWorkspaceMembers(currentWorkspace.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setMembers((result.data || []) as Member[]);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      toast.error("Failed to fetch workspace members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentWorkspace.id]);

  // Fetch members when current workspace changes
  useEffect(() => {
    if (currentWorkspace.id !== INDIVIDUAL_WORKSPACE.id) {
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [currentWorkspace.id, fetchMembers]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      const result = await removeWorkspaceMember(currentWorkspace.id, memberId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Member removed successfully");
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: WorkspaceRole
  ) => {
    try {
      const result = await updateWorkspaceMemberRole(
        currentWorkspace.id,
        memberId,
        newRole
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Member role updated successfully");
      fetchMembers();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role");
    }
  };

  const handleDeleteWorkspace = async () => {
    // The workspace to delete is the one that was clicked on, not necessarily the current workspace
    const workspaceToDelete = workspaces.find(
      (w) => w.id === workspaceToDeleteId
    );

    if (!workspaceToDelete) {
      toast.error("Workspace not found");
      setIsDeleteDialogOpen(false);
      return;
    }

    if (workspaceToDelete.id === INDIVIDUAL_WORKSPACE.id) {
      toast.error("You cannot delete your individual workspace");
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteWorkspace(workspaceToDelete.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Workspace deleted successfully");
      setIsDeleteDialogOpen(false);

      // If we deleted the current workspace, switch to individual workspace
      if (currentWorkspace.id === workspaceToDelete.id) {
        setCurrentWorkspace(INDIVIDUAL_WORKSPACE);
      }

      await refreshWorkspaces();
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRoles.OWNER:
        return <Crown className="size-4 text-yellow-500" />;
      case WorkspaceRoles.ADMIN:
        return <Shield className="size-4 text-blue-500" />;
      case WorkspaceRoles.MEMBER:
        return <User className="size-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-muted-foreground">
          Manage your workspaces and members
        </p>
      </div>

      <Tabs defaultValue="workspaces" className="w-full">
        <TabsList>
          <TabsTrigger value="workspaces">My Workspaces</TabsTrigger>
          {currentWorkspace.id !== INDIVIDUAL_WORKSPACE.id && (
            <TabsTrigger value="members">Members</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="workspaces" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Individual Workspace Card */}
            <Card
              className={
                currentWorkspace.id === INDIVIDUAL_WORKSPACE.id
                  ? "border-primary"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Individual
                </CardTitle>
                <CardDescription>Your personal workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is your personal workspace for individual study and
                  tasks.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant={
                    currentWorkspace.id === INDIVIDUAL_WORKSPACE.id
                      ? "secondary"
                      : "outline"
                  }
                  className="w-full"
                  onClick={() => setCurrentWorkspace(INDIVIDUAL_WORKSPACE)}
                >
                  {currentWorkspace.id === INDIVIDUAL_WORKSPACE.id
                    ? "Current"
                    : "Switch"}
                </Button>
              </CardFooter>
            </Card>

            {/* Workspaces Cards */}
            {workspaceList.map((workspace) => (
              <Card
                key={workspace.id}
                className={
                  currentWorkspace.id === workspace.id ? "border-primary" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="size-5" />
                      {workspace.name}
                    </CardTitle>
                    {workspace.role === WorkspaceRoles.OWNER && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {workspace.id !== INDIVIDUAL_WORKSPACE.id && (
                            <AlertDialog
                              open={isDeleteDialogOpen}
                              onOpenChange={setIsDeleteDialogOpen}
                            >
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setWorkspaceToDeleteId(workspace.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 size-4" />
                                  Delete Workspace
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the workspace and all
                                    associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteWorkspace}
                                    disabled={isDeleting}
                                    className="bg-destructive text-muted dark:text-primary hover:bg-destructive/90"
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardDescription>
                    {workspace.role === WorkspaceRoles.OWNER
                      ? "You are the owner"
                      : workspace.role === WorkspaceRoles.ADMIN
                      ? "You are an admin"
                      : "You are a member"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Collaborate with your members on shared projects and
                    assignments.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={
                      currentWorkspace.id === workspace.id
                        ? "secondary"
                        : "outline"
                    }
                    className="w-full"
                    onClick={() => setCurrentWorkspace(workspace)}
                  >
                    {currentWorkspace.id === workspace.id
                      ? "Current"
                      : "Switch"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {currentWorkspace.id !== INDIVIDUAL_WORKSPACE.id && (
          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentWorkspace.name} - Members
              </h2>

              {(currentWorkspace.role === WorkspaceRoles.OWNER ||
                currentWorkspace.role === WorkspaceRoles.ADMIN) && (
                <InviteMemberDialog workspaceId={currentWorkspace.id} />
              )}
            </div>

            <Separator />

            {/* Pending Invitations Section */}
            {(currentWorkspace.role === WorkspaceRoles.OWNER ||
              currentWorkspace.role === WorkspaceRoles.ADMIN) && (
              <PendingInvitations workspaceId={currentWorkspace.id} />
            )}

            {/* Current Members Section */}
            <Card>
              <CardHeader>
                <CardTitle>Current Members</CardTitle>
                <CardDescription>
                  People with access to this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">No members found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        {(currentWorkspace.role === WorkspaceRoles.OWNER ||
                          currentWorkspace.role === WorkspaceRoles.ADMIN) && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="flex items-center gap-2">
                            <Avatar className="size-8">
                              {member.user.image ? (
                                <AvatarImage
                                  src={member.user.image}
                                  alt={member.user.name || ""}
                                />
                              ) : (
                                <AvatarFallback>
                                  {getUserInitials(member.user.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              <span>{member.role}</span>
                            </div>
                          </TableCell>
                          {(currentWorkspace.role === WorkspaceRoles.OWNER ||
                            currentWorkspace.role === WorkspaceRoles.ADMIN) && (
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* Role management (owners only) */}
                                  {currentWorkspace.role ===
                                    WorkspaceRoles.OWNER && (
                                    <>
                                      <DropdownMenuItem
                                        disabled={
                                          member.role === WorkspaceRoles.OWNER
                                        }
                                        onClick={() =>
                                          handleUpdateMemberRole(
                                            member.id,
                                            WorkspaceRoles.OWNER
                                          )
                                        }
                                      >
                                        <Crown className="mr-2 size-4" />
                                        Make Owner
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        disabled={
                                          member.role === WorkspaceRoles.ADMIN
                                        }
                                        onClick={() =>
                                          handleUpdateMemberRole(
                                            member.id,
                                            WorkspaceRoles.ADMIN
                                          )
                                        }
                                      >
                                        <Shield className="mr-2 size-4" />
                                        Make Admin
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        disabled={
                                          member.role === WorkspaceRoles.MEMBER
                                        }
                                        onClick={() =>
                                          handleUpdateMemberRole(
                                            member.id,
                                            WorkspaceRoles.MEMBER
                                          )
                                        }
                                      >
                                        <User className="mr-2 size-4" />
                                        Make Member
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}

                                  {/* Remove member (owners can remove anyone, admins can remove members) */}
                                  {(currentWorkspace.role ===
                                    WorkspaceRoles.OWNER ||
                                    (currentWorkspace.role ===
                                      WorkspaceRoles.ADMIN &&
                                      member.role ===
                                        WorkspaceRoles.MEMBER)) && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        handleRemoveMember(member.id)
                                      }
                                    >
                                      <Trash className="mr-2 size-4" />
                                      Remove
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
