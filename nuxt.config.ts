import { NuxtOptionsEnv } from "@nuxt/types/config/env";

import { NuxtConfig } from "@nuxt/types";
import { isProduction, nuxtBuildConfig } from "./src/plugins/build";

const srcDir = "./src/";

const pageTitle = "zkSync Alternative Withdrawal from L2 back to mainnet";
const pageTitleTemplate = pageTitle;
const pageDescription = "Easily move your funds to L1 without interaction with L2.";
const pageImg = "/cover.jpg";
const pageKeywords = [
  "zksync withdrawal",
  "alternative withdrawal",
  "bulk withdrawal",
  "zkSync",
  "Matter Labs",
  "rollup",
  "ZK rollup",
  "zero confirmation",
  "ZKP",
  "zero-knowledge proofs",
  "Ethereum",
  "crypto",
  "blockchain",
  "permissionless",
  "L2",
  "secure payments",
  "scalable",
  "crypto payments",
].join(", ");

const config: NuxtConfig = {
  components: ["@/components/", { path: "@/blocks/", prefix: "block" }],
  telemetry: false,

  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  srcDir: `${srcDir}`,
  vue: {
    config: {
      productionTip: isProduction,
      devtools: !isProduction,
    },
  },
  env: <NuxtOptionsEnv>{
    ...process.env,
  },

  /**
   * Global page headers: https://go.nuxtjs.dev/config-head
   */
  head: {
    title: pageTitle as string | undefined,
    titleTemplate: `%s | ${pageTitleTemplate}`,
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      {
        property: "cache-control",
        httpEquiv: "cache-control",
        content: "no-cache , no-store, must-revalidate",
      },
      {
        httpEquiv: "pragma",
        content: "no-cache",
        property: "pragma",
      },
      {
        httpEquiv: "cache-control",
        property: "cache-control",
        content: "no-cache , no-store, must-revalidate",
      },
      {
        httpEquiv: "expires",
        content: "0",
        property: "expires",
      },
      {
        hid: "keywords",
        name: "keywords",
        content: pageKeywords,
      },
      {
        hid: "description",
        name: "description",
        content: pageDescription,
      },
      {
        hid: "author",
        name: "author",
        content: "https://matter-labs.io",
      },
      {
        hid: "twitter:title",
        name: "twitter:title",
        content: pageTitle,
      },
      {
        hid: "twitter:description",
        name: "twitter:description",
        content: pageDescription,
      },
      {
        hid: "twitter:image",
        name: "twitter:image",
        content: pageImg,
      },
      {
        hid: "twitter:site",
        name: "twitter:site",
        content: "@zksync",
      },
      {
        hid: "twitter:creator",
        name: "twitter:creator",
        content: "@the_matter_labs",
      },
      {
        hid: "twitter:image:alt",
        name: "twitter:image:alt",
        content: pageTitle,
      },
      {
        hid: "og:title",
        property: "og:title",
        content: pageTitle,
      },
      {
        hid: "og:description",
        property: "og:description",
        content: pageDescription,
      },
      {
        hid: "og:image",
        property: "og:image",
        content: pageImg,
      },
      {
        hid: "og:image:secure_url",
        property: "og:image:secure_url",
        content: pageImg,
      },
      {
        hid: "og:image:alt",
        property: "og:image:alt",
        content: pageTitle,
      },

      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "msapplication-TileImage",
        name: "msapplication-TileImage",
        content: "/favicon-dark.png",
      },
      { hid: "theme-color", name: "theme-color", content: "#4e529a" },
      {
        hid: "msapplication-TileColor",
        property: "msapplication-TileColor",
        content: "#4e529a",
      },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon-dark.png" }],
  },

  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: "#8c8dfc",
    continuous: true,
  },

  /**
   *  Global CSS: https://go.nuxtjs.dev/config-css
   */
  css: ["@/assets/style/main.scss"],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: ["@/plugins/main"],

  router: {
    middleware: [],
  },

  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    "@nuxt/typescript-build",
    // Doc: https://github.com/nuxt-community/stylelint-module
    "@nuxtjs/style-resources",
    ["@nuxtjs/dotenv", { path: __dirname }],
  ],

  /**
   * Modules: https://go.nuxtjs.dev/config-modules
   */
  modules: [
    "nuxt-webfontloader",
    "@inkline/nuxt",
    [
      "nuxt-social-meta",
      {
        url: "https://withdraw.zksync.io",
        title: pageTitle,
        site_name: pageTitle,
        description: pageDescription,
        img: "https://withdraw.zksync.io" + pageImg,
        locale: "en_US",
        twitter: "@zksync",
        twitter_card: "https://withdraw.zksync.io" + pageImg,
        themeColor: "#4e529a",
      },
    ],
  ],
  styleResources: {
    scss: ["@/assets/style/_variables.scss"],
  },
  // Fonts loader https://www.npmjs.com/package/nuxt-webfontloader
  webfontloader: {
    google: {
      families: ["Fira+Sans:400,600", "Fira+Sans+Extra+Condensed:400,600", "Fira+Code:400"],
    },
  },
  inkline: {
    config: {
      variant: "dark",
    },
  },

  /*
   ** Build configuration
   */
  build: {
    ...nuxtBuildConfig,
    /*
     ** You can extend webpack config here
     */
    extend(config) {
      config.node = {
        fs: "empty",
      };
      // Run ESLint on save
      // if (ctx.isDev && ctx.isClient) {
      //   config.module.rules.push({
      //     enforce: "pre",
      //     test: /\.(js|ts|vue)$/,
      //     loader: "eslint-loader",
      //     exclude: /(node_modules)/
      //   });
      // }
    },
    postcss: {
      preset: {
        autoprefixer: { grid: "autoplace" },
      },
    },
  },
  generate: {
    dir: "public",
    fallback: "404.html",
    devtools: !isProduction,
  },
};
export default config;
