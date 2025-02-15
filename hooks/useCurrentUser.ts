import { useUser } from '@clerk/clerk-expo';

export const useCurrentUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  return {
    currentUserId: user?.id || null,
    username: user?.username || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Anonymous',
    isLoaded,
    isSignedIn,
  };
};
