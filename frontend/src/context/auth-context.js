import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// Use this hook in any component to read the logged-in user
// and to call login / signup / resetPassword / logout.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}
