import { z } from 'zod';

export const emailSchema = z.string().email();

export const resendEmailSchema = z
  .object({
    from: emailSchema.optional(),
    to: z.union([emailSchema, z.array(emailSchema)]),
    subject: z.string().min(1),
    react: z.any().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z.union([emailSchema, z.array(emailSchema)]).optional(),
    bcc: z.union([emailSchema, z.array(emailSchema)]).optional(),
    replyTo: emailSchema.optional(),
  })
  .refine((data) => data.react || data.html || data.text, {
    message: 'Either react, html, or text must be provided.',
    path: ['react', 'html', 'text'],
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(100),
  verificationUrl: z.url(),
});

export const changeEmailSchema = z.object({
  currentEmail: emailSchema,
  newEmail: emailSchema,
  name: z.string().min(1).max(100),
  verificationUrl: z.url(),
});

export const resetPasswordSchema = z.object({
  name: z.string().min(1).max(100),
  resetUrl: z.url(),
});
