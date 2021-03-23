require('dotenv').config()

const pageTitle = 'zkSync Alternative Withdrawal'

export default {
  ssr: false,
  target: 'static',
  srcDir: 'src/',
  env: {
    ...process.env
  },

  /*
   ** Headers of the page
   */
  head: {
    name: pageTitle,
    titleTemplate: pageTitle,
    meta: [
      { 'http-equiv': 'pragma', content: 'no-cache' },
      { 'http-equiv': 'cache-control', content: 'no-cache , no-store, must-revalidate' },
      { 'http-equiv': 'expires', content: '0' },
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      },
      {
        hid: 'msapplication-TileImage',
        name: 'msapplication-TileImage',
        content: '/icon.png'
      },
      { hid: 'theme-color', name: 'theme-color', content: '#4e529a' },
      {
        hid: 'msapplication-TileColor',
        property: 'msapplication-TileColor',
        content: '#4e529a'
      }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: '#8c8dfc',
    continuous: true
  },
  /*
   ** Global CSS
   */
  css: ['@/assets/style/main.scss'],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: ['@/plugins/main'],

  router: {
    middleware: []
  },
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: ['@nuxt/typescript-build'],

  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/dotenv',
    '@nuxtjs/pwa',
    '@nuxtjs/axios',
    '@inkline/nuxt',
    'vue-scrollto/nuxt',
    '@nuxtjs/style-resources',
    "nuxt-webfontloader"
  ],
  webfontloader: {
    google: {
      families: ["Fira+Sans:400,600", "Fira+Sans+Extra+Condensed:400,600", "Fira+Code:400"],
    },
  },
  inkline: {
    config: {
      variant: 'dark'
    }
  },
  styleResources: {
    scss: '@/assets/style/_variables.scss'
  },
  /*
   ** Build configuration
   */
  build: {
    ssr: false,
    target: 'static',
    /* extractCSS: {
      ignoreOrder: true
    }, */
    extend (config) {
      config.node = {
        fs: 'empty'
      }
    }
  },
  generate: {
    dir: 'public',
    fallback: '404.html'
  },
  pwa: {
    workbox: {
      pagesURLPattern: '/_nuxt/'
    }
  }
}
