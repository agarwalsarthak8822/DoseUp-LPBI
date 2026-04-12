import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const signupBodySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
    email: z.string().email("Invalid email").max(255).toLowerCase().trim(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email").max(255).toLowerCase().trim(),
  password: z.string().min(1, "Password is required").max(128),
});

export type SignupInput = z.infer<typeof signupBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
