require('dotenv').config();

const pageTitle = 'zkSync Alternative Withdrawal from L2 back to mainnet';
const pageDescription = 'If you have funds on zkSync on an account that you can\'t control (a smart contract or an exchange deposit account) ' +
  'it is possible to use the Alternative Withdrawal to move the funds to Layer 1 without interacting with Layer 2.'
const pageKeywords = "zksync withdrawal, alternative withdrawal, bulk withdrawal, zkSync, Matter Labs, rollup, ZK rollup, zero confirmation, ZKP, zero-knowledge proofs," +
  " Ethereum, crypto," +
  " blockchain, permissionless," +
  " L2," +
  " secure payments, scalable\n" +
  "crypto payments"

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
      {
        hid: "keywords",
        name: "keywords",
        content: pageKeywords,
      },
      {
        hid: "author",
        name: "author",
        content: "https://matter-labs.io",
      },
      { 'http-equiv': 'pragma', content: 'no-cache' },
      { 'http-equiv': 'cache-control', content: 'no-cache , no-store, must-revalidate' },
      { 'http-equiv': 'expires', content: '0' },
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: pageDescription
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
    '@nuxtjs/pwa',
    '@nuxtjs/axios',
    '@inkline/nuxt',
    'vue-scrollto/nuxt',
    '@nuxtjs/style-resources',
    'nuxt-webfontloader',
    [
      'nuxt-social-meta',
      {
        url: 'https://withdraw.zksync.io',
        title: pageTitle,
        site_name: pageTitle,
        description: pageDescription,
        img: 'https://zksync.io/social.jpg',
        locale: 'en_US',
        twitter: '@zksync',
        twitter_card: 'https://zksync.io/social.jpg',
        themeColor: '#4e529a',
      },
    ],
  ],
  webfontloader: {
    google: {
      families: ['Fira+Sans:400,600', 'Fira+Sans+Extra+Condensed:400,600', 'Fira+Code:400'],
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
      };
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
};
