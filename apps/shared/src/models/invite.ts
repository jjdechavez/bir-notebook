import { z } from "zod";

export const inviteStatus = {
  pending: "pending",
  accepted: "accepted",
  expired: "expired",
} as const;

export type InviteStatus = (typeof inviteStatus)[keyof typeof inviteStatus];

export const inviteStatusOptions = [
  { label: "Pending", value: inviteStatus.pending },
  { label: "Accepted", value: inviteStatus.accepted },
  { label: "Expired", value: inviteStatus.expired },
] as const;

export type InviteConfirmStatus =
  | "not_found"
  | "already_confirmed"
  | "expired"
  | "confirmed";

export type InviteConfirmResult = {
  status: InviteConfirmStatus;
  message: string;
};

export type InviteCompleteStatus = "not_found" | "completed";

export type InviteCompleteResult = {
  status: InviteCompleteStatus;
  message: string;
};

export const newInviteInputSchema = z.object({
  email: z.email(),
  role: z.enum(["user", "admin"]),
});

export type NewInviteInput = z.infer<typeof newInviteInputSchema>;

export const inviteListQuerySchema = z
  .object({
    page: z.number(),
    limit: z.number(),
    s: z.string(),
    status: z.enum([
      inviteStatus.pending,
      inviteStatus.accepted,
      inviteStatus.expired,
    ]),
  })
  .partial();

export type InviteListQuery = z.infer<typeof inviteListQuerySchema>;

export const updateInviteInputSchema = newInviteInputSchema.partial();
export type UpdateInviteInput = z.infer<typeof updateInviteInputSchema>;

export const inviteCompleteInputSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(1, "Password is required"),
  password_confirmation: z.string().min(1, "Password confirmation is required"),
});

export type InviteCompleteInput = z.infer<typeof inviteCompleteInputSchema>;
