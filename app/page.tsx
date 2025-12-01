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
      <div className="min-h-[calc(100vh-4rem)] bg-muted/40">
         <Dashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
              Manage your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Academic Life</span>
        </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for students. Track courses, manage events, and stay organized.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-card text-card-foreground text-lg font-semibold rounded-full shadow hover:bg-muted transition-all duration-200 border border-border"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground">Why Choose WP Final Project?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
              title="Smart Calendar"
              description="Visualize your schedule with our intuitive calendar view. Never miss a class or deadline again."
              icon={
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              />
              <FeatureCard
              title="Course Management"
              description="Keep track of all your courses, assignments, and grades in one centralized location."
              icon={
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              />
              <FeatureCard
              title="Secure & Private"
              description="Built with industry-standard security. Your data is encrypted and safe with us."
              icon={
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              />
            </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="group p-8 bg-card rounded-2xl hover:bg-muted/50 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border">
      <div className="mb-6 bg-background w-16 h-16 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border border-border">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
