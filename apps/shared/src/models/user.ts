export type UserPreference = {
  id: number;
  navigationLayout: "sidebar" | "navbar";
  theme: "system" | "light" | "dark";
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferenceInput = Partial<
  Pick<UserPreference, "navigationLayout" | "theme">
>;

export const userRoles = {
  user: "user",
  admin: "admin",
} as const;

export type UserRole = (typeof userRoles)[keyof typeof userRoles];

export const userRoleOptions = [
  { value: userRoles.user, label: "User" },
  { value: userRoles.admin, label: "Admin" },
] as const;
