import { GoogleLogin } from "@react-oauth/google";

export default function GoogleAuthButton({ onCredential, disabled }) {
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <GoogleLogin
        onSuccess={(response) => onCredential(response.credential)}
        onError={() => onCredential(null, new Error("Google sign-in failed. Please try again."))}
        width="100%"
        shape="rectangular"
        theme="outline"
        text="continue_with"
      />
    </div>
  );
}