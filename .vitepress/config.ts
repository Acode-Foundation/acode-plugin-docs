import { defineConfig } from 'vitepress'
import { createRequire } from "node:module";

const requireI18n = (folder, label) => {
  const require = createRequire(import.meta.url);
  return {
    ...require(`../${folder}/config.ts`).default,
    label,
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // Change `/en` route to `/`
  rewrites: {
    'en/:rest*': ':rest*'
  },

  lastUpdated: true,
  cleanUrls: true,

  head: [['link', { rel: 'icon', href: '/acode.png' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/acode.png',
    search: {
      provider: 'local'
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Acode-Foundation/acode-plugin-docs'
      },
      { icon: 'discord', link: 'https://discord.gg/nDqZsh7Rqz' }
    ]
  },

  locales: {
    root: requireI18n("en", "English"),
    id: requireI18n("id", "Bahasa Indonesia")
  }
})
