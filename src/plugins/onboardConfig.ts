import Web3 from "web3";
import web3Wallet from "@/plugins/web3";
import { ETHER_NETWORK_ID, ETHER_NETWORK_NAME } from "@/plugins/build";

const APP_NAME = "zkSync Lite Alternative Withdrawal";
const FORTMATIC_KEY = process.env.APP_FORTMATIC;
const INFURA_KEY = process.env.APP_INFURA_KEY;
const RPC_URL = `https://${ETHER_NETWORK_NAME}.infura.io/v3/${process.env.APP_WS_API_ETHERSCAN_TOKEN}`;
const initializedWallets = {
  wallets: [
    { walletName: "metamask", preferred: true },
    {
      walletName: "walletConnect",
      networkId: ETHER_NETWORK_ID,
      infuraKey: INFURA_KEY,
      enableLogging: true,
      preferred: true,
    },
    // FIXME: enable again
    // { walletName: "authereum" },
    { walletName: "coinbase", preferred: true },
    { walletName: "trust", preferred: true, rpcUrl: RPC_URL },
    { walletName: "dapper", preferred: false },
    {
      walletName: "ledger",
      rpcUrl: RPC_URL,
    },
    {
      walletName: "lattice",
      rpcUrl: RPC_URL,
      appName: APP_NAME,
    },
    {
      walletName: "fortmatic",
      apiKey: FORTMATIC_KEY,
      preferred: true,
    },
    {
      walletName: "portis",
      apiKey: process.env.APP_PORTIS,
      preferred: true,
      label: "Portis",
    },
    { walletName: "opera" },
    { walletName: "operaTouch" },
    { walletName: "torus" },
    { walletName: "status" },
    { walletName: "imToken", rpcUrl: RPC_URL },
    { walletName: "meetone" },
    { walletName: "mykey", rpcUrl: RPC_URL },
    { walletName: "huobiwallet", rpcUrl: RPC_URL },
    { walletName: "hyperpay" },
    { walletName: "wallet.io", rpcUrl: RPC_URL },
    { walletName: "atoken" },
  ],
};
export default (ctx: any) => {
  return {
    hideBranding: true,
    blockPollingInterval: 400000,
    dappId: process.env.APP_ONBOARDING_APP_ID, // [String] The API key created by step one above
    networkId: ETHER_NETWORK_ID, // [Integer] The Ethereum network ID your Dapp uses.
    darkMode: true,
    subscriptions: {
      wallet: (wallet: any) => {
        if (wallet && wallet.provider) {
          wallet.provider.autoRefreshOnNetworkChange = false;
        }
        web3Wallet.set(new Web3(wallet.provider));
        if (process.client) {
          ctx.commit("account/setSelectedWallet", wallet.name, { root: true });
          window.localStorage.setItem("selectedWallet", wallet.name);
        }
      },
    },
    walletSelect: {
      wallets: initializedWallets.wallets,
    },
  };
};
