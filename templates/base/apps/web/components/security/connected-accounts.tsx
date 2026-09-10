'use client';

import { config } from '@/config/site';
import { providerIcons } from '@/lib/provider-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { linkSocial, listAccounts, signIn, unlinkAccount } from '@workspace/auth/client';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@workspace/ui/components/empty';
import { Separator } from '@workspace/ui/components/separator';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { AlertTriangle, Link2, Unlink } from 'lucide-react';
import { useState, type ComponentType, type SVGProps } from 'react';
import { toast } from 'sonner';

type ProviderConfig = {
  id: string;
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const availableProviders: ProviderConfig[] = config.providers
  .map((provider) => {
    const Icon = providerIcons[provider.id];
    if (!Icon) return null;
    return { ...provider, Icon };
  })
  .filter(Boolean) as ProviderConfig[];

type SocialProvider = Parameters<typeof signIn.social>[0]['provider'];

export function ConnectedAccounts() {
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const {
    data: accounts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['social-connections'],
    queryFn: async () => {
      const res = await listAccounts();
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (providerId: SocialProvider) => {
      const res = await unlinkAccount({
        providerId,
      });
      if (res.error) {
        throw new Error(res.error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      toast.success('Disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleConnect = async (provider: SocialProvider) => {
    try {
      setConnectingProvider(provider);
      await linkSocial({
        provider,
        callbackURL: '/settings/security',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start connection';
      toast.error(message);
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <Card id="connected-accounts" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>Manage the social logins linked to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError && (
          <Empty className="gap-3 border-0 p-0 md:p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertTriangle className="text-destructive size-5" />
              </EmptyMedia>
              <EmptyTitle>Unable to load connected accounts</EmptyTitle>
              <EmptyDescription>Please try again in a moment.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((key) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="bg-muted h-5 w-24 animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="bg-muted h-5 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-9 w-24 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {availableProviders.map((provider) => {
              const isConnected = accounts?.some((a) => a.providerId === provider.id) ?? false;
              return (
                <div
                  key={provider.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-muted flex h-8 w-8 items-center justify-center rounded-full border">
                      <provider.Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{provider.name}</p>
                        <Badge variant={isConnected ? 'default' : 'secondary'}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant={isConnected ? 'outline' : 'default'}
                      onClick={() =>
                        isConnected
                          ? disconnectMutation.mutate(provider.id)
                          : handleConnect(provider.id)
                      }
                      disabled={
                        disconnectMutation.isPending ||
                        connectingProvider === provider.id ||
                        disconnectMutation.variables === provider.id
                      }
                    >
                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <Unlink className="h-4 w-4" />
                          Disconnect
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Connect
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator />
        <p className="text-muted-foreground text-sm">
          You need at least one active login method. Add a password or another provider before
          disconnecting your last linked account.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConnectedAccountsSkeleton() {
  return (
    <div className="bg-card space-y-6 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2].map((key) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
