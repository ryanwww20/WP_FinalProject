"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomeClient() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLampHovered, setIsLampHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which background to use
  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const backgroundImage = currentTheme === "dark" ? "/dark_mode.png" : "/light_mode.png";

  const handleLampClick = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: mounted ? `url('${backgroundImage}')` : undefined,
        }}
      />

      {/* Clickable Lamp Area - positioned over the lamp in the image */}
      {mounted && (
        <button
          onClick={handleLampClick}
          onMouseEnter={() => setIsLampHovered(true)}
          onMouseLeave={() => setIsLampHovered(false)}
          className="absolute z-20 cursor-pointer transition-all duration-300 group"
          style={{
            // Position over the lamp in the image (top-right area)
            top: "5%",
            right: "5%",
            width: "12%",
            height: "35%",
          }}
          title={`點擊檯燈切換${currentTheme === "dark" ? "淺色" : "深色"}模式`}
          aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
        >
          {/* Hover glow effect */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isLampHovered
                ? currentTheme === "dark"
                  ? "bg-yellow-400/30 shadow-[0_0_60px_30px_rgba(250,204,21,0.4)]"
                  : "bg-yellow-200/40 shadow-[0_0_60px_30px_rgba(250,204,21,0.3)]"
                : ""
            }`}
          />
          
          {/* Tooltip on hover */}
          <div
            className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isLampHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            } ${
              currentTheme === "dark"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-800 text-white"
            }`}
          >
            {currentTheme === "dark" ? "💡 開燈 (Light Mode)" : "🌙 關燈 (Dark Mode)"}
          </div>
        </button>
      )}
      
      {/* Overlay for better text readability - lighter overlay to show more of the beautiful image */}
      <div className="absolute inset-0 bg-background/40 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-lg">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                讀書有揪
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed drop-shadow">
              找到讀書夥伴，共同學習成長。分享學習位置，追蹤學習進度，讓讀書不再孤單。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              開始使用
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-card/80 backdrop-blur text-card-foreground text-lg font-semibold rounded-full shadow hover:bg-muted transition-all duration-200 border border-border"
            >
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
            為什麼選擇讀書有揪？
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="智慧行事曆"
              description="視覺化您的課程與待辦事項，整合 Google Calendar 雙向同步，再也不會錯過重要事項。"
              icon={
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <FeatureCard
              title="讀書社群"
              description="建立或加入讀書群組，與夥伴一起學習。即時聊天、位置分享、專注排行，讓學習更有動力。"
              icon={
                <svg
                  className="w-8 h-8 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
            />
            <FeatureCard
              title="學習追蹤"
              description="記錄每日學習時間，查看專注統計數據，掌握學習進度，培養良好的學習習慣。"
              icon={
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group p-8 bg-card/80 backdrop-blur rounded-2xl hover:bg-muted/50 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border">
      <div className="mb-6 bg-background w-16 h-16 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border border-border">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

