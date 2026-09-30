import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
        signInUrl="/login"
        signUpUrl="/signup"
      />
      <div id="clerk-captcha" />
    </>
  )
}
