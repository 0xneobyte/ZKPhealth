import { Shield } from "lucide-react"
import { LoginForm } from "../components/login-form"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setError("")
      setLoading(true)
      console.log("Initiating login...")
      await login()
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium text-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Shield className="size-4" />
            </div>
            ZKP Health
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm 
              onLogin={handleLogin}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full flex flex-col items-center justify-center p-8 text-white">
            <div className="space-y-6 text-center">
              <div className="mx-auto w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  Secure Healthcare Data Management
                </h2>
                <p className="text-xl text-white/80">
                  Zero-Knowledge Proof technology ensuring privacy and security
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-8 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold">End-to-End Encryption</h3>
                    <p className="text-white/70 text-sm">Your medical data is encrypted and secure</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold">Blockchain Verified</h3>
                    <p className="text-white/70 text-sm">All transactions are verified on the blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold">Zero-Knowledge Proofs</h3>
                    <p className="text-white/70 text-sm">Prove eligibility without revealing sensitive data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
