"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, Lightbulb, MessageSquare, ArrowRight, Github } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import NavigationHeader from "@/components/NavigationHeader";
import useMounted from "@/hooks/useMounted";
import { formatNumber } from "@/utils/formatNumber";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  const mounted = useMounted();
  const stats = useQuery(api.stats.getPlatformStats);

  const features = [
    {
      icon: Code2,
      title: "Interactive Code Editor",
      description: "Write, execute, and test code in real-time with support for multiple languages.",
      href: "/editor",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Lightbulb,
      title: "Snippet Manager",
      description: "Save, organize, and share your favorite code snippets with the community.",
      href: "/snippets",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: MessageSquare,
      title: "AI Code Chat",
      description: "Get instant answers and code suggestions from our intelligent AI assistant.",
      href: "/editor",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Github,
      title: "Repo Analyzer",
      description: "Analyze GitHub repositories, explore code structure, commits, and get AI-powered insights.",
      href: "/repo-analyzer",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavigationHeader />

      <div className="relative max-w-7xl mx-auto px-4 py-20">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={containerVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          className="relative z-10 space-y-20"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-8 py-12">
            <div className="space-y-4">
              <motion.h1
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 
                  text-transparent bg-clip-text leading-tight"
                variants={itemVariants}
              >
                Welcome to CompileX
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                variants={itemVariants}
              >
                Your all-in-one platform for interactive coding, snippet management, and intelligent code analysis.
              </motion.p>
            </div>

            <motion.p
              className="text-gray-400 text-lg max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Write code, save snippets, analyze repositories, and chat with AI—all in one place.
            </motion.p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="group relative bg-[#12121a]/50 backdrop-blur rounded-2xl border border-white/[0.05] 
                    hover:border-white/[0.1] p-8 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 
                      transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 
                        group-hover:bg-opacity-20 transition-all`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>

                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={itemVariants} className="text-center space-y-8 py-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to get started?</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Choose a feature below or explore all that CompileX has to offer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/editor"
                className="group relative px-8 py-4 rounded-xl font-semibold text-white 
                  bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                  shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300
                  flex items-center gap-2"
              >
                <Code2 className="w-5 h-5" />
                Open Code Editor
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/snippets"
                className="group px-8 py-4 rounded-xl font-semibold text-white 
                  bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600
                  transition-all duration-300 flex items-center gap-2"
              >
                <Lightbulb className="w-5 h-5" />
                Browse Snippets
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/repo-analyzer"
                className="group px-8 py-4 rounded-xl font-semibold text-purple-300
                  bg-purple-500/[0.08] hover:bg-purple-500/[0.15]
                  border border-purple-500/30 hover:border-purple-500/60
                  shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20
                  transition-all duration-300 flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                Open Repo Analyzer
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
<motion.div
  variants={itemVariants}
  className="grid grid-cols-3 gap-6 py-12 text-center border-t border-white/[0.05]"
>
  {[
    {
      label: "Code Snippets",
      value: formatNumber(stats?.totalSnippets),
    },
    {
      label: "Repos Analyzed",
      value: formatNumber(stats?.totalRepos),
    },
    {
      label: "Active Users",
      value: formatNumber(stats?.totalUsers),
    },
  ].map((stat, index) => (
    <div key={index} className="space-y-2">
      <p
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r 
        from-blue-400 to-purple-400 text-transparent bg-clip-text"
      >
        {stat.value ?? "..."}
      </p>
      <p className="text-gray-400 text-sm">{stat.label}</p>
    </div>
  ))}
</motion.div>
        </motion.div>
      </div>
    </div>
  );
}
