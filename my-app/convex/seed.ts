import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * This is a one-time function to seed your database with tools
 * Run it once from the Convex dashboard or via CLI: npx convex run seed:seedTools
 */
export const seedTools = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if tools already exist to avoid duplicates
    const existingTools = await ctx.db.query("tools").take(1);
    if (existingTools.length > 0) {
      console.log("Tools already seeded. Skipping...");
      return null;
    }

    // Frontend tools
    const frontendTools = [
      { name: "React", url: "react.dev", category: "frontend" as const },
      { name: "Next.js", url: "nextjs.org", category: "frontend" as const },
      { name: "TanStack Query", url: "tanstack.com", category: "frontend" as const },
      { name: "Vue.js", url: "vuejs.org", category: "frontend" as const },
      { name: "Angular", url: "angular.io", category: "frontend" as const },
      { name: "Svelte", url: "svelte.dev", category: "frontend" as const },
      { name: "Remix", url: "remix.run", category: "frontend" as const },
      { name: "Astro", url: "astro.build", category: "frontend" as const },
      { name: "SolidJS", url: "solidjs.com", category: "frontend" as const },
      { name: "Qwik", url: "qwik.dev", category: "frontend" as const },
      { name: "SvelteKit", url: "kit.svelte.dev", category: "frontend" as const },
      { name: "Nuxt", url: "nuxt.com", category: "frontend" as const },
    ];

    // Backend tools
    const backendTools = [
      { name: "Node.js", url: "nodejs.org", category: "backend" as const },
      { name: "Express", url: "expressjs.com", category: "backend" as const },
      { name: "Fastify", url: "fastify.dev", category: "backend" as const },
      { name: "NestJS", url: "nestjs.com", category: "backend" as const },
      { name: "Python", url: "python.org", category: "backend" as const },
      { name: "Django", url: "djangoproject.com", category: "backend" as const },
      { name: "Flask", url: "flask.palletsprojects.com", category: "backend" as const },
      { name: "FastAPI", url: "fastapi.tiangolo.com", category: "backend" as const },
      { name: "Go", url: "go.dev", category: "backend" as const },
      { name: "Gin", url: "gin-gonic.com", category: "backend" as const },
      { name: "Rust", url: "rust-lang.org", category: "backend" as const },
      { name: "Actix", url: "actix.rs", category: "backend" as const },
      { name: "Java", url: "java.com", category: "backend" as const },
      { name: "Spring Boot", url: "spring.io", category: "backend" as const },
      { name: "PHP", url: "php.net", category: "backend" as const },
      { name: "Laravel", url: "laravel.com", category: "backend" as const },
      { name: "Ruby", url: "ruby-lang.org", category: "backend" as const },
      { name: "Ruby on Rails", url: "rubyonrails.org", category: "backend" as const },
    ];

    // IDE tools
    const ideTools = [
      { name: "Visual Studio Code", url: "code.visualstudio.com", category: "ide" as const },
      { name: "Cursor", url: "cursor.sh", category: "ide" as const },
      { name: "WebStorm", url: "jetbrains.com/webstorm", category: "ide" as const },
      { name: "IntelliJ IDEA", url: "jetbrains.com/idea", category: "ide" as const },
      { name: "PyCharm", url: "jetbrains.com/pycharm", category: "ide" as const },
      { name: "Sublime Text", url: "sublimetext.com", category: "ide" as const },
      { name: "Atom", url: "atom.io", category: "ide" as const },
      { name: "Vim", url: "vim.org", category: "ide" as const },
      { name: "Neovim", url: "neovim.io", category: "ide" as const },
      { name: "Emacs", url: "gnu.org/software/emacs", category: "ide" as const },
      { name: "Xcode", url: "developer.apple.com/xcode", category: "ide" as const },
      { name: "Android Studio", url: "developer.android.com/studio", category: "ide" as const },
    ];

    // AI tools
    const aiTools = [
      { name: "OpenAI", url: "openai.com", category: "ai" as const },
      { name: "Anthropic", url: "anthropic.com", category: "ai" as const },
      { name: "Google AI", url: "ai.google.dev", category: "ai" as const },
      { name: "Hugging Face", url: "huggingface.co", category: "ai" as const },
      { name: "Replicate", url: "replicate.com", category: "ai" as const },
      { name: "LangChain", url: "langchain.com", category: "ai" as const },
      { name: "LlamaIndex", url: "llamaindex.ai", category: "ai" as const },
      { name: "Pinecone", url: "pinecone.io", category: "ai" as const },
      { name: "Weaviate", url: "weaviate.io", category: "ai" as const },
      { name: "Cohere", url: "cohere.com", category: "ai" as const },
      { name: "Mistral AI", url: "mistral.ai", category: "ai" as const },
      { name: "Perplexity", url: "perplexity.ai", category: "ai" as const },
    ];

    // Other tools
    const otherTools = [
      { name: "Docker", url: "docker.com", category: "other" as const },
      { name: "Kubernetes", url: "kubernetes.io", category: "other" as const },
      { name: "Git", url: "git-scm.com", category: "other" as const },
      { name: "GitHub", url: "github.com", category: "other" as const },
      { name: "GitLab", url: "gitlab.com", category: "other" as const },
      { name: "Vercel", url: "vercel.com", category: "other" as const },
      { name: "Netlify", url: "netlify.com", category: "other" as const },
      { name: "AWS", url: "aws.amazon.com", category: "other" as const },
      { name: "Google Cloud", url: "cloud.google.com", category: "other" as const },
      { name: "Azure", url: "azure.microsoft.com", category: "other" as const },
      { name: "PostgreSQL", url: "postgresql.org", category: "other" as const },
      { name: "MongoDB", url: "mongodb.com", category: "other" as const },
      { name: "Redis", url: "redis.io", category: "other" as const },
      { name: "MySQL", url: "mysql.com", category: "other" as const },
      { name: "Supabase", url: "supabase.com", category: "other" as const },
      { name: "Firebase", url: "firebase.google.com", category: "other" as const },
    ];

    const allTools = [...frontendTools, ...backendTools, ...ideTools, ...aiTools, ...otherTools];

    console.log(`Seeding ${allTools.length} tools...`);

    for (const tool of allTools) {
      await ctx.db.insert("tools", tool);
    }

    console.log("✅ Tools seeded successfully!");
    return null;
  },
});
