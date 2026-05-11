import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";   // ✅ switched to react-router-dom
import { AlertCircle } from "lucide-react";
import { loginCustomer } from "@/services/api";

const inp =
  "w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export default function Login() {   
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => loginCustomer({ email, password }),
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/track-order");   // ✅ simplified navigation
      } else {
        setErrorMsg(data.message ?? "Login failed.");
      }
    },
    onError: () => setErrorMsg("Something went wrong."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-white">Egnaro Mart</div>
          <div className="mt-1 text-sm text-gray-400">Sign in to your account</div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <form
          autoComplete="on"
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg(null);
              }}
              className={inp}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg(null);
              }}
              className={inp}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg gradient-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {mutation.isPending ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
