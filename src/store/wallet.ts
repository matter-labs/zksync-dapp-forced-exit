import { ethers } from "ethers";
import { ActionTree, GetterTree, MutationTree } from "vuex";

import Onboard from "@matterlabs/zk-wallet-onboarding";

import onboardConfig from "@/plugins/onboardConfig";
import web3Wallet from "@/plugins/web3";
import watcher from "@/plugins/watcher";

import { walletData } from "@/plugins/walletData";
import { RootState } from "~/store";

export const state = () => ({
  onboard: false as any,
  isAccountLocked: false,
});

export type WalletModuleState = ReturnType<typeof state>;

export const mutations: MutationTree<WalletModuleState> = {
  setOnboard(state, obj: any) {
    state.onboard = obj;
  },
};

export const getters: GetterTree<WalletModuleState, RootState> = {
  getOnboard(state): any {
    return state.onboard;
  },
  isLoggedIn(): boolean {
    return !!(walletData.get().syncWallet && walletData.get().syncWallet?.address);
  },
};

export const actions: ActionTree<WalletModuleState, RootState> = {
  /**
   * Initial call, connecting to the wallet
   * @param commit
   * @return {Promise<boolean>}
   */
  async onboard({ commit }): Promise<void> {
    const onboard = Onboard(onboardConfig(this));
    commit("setOnboard", onboard);
    this.commit("account/setSelectedWallet", "");
  },

  /**
   * Check if the connection to the sync provider is opened and if not - restore it
   */
  async restoreProviderConnection(): Promise<void> {
    const syncProvider = walletData.get().syncProvider;
    if (syncProvider && syncProvider.transport.ws && !syncProvider.transport.ws.isOpened) {
      await syncProvider.transport.ws.open();
    }
  },

  async walletRefresh({ getters, dispatch }, firstSelect = true): Promise<boolean> {
    try {
      const onboard = getters["getOnboard"];
      this.commit("account/setLoadingHint", "followInstructions");
      let walletCheck = false;
      if (firstSelect) {
        walletCheck = await onboard.walletSelect();
        if (!walletCheck) {
          return false;
        }
        walletCheck = await onboard.walletCheck();
      } else {
        walletCheck = await onboard.walletCheck();
      }
      if (!walletCheck) {
        return false;
      }
      if (!web3Wallet.get().eth) {
        return false;
      }
      const getAccounts = await web3Wallet.get().eth.getAccounts();
      if (getAccounts.length === 0) {
        return false;
      }
      if (walletData.get().syncWallet) {
        this.commit("account/setAddress", walletData.get().syncWallet!.address());
        this.commit("account/setLoggedIn", true);
        return true;
      }

      /**
       * @type {provider}
       */
      const currentProvider = web3Wallet.get().eth.currentProvider;
      /**
       * noinspection ES6ShorthandObjectProperty
       */
      const ethWallet = new ethers.providers.Web3Provider(currentProvider).getSigner();

      await dispatch('restoreProviderConnection');
      const zksync = await walletData.zkSync();
      const syncProvider = walletData.get().syncProvider;
      const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

      this.commit("account/setLoadingHint", "loadingData");
      const accountState = await syncWallet.getAccountState();

      walletData.set({ syncWallet, accountState, ethWallet });

      await watcher.changeNetworkSet(dispatch, this);

      this.commit("account/setAddress", syncWallet.address());
      this.commit("account/setLoggedIn", true);
      return true;
    } catch (error) {
      if (!error.message.includes("User denied")) {
        // this.dispatch("toaster/error", `Refreshing state of the wallet failed... Reason: ${error.message}`);
        /* this.dispatch("toaster/error", error.message); */
      }
      return false;
    }
  },
  logout({ commit, getters }): void {
    const onboard = getters.getOnboard;
    onboard.walletReset();
    walletData.set({ syncProvider: null, syncWallet: null, accountState: null });
    localStorage.removeItem("selectedWallet");
    this.commit("account/setLoggedIn", false);
    this.commit("account/setSelectedWallet", "");
  },
};
