import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'id-ID',

  title: 'Dokumentasi Acode',
  description: 'Dokumentasi untuk pengguna baru dan pengembangan',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    search: { options: searchOptions() },

    footer: {
      message: 'Dirilis dibawah Lisensi MIT.',
      copyright: `Hak Cipta © 2019-${new Date().getFullYear()} <a class="link" href="//acode.app">Acode</a>`
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
      text: 'Memulai',
      collapsed: true,
      items: [
        { text: 'Pengantar', link: 'getting-started/intro' },
        {
          text: 'Membuat plugin baru',
          link: 'getting-started/create-plugin'
        },
        {
          text: 'Memahami Plugin',
          link: 'getting-started/understanding-plugin'
        }
      ]
    },
    {
      text: 'Dasar Plugin',
      collapsed: true,
      items: [
        {
          text: 'Manifesto',
          link: 'plugin-essentials/manifest'
        },
        {
          text: 'Berkas Inti',
          link: 'plugin-essentials/core-file'
        }
      ]
    },
    {
      text: 'API Global',
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
          text: 'AddedFolder',
          link: 'global-apis/added-folder'
        },
        {
          text: 'EditorManager',
          link: 'global-apis/editor-manager'
        },
        {
          text: 'Utilitas Global Lainnya',
          link: 'global-apis/global-utilities'
        }
      ]
    },
    {
      text: 'Komponen UI',
      collapsed: true,
      items: [
        {
          text: 'Dialog',
          collapsed: true,
          items: [
            {
              text: 'Pemberitahuan',
              link: 'ui-components/dialogs/alert'
            },
            {
              text: 'Konfirmasi',
              link: 'ui-components/dialogs/confirm'
            },
            {
              text: 'Pemilih Warna',
              link: 'ui-components/dialogs/color-picker'
            },
            {
              text: 'Pemuat',
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
              text: 'Pilih',
              link: 'ui-components/dialogs/select'
            },
            {
              text: 'Dialog Kostum',
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
          text: 'Menu Pilihan',
          link: 'ui-components/selection-menu'
        }
      ]
    },
    {
      text: 'Utilitas',
      collapsed: true,
      items: [
        {
          text: 'Sistem Berkas (fs)',
          link: 'utilities/fs'
        },
        {
          text: 'URL',
          link: 'utilities/url'
        },
        {
          text: 'Proyek',
          link: 'utilities/projects'
        },
        {
          text: 'Mode ACE',
          link: 'utilities/ace-modes'
        },
        {
          text: 'Enkoding',
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
          text: 'WindowResize',
          link: 'utilities/window-resize'
        }
      ]
    },
    {
      text: 'Komponen Editor',
      collapsed: true,
      items: [
        {
          text: 'Pencari Berkas',
          link: 'editor-components/file-browser'
        },
        {
          text: 'Berkas Editor',
          link: 'editor-components/editor-file'
        },
        {
          text: 'Daftar Berkas',
          link: 'editor-components/file-list'
        },
        {
          text: 'Halaman',
          link: 'editor-components/page'
        },
        {
          text: 'Palet',
          link: 'editor-components/palette'
        },
        {
          text: 'Pengaturan',
          link: 'editor-components/settings'
        }
      ]
    },
    {
      text: 'Pembantu',
      collapsed: true,
      items: [
        {
          text: 'Petunjuk Masukan',
          link: 'helpers/input-hints'
        },
        {
          text: 'Huruf',
          link: 'helpers/fonts'
        },
        {
          text: 'Tema',
          link: 'helpers/themes'
        },
        {
          text: 'Pembangun Tema',
          link: 'helpers/theme-builder'
        },
        {
          text: 'Warna',
          link: 'helpers/color'
        }
      ]
    },
    {
      text: 'API Tampilan',
      collapsed: true,
      items: [
        {
          text: 'Aplikasi Bilah Sisi',
          link: 'interface-apis/sidebar-apps'
        },
        {
          text: 'Tombol Sisi',
          link: 'interface-apis/side-buttons'
        },
        {
          text: 'Menu Konteks',
          link: 'interface-apis/context-menu'
        }
      ]
    },
    {
      text: 'API Lanjutan',
      collapsed: true,
      items: [
        {
          text: 'Stak Aksi',
          link: 'advanced-apis/action-stack'
        },

        {
          text: 'Maksud',
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
      text: 'Palet Perintah',
      link: 'command-palette'
    },
    {
      text: 'Cara menjalankan Java',
      link: 'how-to-run-java'
    }
  ]
}
