"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  Github,
  BookOpen,
  Library,
  Sparkles,
  Send,
  Award,
  Users,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/lms", label: "LMS 学习管理", icon: GraduationCap },
  { href: "/challenges/c01", label: "Challenge 详情", icon: BookOpen },
  { href: "/submit", label: "提交 Challenge", icon: Send },
  { href: "/portfolio", label: "作品集", icon: Award },
  { href: "/teacher", label: "教师控制台", icon: Users },
  { href: "/profile", label: "个人中心", icon: User },
  { href: "/github", label: "GitHub 组织", icon: Github },
  { href: "/docs", label: "文档门户", icon: BookOpen },
  { href: "/knowledge", label: "知识库", icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[var(--sidebar-width)] flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <Sparkles className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">NSEAP</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400">NSEAP v1.0 · Elite20</p>
      </div>
    </aside>
  );
}
