import { cn } from "../lib/utils"
import { Button } from "./ui/button"

export function LoginForm({
  className,
  onLogin,
  loading,
  error,
  ...props
}) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Connect your MetaMask wallet to access the healthcare system
        </p>
      </div>
      <div className="grid gap-6">
        {error && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <Button 
          type="button" 
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={onLogin}
          disabled={loading}
        >
          <div className="flex items-center justify-center gap-3">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 318.6 318.6" 
              fill="none" 
              className="flex-shrink-0"
            >
              <path
                d="M274.1 35.5l-99.5 73.9L193 65.8l81.1-30.3z"
                fill="#E2761B"
                stroke="#E2761B"
                strokeWidth="1"
              />
              <path
                d="M44.4 35.5l98.7 74.6-17.5-44.3L44.4 35.5z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3-46.5-.9z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6-46.4-.1z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M103.6 138.2l-15.8 23.9 56.3 2.5-1.9-60.6-38.6 34.2z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5-15.9-23.9z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M106.8 247.4l33.8-16.5-29.2-22.8-4.6 39.3z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
              <path
                d="M177.9 230.9l33.9 16.5-4.7-39.3-29.2 22.8z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeWidth="1"
              />
            </svg>
            {loading ? "Connecting..." : "Login with MetaMask"}
          </div>
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have MetaMask?{" "}
        <a 
          href="https://metamask.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-primary"
        >
          Install MetaMask
        </a>
      </div>
    </form>
  )
}
