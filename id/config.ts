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
        { text: 'Introduction', link: '/id/docs/getting-started/intro' },
        {
          text: 'Create new plugin',
          link: '/id/docs/getting-started/create-plugin'
        },
        {
          text: 'Understanding Plugins',
          link: '/id/docs/getting-started/understanding-plugin'
        }
      ]
    },
    {
      text: 'Plugin Essentials',
      collapsed: true,
      items: [
        {
          text: 'Manifest',
          link: '/id/docs/plugin-essentials/manifest'
        },
        {
          text: 'Core File',
          link: '/id/docs/plugin-essentials/core-file'
        }
      ]
    },
    {
      text: 'Global APIs',
      collapsed: true,
      items: [
        {
          text: 'Ace',
          link: '/id/docs/global-apis/ace'
        },
        {
          text: 'Acode',
          link: '/id/docs/global-apis/acode'
        },
        {
          text: 'Added Folder',
          link: '/id/docs/global-apis/added-folder'
        },
        {
          text: 'EditorManager',
          link: '/id/docs/global-apis/editor-manager'
        },
        {
          text: 'Other Global Utilities',
          link: '/id/docs/global-apis/global-utilities'
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
              link: '/id/docs/ui-components/dialogs/alert'
            },
            {
              text: 'Confirm',
              link: '/id/docs/ui-components/dialogs/confirm'
            },
            {
              text: 'Color Picker',
              link: '/id/docs/ui-components/dialogs/color-picker'
            },
            {
              text: 'Loader',
              link: '/id/docs/ui-components/dialogs/loader'
            },
            {
              text: 'Multi Prompt',
              link: '/id/docs/ui-components/dialogs/multi-prompt'
            },
            {
              text: 'Prompt',
              link: '/id/docs/ui-components/dialogs/prompt'
            },
            {
              text: 'Select',
              link: '/id/docs/ui-components/dialogs/select'
            },
            {
              text: 'Custom Dialog',
              link: '/id/docs/ui-components/dialogs/custom-dialog'
            }
          ]
        },
        {
          text: 'Toast',
          link: '/id/docs/ui-components/toast'
        },
        {
          text: 'Tutorial',
          link: '/id/docs/ui-components/tutorial'
        },
        {
          text: 'Selection Menu',
          link: '/id/docs/ui-components/selection-menu'
        }
      ]
    },
    {
      text: 'Utilities',
      collapsed: true,
      items: [
        {
          text: 'File System(fs)',
          link: '/id/docs/utilities/fs'
        },
        {
          text: 'URL',
          link: '/id/docs/utilities/url'
        },
        {
          text: 'Projects',
          link: '/id/docs/utilities/projects'
        },
        {
          text: 'ACE Modes',
          link: '/id/docs/utilities/ace-modes'
        },
        {
          text: 'Encoding',
          link: '/id/docs/utilities/encoding'
        },
        {
          text: 'OpenFolder',
          link: '/id/docs/utilities/open-folder'
        },
        {
          text: 'Keyboard',
          link: '/id/docs/utilities/keyboard'
        },
        {
          text: 'CreateKeyboardEvent',
          link: '/id/docs/utilities/keyboard-event'
        },
        {
          text: 'Window Resize',
          link: '/id/docs/utilities/window-resize'
        }
      ]
    },
    {
      text: 'Editor Components',
      collapsed: true,
      items: [
        {
          text: 'File Browser',
          link: '/id/docs/editor-components/file-browser'
        },
        {
          text: 'Editor File',
          link: '/id/docs/editor-components/editor-file'
        },
        {
          text: 'File List',
          link: '/id/docs/editor-components/file-list'
        },
        {
          text: 'Page',
          link: '/id/docs/editor-components/page'
        },
        {
          text: 'Palette',
          link: '/id/docs/editor-components/palette'
        },
        {
          text: 'Settings',
          link: '/id/docs/editor-components/settings'
        }
      ]
    },
    {
      text: 'Helpers',
      collapsed: true,
      items: [
        {
          text: 'Input Hints',
          link: '/id/docs/helpers/input-hints'
        },
        {
          text: 'Fonts',
          link: '/id/docs/helpers/fonts'
        },
        {
          text: 'Themes',
          link: '/id/docs/helpers/themes'
        },
        {
          text: 'Theme Builder',
          link: '/id/docs/helpers/theme-builder'
        },
        {
          text: 'Color',
          link: '/id/docs/helpers/color'
        }
      ]
    },
    {
      text: 'Interface APIs',
      collapsed: true,
      items: [
        {
          text: 'SideBar Apps',
          link: '/id/docs/interface-apis/sidebar-apps'
        },
        {
          text: 'Side Buttons',
          link: '/id/docs/interface-apis/side-buttons'
        },
        {
          text: 'Context Menu',
          link: '/id/docs/interface-apis/context-menu'
        }
      ]
    },
    {
      text: 'Advanced APIs',
      collapsed: true,
      items: [
        {
          text: 'Action Stack',
          link: '/id/docs/advanced-apis/action-stack'
        },

        {
          text: 'Intent',
          link: '/id/docs/advanced-apis/intent'
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
      link: '/id/tutorials/command-palette'
    },
    {
      text: 'How to run java',
      link: '/id/tutorials/how-to-run-java'
    }
  ]
}
