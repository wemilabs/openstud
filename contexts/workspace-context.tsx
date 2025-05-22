"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getWorkspaces } from "@/lib/actions/workspaces";

// Define the workspace type
export type Workspace = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: Date;
  updatedAt: Date;
};

// Special workspace for individual/personal space
export const INDIVIDUAL_WORKSPACE: Workspace = {
  id: "individual",
  name: "Individual",
  role: "OWNER",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Context type
type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
};

// Create the context with default values
const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [INDIVIDUAL_WORKSPACE],
  currentWorkspace: INDIVIDUAL_WORKSPACE,
  isLoading: false,
  error: null,
  setCurrentWorkspace: () => {},
  refreshWorkspaces: async () => {},
});

// Provider component
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    INDIVIDUAL_WORKSPACE,
  ]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace>(INDIVIDUAL_WORKSPACE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch workspaces
  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getWorkspaces();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        // Always include the individual workspace first
        const allWorkspaces = [INDIVIDUAL_WORKSPACE, ...result.data];
        setWorkspaces(allWorkspaces);

        // If no current workspace is set, use the individual workspace
        if (!currentWorkspace || currentWorkspace.id === "individual") {
          setCurrentWorkspace(INDIVIDUAL_WORKSPACE);
        } else {
          // Make sure the current workspace still exists in the updated list
          const stillExists = allWorkspaces.find(
            (w) => w.id === currentWorkspace.id
          );
          if (!stillExists) {
            setCurrentWorkspace(INDIVIDUAL_WORKSPACE);
          }
        }
      }
    } catch (err) {
      setError("Failed to fetch workspaces");
      console.error("Error fetching workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch workspaces on initial load
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Get workspace from localStorage on initial load
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");

    if (savedWorkspaceId && workspaces.length > 0) {
      const savedWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace);
      }
    }
  }, [workspaces]);

  // Save current workspace to localStorage when it changes
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem("currentWorkspaceId", currentWorkspace.id);
    }
  }, [currentWorkspace]);

  // Context value
  const value = {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces: fetchWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// Custom hook to use the workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
