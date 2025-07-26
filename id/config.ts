import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'id-ID',

  title: 'Dokumentasi Acode',
  description: 'Documentation for new users and developers',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    search: { options: searchOptions() },

    footer: {
      message: 'Dirilis dibawah Lisensi MIT.',
      copyright: 'Hak Cipta © 2025 <a class="link" href="//acode.app">Acode</a>'
    },

    sidebar: {
      '/id/docs/': { base: '/id/docs/', items: sideBarDocs() },
      '/id/tutorials/': { base: '/id/tutorials/', items: sideBarTutorials() }
    },

    editLink: {
      pattern: 'https://github.com/Acode-Foundation/acode-plugin-docs/edit/main/:path',
      text: 'Edit halaman ini di GitHub'
    },

    docFooter: {
      prev: 'Halaman sebelumnya',
      next: 'Halaman selanjutnya'
    },

    outline: {
      label: 'Di halaman ini'
    },

    lastUpdated: {
      text: 'Terakhir diperbarui'
    },

    notFound: {
      title: 'HALAMAN TIDAK DITEMUKAN',
      quote:
        'Tetapi jika Anda tidak mengubah arah Anda, dan jika Anda terus mencari, Anda mungkin berakhir di tempat yang Anda tuju.',
      linkLabel: 'pergi ke beranda',
      linkText: 'Bawa saya ke beranda'
    },

    langMenuLabel: 'Ubah bahasa',
    returnToTopLabel: 'Kembali ke atas',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Penampilan',
    lightModeSwitchTitle: 'Ubah ke tema terang',
    darkModeSwitchTitle: 'Ubah ke tema gelap',
    skipToContentLabel: 'Lewati konten'
  }
})

// Navigation
function nav() {
  return [
    { text: 'Beranda', link: '/id/' },
    { text: 'Dokumentasi', link: '/id/docs' },
    { text: 'Tutorial', link: '/id/tutorials' }
  ]
}

function searchOptions() {
  return {
    translations: {
      button: { buttonText: 'Pencarian', buttonAriaLabel: 'Pencarian' },
      modal: {
        displayDetails: 'Menampilkan daftar detail',
        resetButtonTitle: 'Atur ulang pencarian',
        backButtonTitle: 'Tutup pencarian',
        noResultsText: 'Tidak ada hasil untuk',
        footer: {
          selectText: 'untuk memilih',
          selectKeyAriaLabel: 'masuk',
          navigateText: 'untuk menavigasi',
          navigateUpKeyAriaLabel: 'panah atas',
          navigateDownKeyAriaLabel: 'panah bawah',
          closeText: 'untuk menutup',
          closeKeyAriaLabel: 'melarikan diri'
        }
      }
    }
  }
}

// Sidebar in Docs route
function sideBarDocs() {
  return [
    {
      text: 'Getting Started',
      collapsed: true,
      items: [
        { text: 'Introduction', link: 'getting-started/intro' },
        {
          text: 'Create new plugin',
          link: 'getting-started/create-plugin'
        },
        {
          text: 'Understanding Plugins',
          link: 'getting-started/understanding-plugin'
        }
      ]
    },
    {
      text: 'Plugin Essentials',
      collapsed: true,
      items: [
        {
          text: 'Manifest',
          link: 'plugin-essentials/manifest'
        },
        {
          text: 'Core File',
          link: 'plugin-essentials/core-file'
        }
      ]
    },
    {
      text: 'Global APIs',
      collapsed: true,
      items: [
        {
          text: 'Ace',
          link: 'global-apis/ace'
        },
        {
          text: 'Acode',
          link: 'global-apis/acode'
        },
        {
          text: 'Added Folder',
          link: 'global-apis/added-folder'
        },
        {
          text: 'EditorManager',
          link: 'global-apis/editor-manager'
        },
        {
          text: 'Other Global Utilities',
          link: 'global-apis/global-utilities'
        }
      ]
    },
    {
      text: 'UI Components',
      collapsed: true,
      items: [
        {
          text: 'Dialogs',
          collapsed: true,
          items: [
            {
              text: 'Alert',
              link: 'ui-components/dialogs/alert'
            },
            {
              text: 'Confirm',
              link: 'ui-components/dialogs/confirm'
            },
            {
              text: 'Color Picker',
              link: 'ui-components/dialogs/color-picker'
            },
            {
              text: 'Loader',
              link: 'ui-components/dialogs/loader'
            },
            {
              text: 'Multi Prompt',
              link: 'ui-components/dialogs/multi-prompt'
            },
            {
              text: 'Prompt',
              link: 'ui-components/dialogs/prompt'
            },
            {
              text: 'Select',
              link: 'ui-components/dialogs/select'
            },
            {
              text: 'Custom Dialog',
              link: 'ui-components/dialogs/custom-dialog'
            }
          ]
        },
        {
          text: 'Toast',
          link: 'ui-components/toast'
        },
        {
          text: 'Tutorial',
          link: 'ui-components/tutorial'
        },
        {
          text: 'Selection Menu',
          link: 'ui-components/selection-menu'
        }
      ]
    },
    {
      text: 'Utilities',
      collapsed: true,
      items: [
        {
          text: 'File System(fs)',
          link: 'utilities/fs'
        },
        {
          text: 'URL',
          link: 'utilities/url'
        },
        {
          text: 'Projects',
          link: 'utilities/projects'
        },
        {
          text: 'ACE Modes',
          link: 'utilities/ace-modes'
        },
        {
          text: 'Encoding',
          link: 'utilities/encoding'
        },
        {
          text: 'OpenFolder',
          link: 'utilities/open-folder'
        },
        {
          text: 'Keyboard',
          link: 'utilities/keyboard'
        },
        {
          text: 'CreateKeyboardEvent',
          link: 'utilities/keyboard-event'
        },
        {
          text: 'Window Resize',
          link: 'utilities/window-resize'
        }
      ]
    },
    {
      text: 'Editor Components',
      collapsed: true,
      items: [
        {
          text: 'File Browser',
          link: 'editor-components/file-browser'
        },
        {
          text: 'Editor File',
          link: 'editor-components/editor-file'
        },
        {
          text: 'File List',
          link: 'editor-components/file-list'
        },
        {
          text: 'Page',
          link: 'editor-components/page'
        },
        {
          text: 'Palette',
          link: 'editor-components/palette'
        },
        {
          text: 'Settings',
          link: 'editor-components/settings'
        }
      ]
    },
    {
      text: 'Helpers',
      collapsed: true,
      items: [
        {
          text: 'Input Hints',
          link: 'helpers/input-hints'
        },
        {
          text: 'Fonts',
          link: 'helpers/fonts'
        },
        {
          text: 'Themes',
          link: 'helpers/themes'
        },
        {
          text: 'Theme Builder',
          link: 'helpers/theme-builder'
        },
        {
          text: 'Color',
          link: 'helpers/color'
        }
      ]
    },
    {
      text: 'Interface APIs',
      collapsed: true,
      items: [
        {
          text: 'SideBar Apps',
          link: 'interface-apis/sidebar-apps'
        },
        {
          text: 'Side Buttons',
          link: 'interface-apis/side-buttons'
        },
        {
          text: 'Context Menu',
          link: 'interface-apis/context-menu'
        }
      ]
    },
    {
      text: 'Advanced APIs',
      collapsed: true,
      items: [
        {
          text: 'Action Stack',
          link: 'advanced-apis/action-stack'
        },

        {
          text: 'Intent',
          link: 'advanced-apis/intent'
        }
      ]
    }
  ]
}

// Sidebar in Tutorials route
function sideBarTutorials() {
  return [
    {
      text: 'Command Palette',
      link: 'command-palette'
    },
    {
      text: 'How to run java',
      link: 'how-to-run-java'
    }
  ]
}
