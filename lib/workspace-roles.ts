export const WorkspaceRoles = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

// This union type exactly mirrors our Prisma enum:
export type WorkspaceRole = keyof typeof WorkspaceRoles;
