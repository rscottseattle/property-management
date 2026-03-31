"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    setIsLoading(true);
    // Placeholder: actual email sending not wired yet
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0e9]">
          <Mail className="h-6 w-6 text-[#5c7c65]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          Check your email
        </h1>
        <p className="text-sm text-[#6b6b6b] mb-6">
          If an account exists with that email, we&apos;ve sent a password reset
          link. Check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[#5c7c65] hover:text-[#5c7c65]/80"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] text-center mb-2">
        Reset your password
      </h1>
      <p className="text-sm text-[#6b6b6b] text-center mb-6">
        Enter your email and we&apos;ll send you a reset link
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#5c7c65] py-2.5 text-sm font-medium text-white hover:bg-[#4a6853] focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b6b6b]">
        Remember your password?{" "}
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
