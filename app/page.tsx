'use client'

import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:8rem_8rem]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <section className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-col items-center space-y-10 text-center">
        <header className="space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl text-gray-900">
            AI Agent Assistant
          </h1>
          <p className="max-w-[600px] text-lg text-gray-600 md:text-xl/relaxed xl:text-2xl/relaxed text-center">
            The Future of Assistance, Today
            <br />
            <span className="text-gray-400 text-sm">
              Powered by IBM&apos;s WxTools & your favourite LLM&apos;s.
            </span>
          </p>
        </header>

        <SignedIn>
          <Link href="/dashboard">
            <button className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-900 transition-all duration-200">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl={"/dashboard"} forceRedirectUrl={"/dashboard"}>
            <Button className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-900 transition-all duration-200">
              Sign Up
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5"/>
            </Button>
          </SignInButton>
        </SignedOut>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-8 max-w-3xl mx-auto border-t border-gray-100">
          {[
            { title: "Fast", description: "Real-time streamed responses" },
            { title: "Modern", description: "Built with React, Next.js, and Tailwind CSS" },
            { title: "Smart", description: "Powered by your favorite LLM's"}
          ].map(({title, description}) => (
            <div key={title} className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{title}</div>
              <div className="text-sm text-gray-600 mt-1">{description}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
