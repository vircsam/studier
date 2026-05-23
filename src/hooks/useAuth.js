import { useStore } from "../store/useStore";

export function useAuth() {
  const { 
    user, 
    isAuthLoading, 
    signInEmail, 
    signUpEmail, 
    signInGoogle, 
    logout 
  } = useStore();

  return {
    user,
    isAuthLoading,
    signInEmail,
    signUpEmail,
    signInGoogle,
    logout
  };
}
