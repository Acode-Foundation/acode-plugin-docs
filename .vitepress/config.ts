import { defineConfig } from 'vitepress'

import en from '../en/config.js'
import id from '../id/config.js'

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
    root: {
      ...en,
      label: 'English'
    },
    id: {
      ...id,
      label: 'Bahasa Indonesia'
    }
  }
})
