<template>
  <div >
    <header-component />
    <div class="indexPage" :class="{'hasRequests': (requestsList.length>0 && step===0)}">
      <i-modal v-model="howThisWorksModal" size="md" class="howThisWorksModal">
        <template slot="header">How does this all work?</template>
        <div>
        <div>
          <b>zkSync alternative withdrawal</b> is way to get funds to Layer 1 without interacting directly with the protocol. zkSync supports most of web3-compatible wallets,
          so we highly recommend you to use the <a href="http://wallet.zksync.io/" target="_blank" >official client</a> to withdraw funds if that is possible as it is cheaper and more convenient.</div>
          <div class="_margin-top-1">In order for the account to be eligible for an alternative withdrawal all of the following must be true:
            <ul>
              <li>It must exist (hold any funds) in the zkSync network for at least 24 hours.</li>
              <li>The account must be locked (no ChangePubKey operation so far).</li>
            </ul>
          </div>
          <div>The amount to compensate is somewhat higher than the base fee due to technical reasons, but the overhead is negligible (less than 0.000001 ETH).</div>
        </div>
      </i-modal>
      <i-modal v-model="manualWarningModal" size="md">
        <template slot="header">Manual withdraw warning</template>
        <div>
          You will be provided with an address and fee amount. You will have to send <b>exactly given amount to the provided address</b> in order for the withdraw to be fulfilled.
          <i-checkbox class="_margin-top-1" v-model="manualWarningCheckmark">I do understand that in case of any mistake in address, amount or timeframes my funds would be lost</i-checkbox>
          <i-button block variant="secondary" :disabled="!manualWarningCheckmark" class="_margin-top-1" @click="manualWarningModal=false;withdrawManually()">Continue</i-button>
          <i-button block link variant="secondary" class="_margin-top-05" @click="manualWarningModal=false">Cancel</i-button>
        </div>
      </i-modal>
      <div class="tileBlock">
        <div class="tileHeadline h3" :class="{'withBtn': step===1}">
          <div v-if="step===1" class="returnBtn" @click="step=0">
              <i class="far fa-long-arrow-alt-left"></i>
          </div>
          <div class="_margin-left-1">Alternative Withdrawal <i class="fas fa-question questionMark" @click="toggleHowThisWorksModal()"></i></div>
        </div>
        <div class="formContainer">
          <transition name="fade">
            <div v-if="loading" class="centerBlock loaderBlock">
              <loader/>
            </div>
          </transition>
          <div v-if="step===0" class="_margin-top-2">
            <address-input v-model="address" @change="setSubError"/>
            <div v-if="subErrorType==='Active'" class="errorText _text-center _margin-top-1 secondaryText">
              The provided account has done transactions on zkSync before.
              <br/>Please go to the <a target="_blank" href="http://wallet.zksync.io/" class="linkText">official wallet</a> to withdraw the funds.
            </div>
            <div v-if="subErrorType==='NotExists'" class="errorText _text-center _margin-top-1 secondaryText">
              The account does not exist on zkSync network.
            </div>
            <div v-if="subErrorType==='TooYoung'" class="errorText _text-center _margin-top-1 secondaryText">
              To perform an alternative withdrawal an account should exist in zkSync network for at least 24 hours.
            </div>
            <div v-if="subErrorType==='Other'" class="errorText _text-center _margin-top-1 secondaryText">
              {{subError}}
            </div>

            <i-button block sizemax="lg" variant="secondary" :disabled="!address" class="_margin-top-1" @click="checkAddress()">Continue</i-button>
          </div>
          <div v-else-if="step===-1 && modalParams.open">
            <p class="_text-center _margin-top-0">
              {{modalParams.message}}
            </p>
            <p v-if="modalParams.social" class="_text-center">If you think this is a mistake, contact us by</p>
            <support-block v-if="modalParams.social" />
            <i-button v-if="modalParams.closable" block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
          </div>
          <div v-else-if="step===1">
            <i-input v-model="search" class="_margin-top-1" placeholder="Filter tokens" maxlength="6">
              <i slot="prefix" class="far fa-search"></i>
            </i-input>
            <div v-if="balancesList.length===0" class="centerBlock _margin-top-2">
              <span>The account's balance is empty</span>
            </div>
            <div v-else-if="search && displayedList.length===0" class="centerBlock _margin-top-2">
              <span>Your search <b>"{{ search }}"</b> did not match any tokens</span>
            </div>
            <div v-else class="balancesList _margin-top-1">
              <div v-for="(item,index) in displayedList" :key="index">
                <i-tooltip :disabled="!maxTokensReached || item.choosed" class="witdth-100 height-60">
                  <div class="no-padding balanceItem cursor-pointer" :class="[(maxTokensReached && !item.choosed) ? 'disabled' : 'enabled', {'checked': item.choosed}]" @click="setItemChecked(item)">
                    <div class="leftSide">
                      <div class="checkboxContainer">
                        <i class="far fa-check"></i>
                      </div>
                      <div class="tokenSymbol">{{ item.symbol }}</div>
                    </div>
                    <div class="rightSide">
                      <div class="rowItem">
                        <div class="total"><span class="balancePrice">{{ item.rawBalance | formatUsdAmount(item.tokenPrice, item.symbol) }}</span>&nbsp;&nbsp;{{ item.rawBalance | formatToken(item.symbol) }}</div>
                      </div>
                    </div>
                  </div>
                  <template slot="body">Can't select more than {{featureStatus.maxTokensPerRequest}} tokens</template>
                </i-tooltip>
              </div>
            </div>

            <div class="_text-center expectedInfo _display-block _margin-top-2">
                Fee: ~{{ currentExpectedFee | formatToken('ETH') }} ETH
                <span class="expectedPrice"><span class="">{{ currentExpectedFee | formatUsdAmount(tokenPricesMap['ETH'], 'ETH') }}</span></span>
            </div>
            <i-button block size="lg" variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-1" @click="withdraw()">{{loggedIn ? 'Withdraw with the wallet' : 'Connect wallet and Withdraw'}}</i-button>
            <i-button block link variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-05" @click="withdrawManuallyAsk()">Continue with the manual withdraw</i-button>
          </div>
          <div v-else-if="step===2">
            <p class="_text-center _margin-top-0">
              Your request was saved under <b>#ID-{{txID}}</b>.
              <br>Please send exactly <b>{{currentWithdrawalFee}}</b> ETH
              <i-tooltip trigger="click">
                <i class="copy fas fa-copy _margin-left-05" @click="copyText(currentWithdrawalFee)"></i>
                <template slot="body">Copied!</template>
              </i-tooltip>
              <br>
                to the address <b>{{featureStatus && featureStatus.forcedExitContractAddress}}</b>
                <i-tooltip trigger="click">
                  <i class="copy fas fa-copy _margin-left-05" @click="copyText(featureStatus && featureStatus.forcedExitContractAddress)"></i>
                  <template slot="body">Copied!</template>
                </i-tooltip>
                within the next <b>{{waitTime}}</b> to perform an alternative withdrawal.
            </p>
            <p class="_text-center">
              The information about the withdrawal has been saved in the local browser storage.
              Alternatively, you can keep track of the account on its <a :href="addressZkScanLink" target="_blank">zkscan</a> page.
              After the request is fulfilled, it may take up to 5 hours before the funds reach your L1 account.
            </p>
            <i-button block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
          </div>
          <loading-block v-else-if="step===3">
            <a v-if="transactionInfo.hash" class="_display-block _text-center" target="_blank"
              :href="transactionInfo.explorerLink">
              Link to the transaction <i class="fas fa-external-link"/>
            </a>
            <p v-if="loggingIn" class="_display-block _text-center">
              <span v-if="loggingInHint === 'followInstructions'">Follow the instructions in your wallet</span>
              <span v-else-if="loggingInHint === 'loadingData'">Getting wallet information</span>
            </p>
            <p v-else-if="tip" class="_display-block _text-center">{{ tip }}</p>
          </loading-block>
          <success-block v-else-if="step===4" :tx-link="transactionInfo.explorerLink" :fee="transactionInfo.fee" :continue-btn-function="true" @continue="successBlockContinue">
            <p class="_text-center _margin-top-0">
              Request is fulfilled, it may take up to 5 hours before the funds reach your L1 account.
              <br>Transaction will be processed shortly. Use the transaction link to track the progress.
            </p>
          </success-block>
        </div>
      </div>
      <div v-if="step===0" class="dropdownsContainer">
        <dropdown v-for="(item, index) in requestsList" :key="index">
          <template slot="header">
            <span>
              <span class="gray">#ID-</span>{{item.id}}
            </span>
          </template>
          <template slot="default">
            <div>
              <div class="_display-flex _text-align-center">
                Requested at {{getFormattedTime(item.createdAt)}}

                <div class="removeItem" @click="removeFromLocalStorage(item)">
                  <i-tooltip>
                    <i class="fas fa-trash"></i>
                    <template slot="body">Forget the request</template>
                  </i-tooltip>
                </div>
              </div>
              <div v-if="item.fulfilledBy">
                <div class="_text-align-center _margin-top-1">The request has been successfully fulfilled:</div>
                <div v-for="(hash, index) in item.fulfilledBy" :key="index" class="_text-align-center">
                  <a  :href="zkscanLinkToTx(hash)" target="_blank">
                    Withdrawal of {{item.balances[index].symbol}}
                  </a>
                </div>
                <div class="_text-align-center _margin-top-1">It may take up to 5 hours before the funds reach your L1 account.</div>
              </div>
              <div v-else-if="!hasExpired(item)">
                <div class="_text-align-center _margin-top-1">For the request to be fulfilled, </div>
                <div class="_text-align-center">
                  send <b>exactly</b> <b>{{item.token.amount}} {{item.token.symbol}}</b>
                  <i-tooltip trigger="click">
                    <i class="copy fas fa-copy _margin-left-05" @click="copyText(item.token.amount)"></i>
                    <template slot="body">Copied!</template>
                  </i-tooltip>
                </div>
                <div class="_text-align-center">
                  to <b>{{item.contractAddress}}</b>
                  <i-tooltip trigger="click">
                    <i class="copy fas fa-copy _margin-left-05" @click="copyText(item.contractAddress)"></i>
                    <template slot="body">Copied!</template>
                  </i-tooltip>
                </div>
                <div class="_text-align-center">Time until the order expires: <b><time-ticker :time="item.sendUntil" /></b></div>
              </div>
              <div v-else>
                <div class="_text-align-center _margin-top-1">The request has expired.</div>
              </div>
              <div class="transactionDetails _margin-top-1">
                <div class="_margin-top-1 bigText"><b>Details:</b></div>
                <div class="_margin-top-1">Account:</div>
                <div class="bold">
                  {{item.target}}
                  <i-tooltip trigger="click">
                    <i class="copy fas fa-copy _margin-left-05" @click="copyText(item.contractAddress)"></i>
                    <template slot="body">Copied!</template>
                  </i-tooltip>
                </div>
                <div class="_margin-top-05">Amount:</div>
                <div class="bold">
                  {{item.token.amount}} {{item.token.symbol}}
                  <i-tooltip trigger="click">
                    <i class="copy fas fa-copy _margin-left-05" @click="copyText(item.contractAddress)"></i>
                    <template slot="body">Copied!</template>
                  </i-tooltip>
                </div>
                <div class="_margin-top-05">Tokens to withdraw:</div>
                <div class="bold">
                  {{ item.balances.map(bal => bal.symbol).join(' ') }}
                </div>
              </div>
            </div>
          </template>
        </dropdown>
      </div>
    </div>

    <footer-component />
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import moment from "moment";
import { BigNumber, BigNumberish } from "ethers";
import { types as SyncTypes } from "zksync";
import { Address, Balance } from "@/plugins/types";
import { ETHER_NETWORK_NAME, APP_ETH_BLOCK_EXPLORER, APP_ZK_SCAN } from "@/plugins/build";

import utils from "@/plugins/utils";
import supportBlock from "@/blocks/SupportBlock.vue";
import addressInput from "@/components/AddressInput.vue";
import dropdown from "@/components/DropdownBlock.vue";
import timeTicker from "@/components/TimeTicker.vue";
import loadingBlock from "@/components/LoadingBlock.vue";
import successBlock from "@/components/SuccessBlock.vue";
import headerComponent from "@/blocks/Header.vue";
import footerComponent from "@/blocks/Footer.vue";
import { walletData } from "~/plugins/walletData";

const FORCED_EXIT_API = "http://localhost:3001/api/forced_exit_requests/v0.1";

const UNAVALIABLE_MESSAGE = "Sorry, the automated forced exit procedure is unavailable now. In case of any inconvenience contact us by";

interface StatusResponse {
  status: "enabled" | "disabled";
  requestFee: string;
  maxTokensPerRequest: number;
  recomendedTxIntervalMillis: number;
  forcedExitContractAddress: Address;
}

interface RequestStatusResponse {
  id: number;
  target: string;
  tokens: number[];
  priceInWei: string;
  validUntil: string;
  createdAt: string;
  fulfilledBy: string[] | null;
  fulfilledAt: string | null;
}

interface requestType {
  id: number;
  createdAt: number;
  sendUntil: number;
  target: string;
  token: {
    amount: string;
    symbol: string;
  };
  contractAddress: string;
  balances: Array<Balance>;
  fulfilledBy?: string[];
}

interface WithdrawalResponse {
  id: number;
  target: SyncTypes.Address;
  tokens: number[];
  priceInWei: string;
  // Date objects are json since it is how
  // the `.json()` deserializes them
  validUntil: string;
  createdAt: string;
  fulfilledBy?: string[];
  fulfilledAt?: string;
}

interface ModalParams {
  // If the open is open or not
  open: boolean;
  // What message is displayed
  message: string;
  // Are there any social links
  social: boolean;
  // If it is possible to close the modal
  closable: boolean;
}

interface TokenPricesMap {
  [key: string]: number;
}

type SubErrorType = "Active" | "NotExists" | "TooYoung" | "None" | "Other";

function getEndpoint(endpoint: string) {
  return FORCED_EXIT_API + endpoint;
}

async function getStatus() {
  const endpoint = getEndpoint("/status");
  const response = await fetch(endpoint);

  const json = await response.json();
  return json as StatusResponse;
}

async function submitRequest(address: string, tokens: number[], priceInWei: BigNumberish) {
  const endpoint = getEndpoint("/submit");

  const data = {
    target: address,
    tokens,
    price_in_wei: priceInWei.toString(),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (response.status < 200 || response.status > 299) {
    throw new Error(json.title);
  }

  return json;
}

async function checkEligibilty(address: string): Promise<boolean> {
  const endpoint = getEndpoint(`/checks/eligibility/${address}`);

  const response = await fetch(endpoint);

  const responseObj = await response.json();

  return responseObj.eligible;
}

async function getRequest(id: number): Promise<RequestStatusResponse> {
  const endpoint = getEndpoint(`/requests/${id}`);
  const status = await fetch(endpoint);
  const response = await status.json();

  return response as RequestStatusResponse;
}

export default Vue.extend({
  components: {
    addressInput,
    dropdown,
    timeTicker,
    supportBlock,
    headerComponent,
    footerComponent,
    loadingBlock,
    successBlock,
  },
  layout: "index",
  data() {
    return {
      step: 0,
      loading: true,
      featureStatus: null as StatusResponse | null,
      modalParams: {
        open: false,
        message: "",
        social: false,
        closable: false,
      } as ModalParams,
      subError: "",
      subErrorType: "None" as SubErrorType,
      tokenPricesMap: {} as TokenPricesMap,

      /* Step 0 */
      address: "",
      howThisWorksModal: false,

      /* Step 1 */
      search: "",
      balancesList: [] as Array<Balance>,
      forceUpdateVal: 0,
      forceUpdateRequestsVal: 0,
      manualWarningModal: false,
      manualWarningCheckmark: false,

      /* Step 2 */
      txID: 0,
      currentWithdrawalFee: "",

      /* Step 4 */
      tip: "",
      transactionInfo: {
        hash: "",
        explorerLink: "",
        fee: {
          token: {
            symbol: "ETH",
            tokenPrice: 1,
          },
          amount: "0"
        },
      },
    };
  },
  computed: {
    loggedIn(): boolean {
      return this.$store.getters["account/loggedIn"];
    },
    loggingIn(): boolean {
      return this.$store.getters["account/loader"];
    },
    loggingInHint(): string {
      return this.$store.getters["account/loadingHint"];
    },
    addressZkScanLink(): string {
      return `${APP_ZK_SCAN}/accounts/${this.address}`;
    },
    maxTokensReached(): boolean {
      return this.choosedItems.length >= this.featureStatus!.maxTokensPerRequest;
    },
    currentExpectedFee(): BigNumberish {
      const feeForOneRequest = BigNumber.from(this.featureStatus?.requestFee);
      const expectedFee = feeForOneRequest.mul(this.choosedItems.length);
      return expectedFee;
    },


    requestsList(): Array<requestType> {
      // eslint-disable-next-line no-unused-expressions
      this.forceUpdateRequestsVal;
      return this.getItemsFromStorage();
    },

    /* Step 1 */
    choosedItems(): Array<Balance> {
      // eslint-disable-next-line no-unused-expressions
      this.forceUpdateVal;
      return this.balancesList.filter((e: Balance) => e.choosed === true);
    },
    displayedList(): Array<Balance> {
      // eslint-disable-next-line no-unused-expressions
      this.forceUpdateVal;
      if (!this.search.trim()) {
        return this.balancesList;
      }
      return this.balancesList.filter((e: Balance) => e.symbol.toLowerCase().includes(this.search.trim().toLowerCase()));
    },

    waitTime(): string {
      const timeSeconds = this.featureStatus!.recomendedTxIntervalMillis / 1000;
      const { hours, minutes } = utils.timeCalc(timeSeconds);

      if (minutes) {
        return `${hours} hours and ${minutes} minutes`;
      } else {
        return `${hours} hours`;
      }
    },
  },
  watch: {
    manualWarningModal() {
      this.manualWarningCheckmark=false;
    }
  },
  async created() {
    try {
      /* this.featureStatus = await getStatus();

      if (this.featureStatus.status === "enabled") {
        this.loading = false;
      } else {
        this.setUnavaliabeModal();
      }

      setInterval(() => {
        this.checkFulfilled();
      }, 1000); */
      /* temp */ this.featureStatus = {
        status: "enabled",
        requestFee: "10000000",
        maxTokensPerRequest: 2,
        recomendedTxIntervalMillis: 1000,
        forcedExitContractAddress: "0x2D9835a1C1662559975B00AEA00e326D1F9f13d0",
      };
      const onboardResult = await this.$store.dispatch("wallet/onboard");
      if (onboardResult !== true) {
        await this.$store.dispatch("wallet/logout");
        return;
      }
    } catch (error) {
      console.log("Can't get platform status", error);
      this.setUnavaliabeModal();
    } finally {
      this.loading = false;
    }
  },
  methods: {
    copyText(text: string) {
      const elem = document.createElement("textarea");
      elem.style.position = "absolute";
      elem.style.left = -99999999 + "px";
      elem.style.top = -99999999 + "px";
      elem.value = text;
      document.body.appendChild(elem);
      elem.select();
      document.execCommand("copy");
      document.body.removeChild(elem);
    },
    toggleHowThisWorksModal() {
      this.howThisWorksModal = !this.howThisWorksModal;
    },
    zkscanLinkToTx(hash: string) {
      return `${APP_ZK_SCAN}/transactions/${hash}`;
    },
    async checkFulfilled() {
      const requests = this.getItemsFromStorage();

      // Here we check for each request if it has been fulfilled
      const checkedFulfilledPromises = requests.map(async (request) => {
        // If it has been already fulfilled, no need to check it again
        if (request.fulfilledBy) {
          return request;
        }

        // Note that we check if the request has been fulfilled even if it has expired
        // in order to take into account the fact that recommeneded time (displayed to the user)
        // is somewhat smaller than the real expiration time to take into account reorgs and the bad
        // luck of the sender, etc

        const requestStatus = await getRequest(request.id);

        if (requestStatus.fulfilledAt) {
          return {
            ...request,
            fulfilledBy: requestStatus.fulfilledBy,
          } as requestType;
        } else {
          return request;
        }
      });

      try {
        const checkedFullfilled = await Promise.all(checkedFulfilledPromises);
        this.updateLocalStorage(checkedFullfilled);
      } catch (e) {
        console.warn(`An error while update occured: ${e.toString()}`);
      }
    },
    hasExpired(request: requestType) {
      const timeLeft = (request.sendUntil - new Date().getTime()) / 1000;
      return timeLeft <= 0;
    },
    getFormattedTime(time: number): string {
      return moment(time).format("M/D/YYYY h:mm:ss A");
    },
    getItemsFromStorage(): Array<requestType> {
      let data = localStorage.getItem("forcedExitRequests");
      try {
        if (!data) {
          return [];
        }
        data = JSON.parse(data);
        if (!Array.isArray(data)) {
          return [];
        }
      } catch (error) {
        return [];
      }
      return data.sort((a, b) => b.createdAt - a.createdAt);
    },
    getItemFromStorageById(id: number): (false | requestType) {
      const allRequests = this.getItemsFromStorage();
      for(const request of allRequests) {
        if(request?.id === id) {
          return request;
        }
      }
      return false;
    },
    saveToLocalStorage(tx: requestType) {
      const newData = this.getItemsFromStorage();
      newData.push(tx);
      this.updateLocalStorage(newData);
    },
    removeFromLocalStorage(request: requestType) {
      let newData = this.getItemsFromStorage();
      newData = newData.filter((r) => r.id !== request.id);
      this.updateLocalStorage(newData);
    },
    updateLocalStorage(txs: requestType[]) {
      localStorage.setItem("forcedExitRequests", JSON.stringify(txs));
      this.forceUpdateRequestsVal++;
    },

    async updateStatus() {
      this.featureStatus = await getStatus();
    },

    /* Step 0 */
    async checkAddress() {
      this.loading = true;
      try {
        const zksync = await walletData.zkSync();
        const provider = await zksync.getDefaultProvider(ETHER_NETWORK_NAME /* , 'HTTP' */);
        walletData.set({ syncProvider: provider });
        /* const state = await provider.getState(this.address); */
        /* temp */ const state = {
          address: "0x2d9835a1c1662559975b00aea00e326d1f9f13d0",
          id: 4731,
          depositing: { balances: {} },
          committed: {
            balances: {
              ZRX: "100000000000",
              MLTT: "399001161349120",
              DAI: "24152809973043131102",
              ETH: "9928200003000000",
              LAMB: "9935697869999999899",
              USDC: "76631029",
              USDT: "2316000",
            },
            nonce: 0,
            pubKeyHash: "sync:6fd19a27cc94d18d9080da7a679f43d8b5b02feb",
          },
          verified: {
            balances: {
              ZRX: "100000000000",
              ETH: "9928200003000000",
              DAI: "24152809973043131102",
              LAMB: "9935697869999999899",
              MLTT: "399001161349120",
              USDC: "76631029",
              USDT: "2316000",
            },
            nonce: 0,
            pubKeyHash: "sync:6fd19a27cc94d18d9080da7a679f43d8b5b02feb",
          },
        };

        if (!state.id || state.id === -1) {
          this.setAccountDoesNotExistModal();
          return;
        }

        if (state.committed.nonce) {
          // this.subError = 'bad noce';
          this.setNonceModal();
          return;
        }

        /* temp */
        /* const existedForEnoughTime = await checkEligibilty(this.address);
        if (!existedForEnoughTime) {
          this.setTooYoungModal();
          return;
        } */

        // A person might have a bunch of tokens, so it is better to fetch prices
        // in paralel
        const tokenPricesPromises = Object.keys(state.committed.balances).map(async (token) => ({
          [token]: await provider!.getTokenPrice(token),
        }));
        const tokenPricesArray = await Promise.all(tokenPricesPromises);

        if (!tokenPricesArray.length) {
          this.balancesList = [];
          this.step = 1;
          return;
        }

        const tokenPricesObj = tokenPricesArray.reduce((prev, cur) => ({
          ...prev,
          ...cur,
        }));

        if (!tokenPricesObj.ETH) {
          tokenPricesObj.ETH = await walletData.get().syncProvider!.getTokenPrice("ETH");
        }

        this.tokenPricesMap = tokenPricesObj;

        this.balancesList = [];
        Object.entries(state.committed.balances).forEach(([symbol, amount]) => {
          const tokenPrice = tokenPricesObj[symbol] as number;

          this.balancesList.push({
            symbol,
            status: "Pending",
            balance: amount,
            rawBalance: BigNumber.from(amount),
            verifiedBalance: amount,
            tokenPrice: tokenPrice.toString(),
            restricted: false,
            choosed: false,
          });
        });

        this.balancesList.sort((balance1, balance2) => {
          if (balance1.symbol < balance2.symbol) {
            return -1;
          } else {
            return 1;
          }
        });

        this.step = 1;
      } catch (error) {
        console.log("an error handled: ", error);
        const errorStr = error?.toString();
        this.setErrorModal(errorStr);
      } finally {
        this.loading = false;
      }
    },

    /* Step 1 */
    setItemChecked(item: Balance) {
      for (let a = 0; a < this.balancesList.length; a++) {
        if (this.balancesList[a].symbol === item.symbol) {
          if(!this.balancesList[a].choosed && this.maxTokensReached) {
            break;
          }
          this.balancesList[a] = { ...this.balancesList[a], choosed: !this.balancesList[a].choosed };
          this.forceUpdateVal++;
          break;
        }
      }
    },
    async withdraw() {
      this.step = 3;
      if(!this.loggedIn) {
        const loggedInSuccessefully = await this.$store.dispatch('wallet/walletRefresh', true);
        if(!loggedInSuccessefully) {
          this.step = 2;
          return;
        }
      }

      this.tip = "Requesting withdraw...";
      const withdrawResponse = await this.withdrawRequest();
      if(!withdrawResponse) {
        this.tip = "";
        this.loading = false;
        return;
      }

      const ethWallet = walletData.get().ethWallet as any;
      this.tip = "Confirm the transaction to withdraw";
      try {
        const tx = await ethWallet.sendTransaction({
          to: withdrawResponse.target,
          value: BigNumber.from(withdrawResponse.priceInWei)
        });
        this.transactionInfo.hash = tx.hash;
        this.transactionInfo.explorerLink = APP_ETH_BLOCK_EXPLORER + "/tx/" + tx.hash;

        this.tip = "Waiting for the transaction to be mined...";
        const receipt = await tx.wait();
        this.transactionInfo.fee.token.tokenPrice = this.tokenPricesMap['ETH'];
        this.transactionInfo.fee.amount = receipt.gasUsed.toString();

        this.tip = "Processing...";
        this.checkFulfilled();

        this.tip = "";
        this.step = 4;
      } catch (error) {
        console.log('Tx error', error);
        this.step = 2;
      }
      this.loading = false;
    },
    withdrawManuallyAsk() {
      this.manualWarningModal=true;
    },
    async withdrawManually() {
      this.loading = true;
      const withdrawResponse = await this.withdrawRequest();
      if(!withdrawResponse) {
        this.loading = false;
        return;
      }
      this.step = 2;
      this.loading = false;
    },
    async withdrawRequest() {
      try {
        const selectedTokens = this.balancesList.filter((token) => token.choosed).map((token) => walletData.get().syncProvider!.tokenSet.resolveTokenId(token.symbol) as number);
        const pricePerTokenStr = this.featureStatus?.requestFee as string;
        const pricePerToken = BigNumber.from(pricePerTokenStr);
        /* temp */  //await this.updateStatus();

        /* temp */ //const withdrawalReponse = (await submitRequest(this.address, selectedTokens, pricePerToken.mul(selectedTokens.length).toString())) as WithdrawalResponse;
        /* temp */ const withdrawalReponse = {
          id: 1,
          target: "0x2D9835a1C1662559975B00AEA00e326D1F9f13d0",
          tokens: selectedTokens,
          priceInWei: "1000",
          validUntil: "Mon Mar 22 2022 18:35:47 GMT+0100 (Central European Standard Time)",
          createdAt: "Mon Mar 22 2022 18:35:47 GMT+0100 (Central European Standard Time)",
          fulfilledBy: undefined,
          fulfilledAt: undefined,
        }
        console.log("respo", withdrawalReponse);
        this.txID = withdrawalReponse.id;

        const amountToSend = BigNumber.from(withdrawalReponse.priceInWei).add(this.txID);

        this.currentWithdrawalFee = walletData.get().syncProvider!.tokenSet.formatToken("ETH", amountToSend) as string;

        const createdAt = new Date(withdrawalReponse.createdAt).getTime();
        const recommendedValidUntil = new Date(createdAt + this.featureStatus!.recomendedTxIntervalMillis).getTime();
        const validUntil = new Date(withdrawalReponse.validUntil).getTime();

        const sendUntil = Math.min(recommendedValidUntil, validUntil);

        this.saveToLocalStorage({
          id: this.txID,
          createdAt,
          token: {
            amount: this.currentWithdrawalFee,
            symbol: "ETH",
          },
          sendUntil,
          contractAddress: this.featureStatus?.forcedExitContractAddress as string,
          balances: this.choosedItems,
          target: this.address,
        });

        for (let a = 0; a < this.balancesList.length; a++) {
          this.balancesList[a] = { ...this.balancesList[a], choosed: false };
        }

        this.forceUpdateVal++;
        this.search = "";

        return withdrawalReponse;
      } catch (err) {
        this.setErrorModal(err);
        this.step = -1;
        this.address = "";
        return false;
      }
    },

    /* Step 2 */
    finish() {
      this.address = "";
      this.step = 0;
    },

    removeModal() {
      this.modalParams.open = false;
    },

    setUnavaliabeModal() {
      this.step = -1;
      this.modalParams = {
        open: true,
        message: UNAVALIABLE_MESSAGE,
        social: true,
        closable: false,
      };
    },

    setErrorModal(err: any) {
      this.step = -1;

      this.modalParams = {
        open: true,
        message: err.toString(),
        social: true,
        closable: true,
      };
    },

    setSubError(err: any) {
      if (!err) {
        this.removeError();
      } else {
        this.subErrorType = "Other";
        this.subError = err.toString();
      }
    },

    setTooYoungModal() {
      this.subErrorType = "TooYoung";
      this.subError = "";
    },

    setNonceModal() {
      this.subErrorType = "Active";
      this.subError = "The account that had any activity on zkSync can only use the wallet to withdraw";
    },

    setAccountDoesNotExistModal() {
      this.subErrorType = "NotExists";
      this.subError = "The account does not exist in the zkSync network";
    },

    removeError() {
      this.subError = "";
      this.subErrorType = "None";
    },

    /* Step 4 */
    successBlockContinue() {
      this.step = 0;
    }
  },
});
</script>
