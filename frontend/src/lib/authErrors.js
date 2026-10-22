// Turns Firebase error codes into messages a person can act on.

export function getAuthErrorMessage(error) {
  const code = error?.code || "";

  switch (code) {
    case "app/firebase-not-configured":
      return "Firebase is not set up yet. Add your keys to frontend/.env and restart the app.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Incorrect email or password. Check your details and try again.";

    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/email-already-in-use":
      return "An account with this email already exists. Log in instead, or reset your password.";

    case "auth/weak-password":
      return "Choose a stronger password with at least 8 characters.";

    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, or reset your password.";

    case "auth/user-disabled":
      return "This account has been disabled. Contact your administrator.";

    case "auth/network-request-failed":
      return "Could not reach Firebase. Check your internet connection and try again.";

    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled. In the Firebase Console, open Authentication > Sign-in method and enable Email/Password.";

    case "auth/configuration-not-found":
      return "Authentication is not set up for this Firebase project. In the Firebase Console, open Authentication and click Get started.";

    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "The Firebase API key in frontend/.env is not valid. Copy it again from the Firebase Console.";

    default:
      return "Something went wrong. Please try again.";
  }
}
