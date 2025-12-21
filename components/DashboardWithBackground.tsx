"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Navbar from "./Navbar";
import PomodoroTimer from "./PomodoroTimer";

export default function DashboardWithBackground() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLampHovered, setIsLampHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme || theme : "light";
  const backgroundImage =
    currentTheme === "dark" ? "/dark_mode.png" : "/light_mode.png";

  const handleLampClick = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      {/* Background Image - 填滿整個視窗 */}
      {/* <img
        src={mounted ? backgroundImage : undefined}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{
          opacity: mounted ? 1 : 0,
        }}
      /> */}
      
      {/* 固定比例的容器 - 用於精確定位元素 */}
      {/* 圖片比例為 2746x1672 (約 5:3) */}
      {/* 這個容器會保持固定比例，無論視窗大小如何變化 */}
      {/* 如果圖片比例不對，可以調整 aspect-[2746/1672] 為其他比例，例如： */}
      {/* aspect-video (16:9), aspect-[4/3] (4:3), aspect-[16/10] (16:10) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full aspect-[2746/1672] max-h-full max-w-full">

      {/* Clickable Lamp Area - 可點擊的檯燈區域 */}
      {/* 
        調整說明：
        - 位置：修改 top, right, left, bottom (相對於父容器的百分比)
        - 大小：修改 width, height (相對於父容器的百分比)
        - 旋轉：在 style 中添加 transform: "rotate(角度deg)"
          例如：transform: "rotate(15deg)" 順時針旋轉 15 度
                transform: "rotate(-10deg)" 逆時針旋轉 10 度
      */}
      <img
        src={mounted ? backgroundImage : undefined}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{
          opacity: mounted ? 1 : 0,
        }}
      />
      {mounted && (
        <button
          onClick={handleLampClick}
          onMouseEnter={() => setIsLampHovered(true)}
          onMouseLeave={() => setIsLampHovered(false)}
          className="absolute z-30 cursor-pointer transition-all duration-300"
          style={{
            // 位置調整：相對於父容器（aspect-ratio 鎖定的容器）的百分比
            top: "7%",      // 距離頂部 2% - 增大值向下移動
            right: "12%",    // 距離右側 3% - 增大值向左移動
            // 大小調整：相對於父容器的百分比
            width: "11%",   // 按鈕寬度 - 增大值變寬
            height: "25%",  // 按鈕高度 - 增大值變高
            // 旋轉調整（可選）：取消註解下面這行並調整角度
            // transform: "rotate(0deg)",  // 旋轉角度：正值順時針，負值逆時針
          }}
          title={`點擊檯燈切換${currentTheme === "dark" ? "淺色" : "深色"}模式`}
          aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
        >
          {/* Hover glow effect - 亮燈效果區塊 */}
          {/* 
            調整說明：
            - 大小：修改 width 和 height 的值（確保相等才能是正圓形）
              例如：w-32 h-32 或 w-[80px] h-[80px] 或 w-[15%] h-[15%]
            - 位置：修改 top, left, transform 來調整位置
              使用 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 來居中
            - 形狀：rounded-full 確保是圓形（前提是寬高相等）
          */}
          <div
            className={`absolute rounded-full transition-all duration-300 ${
              isLampHovered
                ? currentTheme === "dark"
                  ? "bg-yellow-400/40 shadow-[0_0_80px_40px_rgba(250,204,21,0.5)]"
                  : "bg-yellow-400/50 shadow-[0_0_60px_30px_rgba(250,204,21,0.7)]"
                : ""
            }`}
            style={{
              // 大小調整：確保寬高相等才能是正圓形
              // 方式 1: 使用固定像素值
              width: "80px",   // 圓形直徑 - 增大值變大（如 "100px"）
              height: "80px",  // 必須與 width 相同
              
              // 方式 2: 使用父容器百分比（可選，如果要用百分比可以取消註解下面兩行）
              // width: "15%",   // 相對於按鈕寬度的百分比
              // height: "15%",  // 必須與 width 相同
              
              // 位置調整：居中顯示（相對於按鈕中心）
              top: "50%",      // 距離頂部 50%（按鈕中心點）
              left: "50%",     // 距離左側 50%（按鈕中心點）
              transform: "translate(-50%, -50%)",  // 居中對齊
              
              // 位置微調（可選）：如果要偏移位置可以添加額外的 transform
              // transform: "translate(-50%, -50%) translateX(10px)",  // 向右偏移 10px
              // transform: "translate(-50%, -50%) translateY(10px)",  // 向下偏移 10px
            }}
          />
        </button>
      )}

      {/* Main Monitor Content Area */}
      {/* 3D Transform 設定區域 */}
      <div
        className="absolute z-10 [perspective:1000px]"
        style={{
          // 位置調整：修改這些值來移動整個監視器區域
          top: "11.5%",
          left: "32%",
          width: "33%",
          height: "44%",
        }}
      >
        {/* 3D Transform 容器 - preserve-3d 讓子元素保持 3D 空間 */}
        <div className="w-full h-full [transform-style:preserve-3d] [transform-origin:0_0] [transform:perspective(800px)_rotateZ(0.7deg)_rotateY(-14deg)_rotateX(-1deg)_skewY(-3deg)]">
          {/* Monitor Screen - Dashboard Container */}
          {/* 3D Transform: rotateY(左右傾斜) rotateX(上下傾斜) translateZ(前後移動) */}
          {/* 調整方式：
              - rotateY(-5deg 到 5deg): 左右傾斜，負值向左，正值向右
              - rotateX(0deg 到 15deg): 上下傾斜，正值向下（俯視），負值向上（仰視）
              - translateZ(0px): 前後移動，正值向前，負值向後
          */}
          <div className="w-full h-full bg-background backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl border border-border/50 flex flex-col">
          {/* Monitor Top Bar */}
          <div className="h-6 bg-muted/80 flex items-center px-3 gap-1.5 border-b border-border/50 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-3 text-[10px] text-muted-foreground font-medium">
              Dashboard - 讀書有揪
            </span>
          </div>

          {/* Navigation Bar inside Monitor */}
          <div className="flex-shrink-0 border-b border-border/50">
            <div className="transform scale-[0.55] origin-top-left w-[182%]">
              <Navbar />
            </div>
          </div>

          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="transform scale-[0.55] origin-top-left w-[182%]">
              <Dashboard />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Laptop Screen Content Area (smaller, left side) */}
      {/* 3D Transform 設定區域 */}
      <div
        className="absolute z-10 [perspective:1000px]"
        style={{
          // 位置調整：修改這些值來移動整個筆電區域
          top: "24%",    // 距離頂部的距離
          left: "6%",    // 距離左側的距離
          width: "22.5%",  // 寬度（調整這個來改變寬度）
          height: "25%", // 高度（調整這個來改變高度）
        }}
      >
        {/* 3D Transform 容器 - preserve-3d 讓子元素保持 3D 空間 */}
        {/* 3D Transform 調整說明：
            - rotateY: 筆電通常需要向左傾斜 (負值)，例如 -8deg 到 -12deg
            - rotateX: 筆電通常向上傾斜 (負值)，例如 -5deg 到 -10deg
            - translateZ: 可以稍微向後一點，例如 -5px 到 0px
        */}
        <div className="w-full h-full [transform-style:preserve-3d] [transform-origin:0_0] [transform:perspective(800px)_rotateZ(3deg)_rotateY(0deg)_rotateX(-0deg)_skewY(-1deg)]">
          {/* Laptop Screen Container */}
          <div className="w-full h-full bg-background rounded-md overflow-y-auto overflow-x-hidden shadow-xl">
            {/* Laptop content - Pomodoro Timer */}
            {/* 所有 PomodoroTimer 的內容都會被 3D Transform 容器控制 */}
            <PomodoroTimer compact={true} />
          </div>
        </div>
      </div>

      {/* Notebook Area (right side) - Today's Notes */}
      {/* 3D Transform 設定區域 */}
      <div
        className="absolute z-10 [perspective:1000px]"
        style={{
          // 位置調整：修改這些值來移動整個筆記本區域
          bottom: "8%",
          right: "3%",
          width: "18%",
          height: "28%",
        }}
      >
        {/* 3D Transform 容器 */}
        <div className="w-full h-full [transform-style:preserve-3d]">
          {/* Notebook Container */}
          {/* 3D Transform 調整說明：
              - rotateY: 筆記本在右側，通常向右傾斜 (正值)，例如 8deg 到 15deg
              - rotateX: 筆記本通常稍微向上 (負值) 或向下 (正值)，例如 -3deg 到 5deg
              - translateZ: 可以稍微向前或向後，例如 -5px 到 5px
              - 注意：原本有 rotate-2，現在用 3D transform 取代
          */}
          <div className="w-full h-full bg-amber-50 dark:bg-amber-100 rounded-sm shadow-lg p-2 [transform:rotateY(12deg)_rotateX(-3deg)_translateZ(2px)]">
          <h4 className="text-[8px] font-bold text-gray-700 mb-1 border-b border-gray-300 pb-0.5">
            📝 Today's Goals
          </h4>
          <ul className="text-[6px] text-gray-600 space-y-0.5">
            <li className="flex items-center gap-1">
              <span className="text-green-600">✓</span> Complete assignment
            </li>
            <li className="flex items-center gap-1">
              <span className="text-green-600">✓</span> Review notes
            </li>
            <li className="flex items-center gap-1">
              <span className="text-gray-400">○</span> Study for exam
            </li>
            <li className="flex items-center gap-1">
              <span className="text-gray-400">○</span> Group meeting
            </li>
          </ul>
        </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

