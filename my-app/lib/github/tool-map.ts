export type ToolCategory = "frontend" | "backend" | "ide" | "ai" | "other";

export interface DetectedTool {
  name: string;
  domain: string;
  category: ToolCategory;
  /** Brandfetch icon URL, attached by the detect route when available */
  logoUrl?: string;
}

/**
 * npm package name → tool. Keys are exact dependency names from
 * package.json (dependencies + devDependencies).
 */
export const NPM_TOOL_MAP: Record<string, DetectedTool> = {
  // Frontend frameworks & libraries
  next: { name: "Next.js", domain: "nextjs.org", category: "frontend" },
  react: { name: "React", domain: "react.dev", category: "frontend" },
  vue: { name: "Vue.js", domain: "vuejs.org", category: "frontend" },
  nuxt: { name: "Nuxt", domain: "nuxt.com", category: "frontend" },
  "@angular/core": { name: "Angular", domain: "angular.dev", category: "frontend" },
  svelte: { name: "Svelte", domain: "svelte.dev", category: "frontend" },
  "@sveltejs/kit": { name: "SvelteKit", domain: "kit.svelte.dev", category: "frontend" },
  astro: { name: "Astro", domain: "astro.build", category: "frontend" },
  "solid-js": { name: "SolidJS", domain: "solidjs.com", category: "frontend" },
  "@remix-run/react": { name: "Remix", domain: "remix.run", category: "frontend" },
  "@builder.io/qwik": { name: "Qwik", domain: "qwik.dev", category: "frontend" },
  gatsby: { name: "Gatsby", domain: "gatsbyjs.com", category: "frontend" },
  "react-native": { name: "React Native", domain: "reactnative.dev", category: "frontend" },
  expo: { name: "Expo", domain: "expo.dev", category: "frontend" },
  electron: { name: "Electron", domain: "electronjs.org", category: "frontend" },
  tailwindcss: { name: "Tailwind CSS", domain: "tailwindcss.com", category: "frontend" },
  "styled-components": { name: "styled-components", domain: "styled-components.com", category: "frontend" },
  "@emotion/react": { name: "Emotion", domain: "emotion.sh", category: "frontend" },
  "@mui/material": { name: "Material UI", domain: "mui.com", category: "frontend" },
  antd: { name: "Ant Design", domain: "ant.design", category: "frontend" },
  "@chakra-ui/react": { name: "Chakra UI", domain: "chakra-ui.com", category: "frontend" },
  bootstrap: { name: "Bootstrap", domain: "getbootstrap.com", category: "frontend" },
  "@tanstack/react-query": { name: "TanStack Query", domain: "tanstack.com", category: "frontend" },
  "@reduxjs/toolkit": { name: "Redux", domain: "redux.js.org", category: "frontend" },
  redux: { name: "Redux", domain: "redux.js.org", category: "frontend" },
  zustand: { name: "Zustand", domain: "zustand.docs.pmnd.rs", category: "frontend" },
  "framer-motion": { name: "Framer Motion", domain: "framer.com", category: "frontend" },
  motion: { name: "Motion", domain: "motion.dev", category: "frontend" },
  three: { name: "Three.js", domain: "threejs.org", category: "frontend" },
  vite: { name: "Vite", domain: "vitejs.dev", category: "frontend" },

  // Backend & data
  express: { name: "Express", domain: "expressjs.com", category: "backend" },
  fastify: { name: "Fastify", domain: "fastify.dev", category: "backend" },
  "@nestjs/core": { name: "NestJS", domain: "nestjs.com", category: "backend" },
  koa: { name: "Koa", domain: "koajs.com", category: "backend" },
  hono: { name: "Hono", domain: "hono.dev", category: "backend" },
  convex: { name: "Convex", domain: "convex.dev", category: "backend" },
  prisma: { name: "Prisma", domain: "prisma.io", category: "backend" },
  "@prisma/client": { name: "Prisma", domain: "prisma.io", category: "backend" },
  "drizzle-orm": { name: "Drizzle", domain: "orm.drizzle.team", category: "backend" },
  mongoose: { name: "MongoDB", domain: "mongodb.com", category: "backend" },
  mongodb: { name: "MongoDB", domain: "mongodb.com", category: "backend" },
  pg: { name: "PostgreSQL", domain: "postgresql.org", category: "backend" },
  mysql2: { name: "MySQL", domain: "mysql.com", category: "backend" },
  redis: { name: "Redis", domain: "redis.io", category: "backend" },
  ioredis: { name: "Redis", domain: "redis.io", category: "backend" },
  "@supabase/supabase-js": { name: "Supabase", domain: "supabase.com", category: "backend" },
  firebase: { name: "Firebase", domain: "firebase.google.com", category: "backend" },
  "firebase-admin": { name: "Firebase", domain: "firebase.google.com", category: "backend" },
  "@clerk/nextjs": { name: "Clerk", domain: "clerk.com", category: "backend" },
  "next-auth": { name: "NextAuth.js", domain: "authjs.dev", category: "backend" },
  "better-auth": { name: "Better Auth", domain: "better-auth.com", category: "backend" },
  stripe: { name: "Stripe", domain: "stripe.com", category: "backend" },
  graphql: { name: "GraphQL", domain: "graphql.org", category: "backend" },
  "@apollo/client": { name: "Apollo", domain: "apollographql.com", category: "backend" },
  "@apollo/server": { name: "Apollo", domain: "apollographql.com", category: "backend" },
  "@trpc/server": { name: "tRPC", domain: "trpc.io", category: "backend" },
  "socket.io": { name: "Socket.IO", domain: "socket.io", category: "backend" },

  // AI
  openai: { name: "OpenAI", domain: "openai.com", category: "ai" },
  "@anthropic-ai/sdk": { name: "Anthropic", domain: "anthropic.com", category: "ai" },
  ai: { name: "Vercel AI SDK", domain: "sdk.vercel.ai", category: "ai" },
  langchain: { name: "LangChain", domain: "langchain.com", category: "ai" },
  "@langchain/core": { name: "LangChain", domain: "langchain.com", category: "ai" },
  "@google/generative-ai": { name: "Gemini", domain: "ai.google.dev", category: "ai" },
  "@huggingface/inference": { name: "Hugging Face", domain: "huggingface.co", category: "ai" },
  replicate: { name: "Replicate", domain: "replicate.com", category: "ai" },

  // Tooling
  typescript: { name: "TypeScript", domain: "typescriptlang.org", category: "other" },
  jest: { name: "Jest", domain: "jestjs.io", category: "other" },
  vitest: { name: "Vitest", domain: "vitest.dev", category: "other" },
  cypress: { name: "Cypress", domain: "cypress.io", category: "other" },
  "@playwright/test": { name: "Playwright", domain: "playwright.dev", category: "other" },
  storybook: { name: "Storybook", domain: "storybook.js.org", category: "other" },
  turbo: { name: "Turborepo", domain: "turbo.build", category: "other" },
};

/**
 * Python requirement name → tool (requirements.txt / pyproject.toml).
 */
export const PYTHON_TOOL_MAP: Record<string, DetectedTool> = {
  django: { name: "Django", domain: "djangoproject.com", category: "backend" },
  flask: { name: "Flask", domain: "flask.palletsprojects.com", category: "backend" },
  fastapi: { name: "FastAPI", domain: "fastapi.tiangolo.com", category: "backend" },
  sqlalchemy: { name: "SQLAlchemy", domain: "sqlalchemy.org", category: "backend" },
  celery: { name: "Celery", domain: "celeryq.dev", category: "backend" },
  torch: { name: "PyTorch", domain: "pytorch.org", category: "ai" },
  tensorflow: { name: "TensorFlow", domain: "tensorflow.org", category: "ai" },
  openai: { name: "OpenAI", domain: "openai.com", category: "ai" },
  anthropic: { name: "Anthropic", domain: "anthropic.com", category: "ai" },
  langchain: { name: "LangChain", domain: "langchain.com", category: "ai" },
  transformers: { name: "Hugging Face", domain: "huggingface.co", category: "ai" },
  pandas: { name: "pandas", domain: "pandas.pydata.org", category: "other" },
  numpy: { name: "NumPy", domain: "numpy.org", category: "other" },
};

/**
 * GitHub repo `language` → tool. Coarse but reliable signal.
 */
export const LANGUAGE_TOOL_MAP: Record<string, DetectedTool> = {
  TypeScript: { name: "TypeScript", domain: "typescriptlang.org", category: "other" },
  JavaScript: { name: "JavaScript", domain: "developer.mozilla.org", category: "other" },
  Python: { name: "Python", domain: "python.org", category: "backend" },
  Go: { name: "Go", domain: "go.dev", category: "backend" },
  Rust: { name: "Rust", domain: "rust-lang.org", category: "backend" },
  Ruby: { name: "Ruby", domain: "ruby-lang.org", category: "backend" },
  PHP: { name: "PHP", domain: "php.net", category: "backend" },
  Java: { name: "Java", domain: "java.com", category: "backend" },
  Kotlin: { name: "Kotlin", domain: "kotlinlang.org", category: "backend" },
  Swift: { name: "Swift", domain: "swift.org", category: "frontend" },
  "C#": { name: "C#", domain: "dotnet.microsoft.com", category: "backend" },
};

/**
 * Presence of a file at the repo root → tool.
 */
export const FILE_TOOL_MAP: Record<string, DetectedTool> = {
  dockerfile: { name: "Docker", domain: "docker.com", category: "other" },
  "docker-compose.yml": { name: "Docker", domain: "docker.com", category: "other" },
  "vercel.json": { name: "Vercel", domain: "vercel.com", category: "other" },
  "netlify.toml": { name: "Netlify", domain: "netlify.com", category: "other" },
  "fly.toml": { name: "Fly.io", domain: "fly.io", category: "other" },
  "gemfile": { name: "Ruby on Rails", domain: "rubyonrails.org", category: "backend" },
  "cargo.toml": { name: "Rust", domain: "rust-lang.org", category: "backend" },
  "go.mod": { name: "Go", domain: "go.dev", category: "backend" },
  "pnpm-lock.yaml": { name: "pnpm", domain: "pnpm.io", category: "other" },
  "bun.lockb": { name: "Bun", domain: "bun.sh", category: "backend" },
  "bun.lock": { name: "Bun", domain: "bun.sh", category: "backend" },
};
