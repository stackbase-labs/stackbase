'use client';

import { NameField } from '@/components/form';
import { EmailField } from '@/components/form/email';
import { AvatarUploader } from '@/components/profile/avatar-uploader';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import type { Session } from '@workspace/auth/client';
import { changeEmail, updateUser } from '@workspace/auth/client';
import { UpdateProfileFormValues, updateProfileSchema } from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Form } from '@workspace/ui/components/form';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { Spinner } from '@workspace/ui/components/spinner';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface GeneralSettingsFormProps {
  user: Session['user'];
}

export function GeneralSettingsForm({ user }: GeneralSettingsFormProps) {
  const router = useRouter();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: UpdateProfileFormValues) => {
      const nameChanged = values.name !== user.name;
      const emailChanged = values.email !== user.email;

      if (nameChanged) {
        await updateUser({
          name: values.name,
        });
      }

      if (emailChanged) {
        await changeEmail({
          newEmail: values.email,
          callbackURL: '/settings/general',
        });
      }

      return { nameChanged, emailChanged };
    },
    onSuccess: (result) => {
      if (result.emailChanged) {
        toast.success(
          'Verification email sent! Please check your current email to approve the change.',
          { duration: 5000 },
        );
      } else {
        toast.success('Profile updated successfully!');
      }
      // Revalidate the server component so the form reflects the latest user data.
      router.refresh();
    },
    onError: (error: Error) => {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    },
  });

  function onSubmit(values: UpdateProfileFormValues) {
    updateProfileMutation.mutate(values);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and personal details.
        </p>
      </div>

      <Card id="profile-information" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your name and email address. If you change your email, you&apos;ll need to verify
            it again.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <AvatarUploader user={user} />
              </div>

              <Separator />

              <NameField
                control={form.control}
                name="name"
                label="Name"
                description="This is the name that will be displayed on your profile."
              />

              <EmailField
                control={form.control}
                name="email"
                label="Email"
                placeholder="Enter your email"
                description={
                  <>
                    <span className="block">
                      Your email address is used for signing in and receiving notifications.
                    </span>
                    <span className="text-primary mt-2 block">
                      Changing your email will require verification. A confirmation link will be
                      sent to your current email address.
                    </span>
                  </>
                }
              />
            </CardContent>
            <CardFooter className="mt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                className="w-full"
              >
                {updateProfileMutation.isPending && <Spinner />}
                {updateProfileMutation.isPending ? 'Updating profile...' : 'Update Profile'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </section>
  );
}
