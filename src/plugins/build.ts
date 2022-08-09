import { NuxtOptionsBuild } from "@nuxt/types/config/build";

type networkIDS = {
  [key: string]: number;
};
const _ETHER_NETWORK_ID_DICTIONARY = {
  goerli: 5,
  sepolia: 11155111,
  mainnet: 1,
  localhost: 9,
} as networkIDS;

export const GIT_REVISION_DATE = process.env.APP_GIT_UPDATED_AT;
export const APP_VERSION = process.env.APP_GIT_VERSION;

/**
 * @deprecated
 */
console.log(`This is ${APP_VERSION}, last commit was done at ${GIT_REVISION_DATE}`);

export const GIT_REVISION = process.env.APP_GIT_REVISION ? process.env.APP_GIT_REVISION.toString() : "";
export const GIT_REVISION_SHORT = GIT_REVISION ? GIT_REVISION.slice(-7) : "";

export const ETHER_NETWORK_NAME: string = process.env.APP_CURRENT_NETWORK || "";

export const ETHER_PRODUCTION = ETHER_NETWORK_NAME === "mainnet";

export const ETHER_PREFIX = ETHER_PRODUCTION ? "" : ETHER_NETWORK_NAME;

export const ETHER_NETWORK_ID = _ETHER_NETWORK_ID_DICTIONARY[ETHER_NETWORK_NAME];
export const APP_ZKSYNC_API_LINK = `https://${ETHER_PREFIX ? ETHER_PREFIX + "-" : ""}api.zksync.io`;
export const APP_ZK_SCAN = `https://${ETHER_PREFIX ? ETHER_PREFIX + "." : ""}zkscan.io`;
export const APP_ETH_BLOCK_EXPLORER = `https://${ETHER_PREFIX ? ETHER_PREFIX + "." : ""}.etherscan.io`;
export const APP_WS_API = `wss://${ETHER_PREFIX ? ETHER_PREFIX + "." : ""}api.zksync.io/jsrpc-ws`;

const env = process.env.APP_ENV ?? "dev";
export const isProduction: boolean = ETHER_PRODUCTION && env === "prod";
export const isDebugEnabled: boolean = env === "dev";
const nuxtBuildOptionsDefault: NuxtOptionsBuild = {
  corejs: 3,
  ssr: false,
};
const nuxtBuildProdOptions: NuxtOptionsBuild = {
  ...nuxtBuildOptionsDefault,
  babel: {
    compact: true,
  },
  extractCSS: {
    ignoreOrder: true,
  },
  optimization: {
    removeAvailableModules: true,
    flagIncludedChunks: true,
    mergeDuplicateChunks: true,
    splitChunks: {
      chunks: "all",
      name: isProduction ? undefined : "chunk",
      maxSize: 900 * 1024,
    },
    nodeEnv: isProduction ? "14" : false,
    minimize: isProduction,
  },
  hardSource: isProduction,
};

export const nuxtBuildConfig = isProduction ? nuxtBuildProdOptions : nuxtBuildOptionsDefault;
