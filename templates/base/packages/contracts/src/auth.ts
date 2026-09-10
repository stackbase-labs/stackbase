import { z } from 'zod';

export const emailSchema = z.email({
  message: 'Please enter a valid email address.',
});

export type EmailInput = z.infer<typeof emailSchema>;

export const passwordSchema = z
  .string()
  .min(8, {
    message: 'Password must be at least 8 characters.',
  })
  .max(100, {
    message: 'Password must be less than 100 characters.',
  });

export type PasswordInput = z.infer<typeof passwordSchema>;

export const nameSchema = z
  .string()
  .min(3, {
    message: 'Name must be at least 3 characters.',
  })
  .max(100, {
    message: 'Name must be less than 100 characters.',
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    revokeAllOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: 'New password must be different from current password',
    path: ['password'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z
  .object({
    password: passwordSchema,
    confirmation: z.string(),
  })
  .refine((data) => data.confirmation === 'DELETE', {
    message: 'Please type DELETE to confirm',
    path: ['confirmation'],
  });

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
