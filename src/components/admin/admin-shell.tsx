"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Store,
} from "lucide-react";
import { signOutAdminAction } from "@/app/actions/auth";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderKanban, exact: false },
  { href: "/admin/settings", label: "Shop Settings", icon: Settings, exact: false },
];

type Props = {
  adminEmail: string;
  shopName: string;
  children: ReactNode;
};

export function AdminShell({ adminEmail, shopName, children }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 text-stone-900 lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Store className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-900">{shopName}</p>
            <p className="truncate text-xs text-stone-500">ShopLink Admin</p>
          </div>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-stone-200 p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <span>Preview Storefront</span>
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>

          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <p className="truncate text-xs font-medium text-stone-800">{adminEmail}</p>
            <p className="text-[11px] text-stone-500">Authorized admin</p>
          </div>

          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header & navigation */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-white">
                <Store className="size-4" aria-hidden />
              </div>
              <span className="text-sm font-bold text-stone-900">{shopName} · Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Store
                <ExternalLink className="size-3" aria-hidden />
              </Link>
              <form action={signOutAdminAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <LogOut className="size-3.5" aria-hidden />
                  Exit
                </button>
              </form>
            </div>
          </div>

          <nav
            aria-label="Mobile admin navigation"
            className="flex gap-1 overflow-x-auto border-t border-stone-100 px-3 py-2 [scrollbar-width:none]"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

