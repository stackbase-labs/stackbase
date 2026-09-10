'use client';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import type { Session } from '@workspace/auth/client';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { formatDate } from '@workspace/utils';
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  Hash,
  Mail,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface ProfileViewProps {
  user: Session['user'];
}

export function ProfileView({ user }: ProfileViewProps) {
  const [copyEmail, emailCopied] = useCopyToClipboard();
  const [copyUserId, userIdCopied] = useCopyToClipboard();

  const isEmailVerified = user.emailVerified === true;
  const isTwoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled === true;

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* Header Section */}
      <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/settings/general">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card id="profile-info" className="scroll-mt-6">
        <CardHeader className="">
          <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Avatar className="border-border h-24 w-24 rounded-xl border-2 shadow-md">
              <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} />
              <AvatarFallback className="rounded-xl text-4xl font-semibold capitalize">
                {user.name?.[0] ?? user.email[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{user.name || 'Unnamed User'}</h2>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="wrap-break-words text-sm">{user.email}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copyEmail(user.email)}
                  aria-label="Copy email"
                >
                  {emailCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Account Details</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* User ID */}
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">User ID</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-medium break-all">{user.id}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => copyUserId(user.id)}
                    aria-label="Copy user ID"
                  >
                    {userIdCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Joined Date */}
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Member Since</span>
                </div>
                <p className="text-base font-medium">{formatDate(user.createdAt, 'PPP')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Overview Card */}
      <Card id="security-overview" className="scroll-mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security Overview</CardTitle>
          </div>
          <CardDescription>Quick view of your account security status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email Verification Status */}
            <Card>
              <CardContent className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${isEmailVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                >
                  {isEmailVerified ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Email Verification</p>
                  <p className="text-muted-foreground text-sm">
                    {isEmailVerified ? 'Your email is verified' : 'Email not verified'}
                  </p>
                  <Badge
                    variant={isEmailVerified ? 'default' : 'secondary'}
                    className="mt-1 text-xs"
                  >
                    {isEmailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication Status */}
            <Card>
              <CardContent className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${isTwoFactorEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                >
                  {isTwoFactorEnabled ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-muted-foreground text-sm">
                    {isTwoFactorEnabled ? 'Extra security layer enabled' : '2FA is not enabled'}
                  </p>
                  <Badge
                    variant={isTwoFactorEnabled ? 'default' : 'secondary'}
                    className="mt-1 text-xs"
                  >
                    {isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
