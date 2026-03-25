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
