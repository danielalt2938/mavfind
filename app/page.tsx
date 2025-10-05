"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";

export default function Home() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl md:text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors"
          >
            MavFind
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                href="/inventory"
                className="text-base font-medium text-muted hover:text-fg transition-colors"
              >
                Browse Items
              </Link>
            </nav>
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-border">
                <span className="text-xs text-muted">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className="pl-6 border-l border-border">
                <Button variant="ghost" size="sm" className="text-base">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="container-custom py-4 space-y-4">
              <Link
                href="/inventory"
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Items
              </Link>
              {user ? (
                <div className="pt-4 border-t border-border space-y-3">
                  <span className="text-xs text-muted block truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left text-sm font-medium text-muted hover:text-fg transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-[85vh] grid place-items-center text-center pt-20 section-padding relative overflow-hidden">
        {/* Background Horse Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <Image
            src="/assets/mustang.svg"
            alt=""
            width={600}
            height={450}
            className="select-none"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 container-custom max-w-4xl"
          style={{ marginTop: "100px" }}
        >
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 sm :mt-20">
            Find what's lost.
          </h1>
          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-12 text-balance">
            For Mavericks. A faster way to bring belongings home.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/user">
              <Button size="lg" className="w-full sm:w-auto">
                Report Lost Item
              </Button>
            </Link>
            <Link href="/inventory">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Browse Found Items
              </Button>
            </Link>
          </div>

          {/* Trust Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 flex flex-col sm:flex-row gap-8 justify-center text-sm text-muted"
          >
            <div>
              <div className="text-lg font-semibold text-fg mb-1">Thousands</div>
              <div>of items reunited</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-fg mb-1">Lightning fast</div>
              <div>match times</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-fg mb-1">Remarkably high</div>
              <div>success rate</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-bgElevated">
        <div className="container-custom max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Built for campus life.
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Three simple steps to reunite with your belongings.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Report",
                desc: "Tell us what you lost. Our AI finds potential matches automatically.",
              },
              {
                step: "02",
                title: "Match",
                desc: "We instantly scan all found items and show you potential matches.",
              },
              {
                step: "03",
                title: "Reunite",
                desc: "Review matches, verify your item, and claim it from lost & found.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="card-base p-8 text-center"
              >
                <div className="text-5xl font-extrabold text-white/10 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">
                  {item.title}
                </h3>
                <p className="text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="container-custom max-w-4xl card-base p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            You're covered.
          </h2>
          <p className="text-lg text-muted mb-8">
            Join thousands of Mavericks who've found what they thought was lost
            forever.
          </p>
          <Link href="/auth/signin">
            <Button size="lg">Get started</Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container-custom text-center">
          <p className="text-sm text-muted">
            &copy; 2025 MavFind. For the University of Texas at Arlington.
          </p>
        </div>
      </footer>
    </div>
  );
}
