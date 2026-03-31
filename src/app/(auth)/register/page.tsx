"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Something went wrong");
        setIsLoading(false);
        return;
      }

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] text-center mb-2">
        Create your account
      </h1>
      <p className="text-sm text-[#6b6b6b] text-center mb-6">
        Get started with Property Manager
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[#1a1a1a] mb-1"
          >
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-[#e0e1dc] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1a1a1a] placeholder:text-[#6b6b6b] focus:border-[#5c7c65] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#1a1a1a] mb-1"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#e0e1dc] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1a1a1a] placeholder:text-[#6b6b6b] focus:border-[#5c7c65] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#1a1a1a] mb-1"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-[#e0e1dc] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1a1a1a] placeholder:text-[#6b6b6b] focus:border-[#5c7c65] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[#1a1a1a] mb-1"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="w-full rounded-lg border border-[#e0e1dc] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1a1a1a] placeholder:text-[#6b6b6b] focus:border-[#5c7c65] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#5c7c65] py-2.5 text-sm font-medium text-white hover:bg-[#4a6853] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e0e1dc]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-[#6b6b6b]">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full rounded-lg border border-[#e0e1dc] bg-white py-2.5 text-sm font-medium text-[#1a1a1a] hover:bg-[#e8e9e4] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign up with Google
      </button>

      <p className="mt-6 text-center text-sm text-[#6b6b6b]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#5c7c65] hover:text-[#5c7c65]/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
