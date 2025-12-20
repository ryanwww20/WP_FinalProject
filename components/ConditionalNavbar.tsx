"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // 在 Dashboard 页面（首页且已登录）不显示导航栏，因为导航栏已经在 Monitor 内部了
  // 这里我们检查是否是首页，如果是首页，导航栏会在 DashboardWithBackground 中显示
  // 所以这里只在不显示 Dashboard 的页面显示导航栏
  if (pathname === "/") {
    return null; // 首页的导航栏在 DashboardWithBackground 中
  }
  
  return <Navbar />;
}

