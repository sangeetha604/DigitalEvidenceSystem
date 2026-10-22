import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "../firebase";
import { AuthContext } from "./auth-context";

// Thrown when someone tries to sign in before Firebase keys were added.
function requireAuth() {
  if (!auth) {
    const error = new Error("Firebase is not configured.");
    error.code = "app/firebase-not-configured";
    throw error;
  }

  return auth;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // While Firebase checks for an existing session we show a loader,
  // so logged-in users never see a flash of the login page.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // Bumped after the display name is saved so the UI re-renders.
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    // Firebase remembers the session (even after refresh) and tells us here.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(
    (email, password) =>
      signInWithEmailAndPassword(requireAuth(), email, password),
    []
  );

  const signup = useCallback(async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(
      requireAuth(),
      email,
      password
    );

    if (name) {
      await updateProfile(credential.user, { displayName: name });
      setProfileVersion((version) => version + 1);
    }

    return credential.user;
  }, []);

  const resetPassword = useCallback(
    (email) => sendPasswordResetEmail(requireAuth(), email),
    []
  );

  const logout = useCallback(() => signOut(requireAuth()), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isFirebaseConfigured,
      profileVersion,
      login,
      signup,
      resetPassword,
      logout,
    }),
    [user, loading, profileVersion, login, signup, resetPassword, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
