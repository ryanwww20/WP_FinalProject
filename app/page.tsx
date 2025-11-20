import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/");
  }

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
         <Dashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to WP Final Project
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          A modern web application built with Next.js, Tailwind CSS, MongoDB, and OAuth authentication
        </p>

        <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Sign in to get started with our platform
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Link>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
              <FeatureCard
                title="Next.js 14"
                description="Built with the latest App Router and Server Components"
                icon="⚡"
              />
              <FeatureCard
                title="MongoDB"
                description="Robust database integration with Mongoose"
                icon="🍃"
              />
              <FeatureCard
                title="OAuth 2.0"
                description="Secure authentication with Google and GitHub"
                icon="🔐"
              />
            </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}
