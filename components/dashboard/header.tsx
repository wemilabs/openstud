"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/layout/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RightSideMenu } from "@/components/dashboard/right-side-menu";
import { Icons } from "@/components/icons";
import {
  useWorkspace,
  INDIVIDUAL_WORKSPACE,
} from "@/contexts/workspace-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace } from "@/actions/workspaces";
import { toast } from "sonner";

const academicYears = [
  {
    value: "2024-2025",
    label: "2024-2025",
  },
  {
    value: "2025-2026",
    label: "2025-2026",
  },
  {
    value: "2026-2027",
    label: "2026-2027",
  },
  {
    value: "2027-2028",
    label: "2027-2028",
  },
];

const semesters = [
  {
    value: "semester-one",
    label: "Semester 1",
  },
  {
    value: "semester-two",
    label: "Semester 2",
  },
  {
    value: "semester-three",
    label: "Semester 3",
  },
  {
    value: "semester-four",
    label: "Semester 4",
  },
  {
    value: "semester-five",
    label: "Semester 5",
  },
  {
    value: "semester-six",
    label: "Semester 6",
  },
];

export function DashboardHeader() {
  const { data: session } = useSession();
  const user = session?.user;
  const [openTeam, setOpenTeam] = useState(false);
  const [openAcademicYear, setOpenAcademicYear] = useState(false);
  const [openSemester, setOpenSemester] = useState(false);
  const [openCreateWorkspace, setOpenCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const [academicYearValue, setAcademicYearValue] = useState("");
  const [semesterValue, setSemesterValue] = useState("");

  // Use the workspace context
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    refreshWorkspaces,
    isLoading,
  } = useWorkspace();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const result = await createWorkspace({ name: newWorkspaceName.trim() });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.data) {
        toast.success("Workspace created successfully");
        setNewWorkspaceName("");
        // Only close the dialog after successful creation
        setTimeout(() => {
          setOpenCreateWorkspace(false);
          // Refresh workspaces after dialog is closed
          setTimeout(() => {
            refreshWorkspaces();
          }, 100);
        }, 500);
      } else {
        toast.error("Failed to create workspace: No response data");
      }
    } catch (error) {
      let errorMessage = "Failed to create workspace";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Get initials from user name for avatar fallback
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  // Get badge text for current workspace
  const getWorkspaceBadge = (workspace: typeof currentWorkspace) => {
    if (workspace.id === INDIVIDUAL_WORKSPACE.id) {
      return "Ind";
    }
    // Get first letter of each word in workspace name
    return workspace.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center px-2 py-4 md:px-8 md:py-6 max-w-full">
        {/* Logo and Navigation */}
        <div className="flex items-center">
          <Logo
            href="/dashboard"
            className="hidden md:flex items-center px-4"
          />
          <RightSideMenu className="md:hidden mx-2 cursor-pointer" />

          {/* Divider slash */}
          <span className="hidden md:block font-thin text-2xl text-muted-foreground">
            /
          </span>

          {/* Workspace selector */}
          <Popover open={openTeam} onOpenChange={setOpenTeam}>
            <PopoverTrigger asChild className="hidden md:flex">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openTeam}
                className="justify-between border-none shadow-none"
              >
                <Badge
                  variant="outline"
                  className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5"
                >
                  {getWorkspaceBadge(currentWorkspace)}
                </Badge>
                {currentWorkspace.name}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search workspace..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No workspace found.</CommandEmpty>
                  <CommandGroup heading="Your Workspaces">
                    {workspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        value={workspace.id}
                        onSelect={() => {
                          setCurrentWorkspace(workspace);
                          setOpenTeam(false);
                        }}
                      >
                        {workspace.name}
                        <Check
                          className={cn(
                            "ml-auto",
                            workspace.id === currentWorkspace.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        // Close the team popover first
                        setOpenTeam(false);

                        // Use setTimeout to ensure the team popover is fully closed
                        setTimeout(() => {
                          // Then open the create workspace dialog
                          setOpenCreateWorkspace(true);
                        }, 150);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Workspace
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Separate Dialog for creating workspace */}
          <Dialog
            open={openCreateWorkspace}
            onOpenChange={(open) => {
              // Only allow closing if we're not in the middle of creating a workspace
              if (!isCreatingWorkspace || !open) {
                setOpenCreateWorkspace(open);
              }
            }}
          >
            <DialogContent
              onPointerDownOutside={(e) => {
                // Prevent closing when clicking outside if creating workspace
                if (isCreatingWorkspace) {
                  e.preventDefault();
                }
              }}
              onInteractOutside={(e) => {
                // Prevent any outside interaction while creating
                if (isCreatingWorkspace) {
                  e.preventDefault();
                }
              }}
              className="sm:max-w-[425px]"
            >
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace for your team or project.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isCreatingWorkspace && newWorkspaceName.trim()) {
                    handleCreateWorkspace();
                  }
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isCreatingWorkspace &&
                          newWorkspaceName.trim()
                        ) {
                          e.preventDefault();
                          handleCreateWorkspace();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenCreateWorkspace(false);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                  >
                    {isCreatingWorkspace ? "Creating..." : "Create Workspace"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Divider slash */}
          {/* <span className="hidden md:block font-thin text-2xl text-muted-foreground">
            /
          </span> */}

          {/* Academic year selector */}
          {/* <Popover open={openAcademicYear} onOpenChange={setOpenAcademicYear}>
            <PopoverTrigger asChild className="hidden md:flex">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openAcademicYear}
                className="justify-between border-none shadow-none"
              >
                <Badge
                  variant="outline"
                  className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5"
                >
                  AY
                </Badge>
                {academicYearValue
                  ? academicYears.find(
                      (year) => year.value === academicYearValue
                    )?.label
                  : "2024-2025"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search academic year..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No academic year found.</CommandEmpty>
                  <CommandGroup>
                    {academicYears.map((year) => (
                      <CommandItem
                        key={year.value}
                        value={year.value}
                        onSelect={(currentValue) => {
                          setAcademicYearValue(
                            currentValue === academicYearValue
                              ? ""
                              : currentValue
                          );
                          setOpenAcademicYear(false);
                        }}
                      >
                        {year.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            year.value === academicYearValue
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover> */}

          {/* Divider slash */}
          {/* <span className="hidden md:block font-thin text-2xl text-muted-foreground">
            /
          </span> */}

          {/* Semester selector */}
          {/* <Popover open={openSemester} onOpenChange={setOpenSemester}>
            <PopoverTrigger asChild className="hidden md:flex">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSemester}
                className="justify-between border-none shadow-none"
              >
                <Badge
                  variant="outline"
                  className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5"
                >
                  S
                </Badge>
                {semesterValue
                  ? semesters.find(
                      (semester) => semester.value === semesterValue
                    )?.label
                  : "Semester 1"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search semester..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No semester found.</CommandEmpty>
                  <CommandGroup>
                    {semesters.map((semester) => (
                      <CommandItem
                        key={semester.value}
                        value={semester.value}
                        onSelect={(currentValue) => {
                          setSemesterValue(
                            currentValue === semesterValue ? "" : currentValue
                          );
                          setOpenSemester(false);
                        }}
                      >
                        {semester.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            semester.value === semesterValue
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover> */}
        </div>

        {/* Right side controls */}
        <div className="flex flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer"
          >
            <Bell className="size-4" />
            {/* <Badge
              variant="secondary"
              className="absolute right-1 top-0 h-4 w-4 p-0"
            >
              0
            </Badge> */}
          </Button>

          <Link
            href="/docs/introduction"
            className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground h-8 px-3 has-[>svg]:px-2.5"
          >
            <Icons.help className="size-4" />
          </Link>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="ghost" className="relative flex items-center">
                <Avatar className="size-8">
                  {user?.image ? (
                    <div className="relative aspect-square h-full w-full">
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        className="rounded-full object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    </div>
                  ) : (
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "Guest"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
