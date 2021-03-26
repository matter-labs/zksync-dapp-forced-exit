<template>
  <div >
    <header-component />
    <div class="indexPage" :class="{'hasRequests': (requestsList.length>0 && step===0)}">
      <i-modal v-model="howThisWorksModal" size="md" class="howThisWorksModal">
        <template slot="header">How does this all work?</template>
        <div>
        <div>
          <b>zkSync alternative withdrawal</b> is way to get funds to Layer 1 without interacting directly with the protocol. zkSync supports most of web3-compatible wallets,
          so we highly recommend you to use the <a href="http://wallet.zksync.io/" target="_blank" >official client <i class="fas fa-external-link"></i></a> to withdraw funds if that is possible as it is cheaper and more convenient.</div>
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
        <template slot="header">Manual payment warning</template>
        <div>
          You will be provided with an address and fee amount. You will have to send <b>exactly given amount to the provided address within the provided timeframe</b> in order for the withdraw to be initiated.
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
              <br/>Please go to the <a target="_blank" href="http://wallet.zksync.io/" class="linkText">official wallet <i class="fas fa-external-link"></i></a> to withdraw the funds.
            </div>
            <div v-if="subErrorType==='NotExists'" class="errorText _text-center _margin-top-1 secondaryText">
              The account does not exist on zkSync network.
            </div>
            <div v-if="subErrorType==='TooYoung'" class="errorText _text-center _margin-top-1 secondaryText">
              To initiate an alternative withdrawal an account should exist in zkSync network for at least 24 hours.
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
            <div v-if="balancesList.length!==0" :class="{'color-gray': choosedItems.length<=0 }">
              <h4 class="_text-center">
                Complete withdrawal
              </h4>
              <div class="_text-center expectedInfo _display-block _margin-top-0 _padding-05">
                  In order to complete the withdrawal 
                  <br>you need to pay the fee of 
                  ~{{ currentExpectedFee | formatToken('ETH') }} ETH <span class="expectedPrice"><span class="">{{ currentExpectedFee | formatUsdAmount(tokenPricesMap['ETH'], 'ETH') }}</span></span>
              </div>
              <i-button block size="lg" variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-2" @click="withdraw()">{{'Connect wallet to pay'}}</i-button>
              <i-button block link variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-05" @click="withdrawManuallyAsk()">Make payment manually</i-button>
            </div>
          </div>
          <div v-else-if="step===2">
            <p class="_text-left _margin-top-0">
              Your request was saved under <b>#ID-{{txID}}</b>.
              <div class="_margin-top-1">
                Please send 
                <br>exactly <b>{{currentWithdrawalFee}} ETH</b>
                <i-tooltip trigger="click">
                  <i class="copy fas fa-copy _margin-left-05" @click="copyValue(currentWithdrawalFee)"></i>
                  <template slot="body">Copied!</template>
                </i-tooltip>
                <br>
                to <b>{{featureStatus && featureStatus.forcedExitContractAddress}}</b> (L1)
                <i-tooltip trigger="click">
                  <i class="copy fas fa-copy _margin-left-05" @click="copyValue(featureStatus && featureStatus.forcedExitContractAddress)"></i>
                  <template slot="body">Copied!</template>
                </i-tooltip>
                <br/>within the next <b>{{waitTime}}</b>
                <br/>After the transaction receives {{featureStatus.waitConfirmations}} confirmations the server will initiate the withdrawal.
                </div>
            </p>
            <p class="_text-left">
              The information about the withdrawal has been saved in the local browser storage.
              Alternatively, you can keep track of the account on its <a :href="addressZkScanLink" target="_blank">zkscan <i class="fas fa-external-link"></i></a> page.
              After the request is initiated, it may take up to 5 hours before the funds reach your L1 account.
            </p>
            <i-button block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
          </div>
          <loading-block v-else-if="step===3">
            <a v-if="transactionInfo.hash && currentRequest" class="_display-block _text-center" target="_blank"
              :href="transactionInfo.explorerLink">
              Link to the transaction <i class="fas fa-external-link"/>
            </a>
            <p v-if="loggingIn" class="_display-block _text-center">
              <span v-if="loggingInHint === 'followInstructions'">Follow the instructions in your wallet</span>
              <span v-else-if="loggingInHint === 'loadingData'">Getting wallet information</span>
            </p>
            <p v-else-if="tip" class="_display-block _text-center">{{ tip }}</p>
          </loading-block>
          <success-block v-else-if="step===4"  :fee="transactionInfo.fee" :continue-btn-function="true" @continue="successBlockContinue">
            <p class="_text-center">Your request has been initiated. You track the progress with the links below:</p> 
            
            <div class="_display-flex _justify-content-center">
              <ul class="">
                <li v-for="(item, index) in currentRequest.fulfilledBy" :key="index">
                  <a class="_text-center"  :href="zkscanLinkToTx(item)" target="_blank"> 
                      {{currentRequest.balances[index].symbol}} withdrawal TX <i class="fas fa-external-link"></i>
                  </a>
                </li>
              </ul>
             </div>
             <p class="_text-center _margin-top-2">It may take up to 5 hours until the funds reach your L1 account.</p>
          </success-block>
        </div>
      </div>
      <div v-if="step===0" class="dropdownsContainer">
        <dropdown v-for="(item, index) in requestsList" :key="index" :data-json="JSON.stringify(item)">
          <template slot="header">
            <span>
              <span class="gray">#ID-</span>{{item.id}}
            </span>
          </template>
          <template slot="default">
            <div>
              <div class="_display-flex _text-align-center">
                Requested at {{getFormattedTime(item.createdAt)}}

                <div class="removeItem" @click="removeRequest(item.id)">
                  <i-tooltip>
                    <i class="trash fas fa-trash"></i>
                    <template slot="body">Forget the request</template>
                  </i-tooltip>
                </div>
              </div>
              <div v-if="item.fulfilledBy">
                <div class="_text-align-center _margin-top-1">The request has been initiated:</div>
                <div v-for="(hash, index) in item.fulfilledBy" :key="index" class="_text-align-center">
                  <a  :href="zkscanLinkToTx(hash)" target="_blank">
                    Withdrawal of {{item.balances[index].symbol}} <i class="fas fa-external-link"></i>
                  </a>
                </div>
                <div class="_text-align-center _margin-top-1">It may take up to 5 hours before the funds reach your L1 account.</div>
              </div>
              <div v-else-if="!hasExpired(item) && !item.walletTx">
                <div class="_text-align-center _margin-top-1">For the request to be initiated, </div>
                <div class="_text-align-center">send <b>exactly</b> 
                  
                <b>{{item.token.amount}} {{item.token.symbol}}</b>
                <i-tooltip trigger="click">
                  <i class="copy fas fa-copy" @click="copyValue(item.token.amount)"></i>
                  <template slot="body">Copied!</template>
                </i-tooltip>
                 </div>
                <div class="_text-align-center">
                  to 
                  <b>{{item.contractAddress}}</b> (L1)
                  <i-tooltip trigger="click">
                  <i class="copy fas fa-copy" @click="copyValue(item.contractAddress)"></i>
                  <template slot="body">Copied!</template>
                </i-tooltip>
                </div>
                <div>The server will wait for {{featureStatus && featureStatus.waitConfirmations}} confirmations of the transaction before initiating the withdrawal.</div>
                <div class="_text-align-center _margin-top-1">Time until the order expires: <b><time-ticker :time="item.sendUntil" /></b></div>
              </div>
              <div v-else-if="!hasExpired(item) && item.walletTx">
                The request was paid for with the following transaction:
                <br><a :href="getEtherscanLink(item.walletTx)" target="_blank">Link to the transaction. <i class="fas fa-external-link"></i></a>

                <p>The server will wait for {{featureStatus && featureStatus.waitConfirmations}} confirmations of the transaction before processing your request. Once the request is initiated on the server side, it may take up to 5 hours before the funds reach your L1 account.</p>
              </div>
              <div v-else>
                <div class="_text-align-center _margin-top-1">The request has expired.</div>
              </div>
              <div class="transactionDetails _margin-top-1">
                <div class="_margin-top-1 bigText"><b>Details:</b></div>
                <div class="_margin-top-1 ">Account:</div> 
                <div class="bold">{{item.target}}</div>
                <div class="_margin-top-1 ">Tokens:</div>
                <div :class="{'_margin-top-1': index!=0} " v-for="(balance, index) in item.balances" :key="index" >
                  All of <b>{{balance.symbol}}</b>
                    <span v-if="!item.fulfilledBy && !hasExpired(item)">
                      <br>
                      Current balance: 
                      <span v-if="cachedState.get(item.target.toLowerCase()) && tokenPricesMap[balance.symbol]">
                        <b>{{formattedBalance(item.target, balance.symbol)}}</b> ({{ getFormattedTotalPrice(tokenPricesMap[balance.symbol], +formattedBalance(item.target, balance.symbol)) }})
                      </span>
                      <span v-else>
                        Loading...
                      </span>
                    </span>
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
import { types as SyncTypes, Provider, getDefaultProvider } from "zksync";
import { Address, Balance } from "@/plugins/types";
import { ETHER_NETWORK_NAME, APP_ETH_BLOCK_EXPLORER, APP_ZK_SCAN, APP_ZKSYNC_API_LINK } from "@/plugins/build";

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
import { Network } from "zksync/build/types";

const FORCED_EXIT_API = `${APP_ZKSYNC_API_LINK}/api/forced_exit_requests/v0.1`;

const UNAVALIABLE_MESSAGE = "Alternative Withdrawal is temporarily down or undergoing a planned maintenance. We apologize for the inconvenience — our team is on it, we'll be back up in a bit!";

const REQUEST_PREFIX = 'REQUEST-';
const REQUESTS_LIST_SLOT = 'REQUESTS-LIST';

interface StatusResponse {
  status: "enabled" | "disabled";
  requestFee: string;
  maxTokensPerRequest: number;
  recomendedTxIntervalMillis: number;
  forcedExitContractAddress: Address;
  waitConfirmations: number;
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
  // Number of times we tried to query for the status, but 404 was returned
  notFoundCount: number;
  walletTx?: string;
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

async function getRequest(id: number): Promise<RequestStatusResponse | null> {
  const endpoint = getEndpoint(`/requests/${id}`);
  const status = await fetch(endpoint);

  // Not found means that very likely the request has been deleted
  // from the DB 
  if(status.status === 404) {
    return null;
  }

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
      provider: null as Provider|null, 
      cachedState: new Map<string, SyncTypes.AccountState>(),
      currentRequest: null as null|requestType,

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
  asyncData({route}) {
    if(route.query.address) {
      return {
        address: route.query.address
      }
    }
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
      this.forceUpdateVal;
      return this.getRequestsObjects();
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
      this.featureStatus = await getStatus();

      console.log('featureStatus', this.featureStatus);

      if (this.featureStatus.status === "enabled") {
        this.loading = false;
      } else {
        this.setUnavaliabeModal();
      }
      
      setInterval(() => {
        this.updateCachedAccountStates();
        this.checkFulfilled();
        this.setTokenPrices();
      }, 1000);
      
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
    getFormattedTotalPrice: (price: number, amount: number) => {
      const total = price * amount;
      if (!amount || total === 0) {
        return "$0.00";
      }
      return total < 0.01 ? `<$0.01` : `~$${total.toFixed(2)}`;
    },
    /*

      Since there are a lot of async methods modifying the localStorage it was decided to
      introduce the following scheme to keep everything in sync:
      
      1. Whenever a method wants to modify an element, they should modify exactly him.
      2. The list of all the requests is no longer stored in as the array of JSON objects.
       Now it is separated into two parts:

       REQUESTS_LIST_SLOT -- contains the list of ids of all requests
       Each individual request is stored under REQUEST_PREFIX + id
    */
    // Returns the requests that are still avaliable
    getRequestList(): number[] {
      const list = localStorage.getItem(REQUESTS_LIST_SLOT);
      if(!list) {
        return [];
      } else {
        return JSON.parse(list);
      }
    },
    getRequestsObjects(): requestType[] {
      const ids = this.getRequestList();

      const requests = ids.map((id) => this.getRequest(id));
      const existingRequests = requests.filter((r) => {
        if(r) {
          return true;
        } else {
          return false;
        }
      }) as requestType[];

      return existingRequests.sort((a, b) => b.sendUntil - a.sendUntil);
    },
    setRequestsList(newList: number[]) {
      const listJson = JSON.stringify(newList);
      localStorage.setItem(REQUESTS_LIST_SLOT, listJson);
      
      this.forceUpdateVal++;
    },
    getRequestSlotName(id: number): string {
      return REQUEST_PREFIX + id;
    },
    addRequest(request: requestType) {
      const id = request.id;
      const requests = this.getRequestList();
      requests.push(id);

      this.setRequestsList(requests);
      localStorage.setItem(this.getRequestSlotName(id), JSON.stringify(request));
    },
    getRequest(id: number): requestType|null {
      const item = localStorage.getItem(this.getRequestSlotName(id));
      if(!item) {
        return null;
      }

      const parsedItem = JSON.parse(item) as requestType;
      return parsedItem;
    },
    removeRequest(id: number) {
      const request = this.getRequest(id);
      // The request has been already deleted
      if(!request) {
        return;
      }

      const requestsList = this.getRequestList();
      const newRequestsList = requestsList.filter((requestId) => requestId !== id);
      this.setRequestsList(newRequestsList);
      localStorage.removeItem(this.getRequestSlotName(id));
    },
    updateOneRequest(id: number, newRequest: requestType) {
      localStorage.setItem(this.getRequestSlotName(id), JSON.stringify(newRequest));
      
      this.forceUpdateVal++;
    },
    updateRequestFields(id: number, fields: Partial<requestType>) {
      const request = this.getRequest(id);
      if(!request) {
        return;
      }

      const newRequest = {
        ...request,
        ...fields
      };

      this.updateOneRequest(id, newRequest);
    },
    checkTxStatusLoop(id: number) {
      // We already track the status of the transaction in the id
      // No need to make fetch requests again
      const interval = setInterval(() => {
        const tx = this.getRequest(id);

        this.currentRequest = tx;

        if (tx?.fulfilledBy) {
          clearInterval(interval);
          this.step = 4;
        }
      }, 500);
    },
    setWalletTx(id: number, hash: string) {
      const request = this.getRequest(id);
      if(!request) {
        return;
      }

      this.updateOneRequest(id, {
        ...request,
        walletTx: hash
      });
    },
    async getProvider() {
      if(!this.provider) {
        this.provider = await getDefaultProvider(ETHER_NETWORK_NAME as Network);
      }

      return this.provider;
    },
    copyValue(value: string) {
      const elem = document.createElement("textarea");
      elem.style.position = "absolute";
      elem.style.left = -99999999 + "px";
      elem.style.top = -99999999 + "px";
      elem.value = value;
      document.body.appendChild(elem);
      elem.select();
      document.execCommand("copy");
      document.body.removeChild(elem);
    },
    async setTokenPrices() {
      const requests = this.getRequestsObjects();
      const allTokens = [] as string[];
      requests.forEach((req) => {
        const requestTokens = req.balances.map(bal => bal.symbol);
        allTokens.push(...requestTokens);
      });

      const provider = await this.getProvider();

      for(const token of allTokens) {
        // No need to re-fetch the price for token if we already know it
        if(this.tokenPricesMap[token]) {
          continue;
        }

        try {
          const tokenPrice = await provider.getTokenPrice(token);
          this.tokenPricesMap[token] = tokenPrice;
        } catch(e) {  
          console.warn(`Console error occured while fetching price for token: ${e.toString()}`);
        }
      }

    },
    formattedBalance(_target: string, token: string) {
      this.forceUpdateVal;
      const target = _target.toLowerCase();
      const targetState = this.cachedState.get(target);

      if(!targetState || !this.provider) {
        return 'Loading...';
      }

      const balance = targetState.committed.balances[token] || '0';

      return this.provider.tokenSet.formatToken(token, balance);
    },
    toggleHowThisWorksModal() {
      this.howThisWorksModal = !this.howThisWorksModal;
    },
    zkscanLinkToTx(hash: string) {
      return `${APP_ZK_SCAN}/transactions/${hash}`;
    },
    async updateCachedAccountStates() {
      const provider = await this.getProvider();
      const requests = this.getRequestsObjects();
      
      const updatePromises = requests.map(async (request) => {
        const address = request.target.toLowerCase();
        const accountState = await provider.getState(address);

        this.cachedState.set(address, accountState);
      });

      try {
        await Promise.all(updatePromises);
        this.forceUpdateVal++;
      } catch(e) {
        console.warn(`An error while fetching account states occured: ${e.toString()}`);
      }
    },
    async checkFulfilled() {
      const requests = this.getRequestsObjects();

      // Here we check for each request if it has been fulfilled
      const checkedFulfilledPromises = requests.map(async (request) => {
        // If it has been already fulfilled, no need to check it again
        if (request.fulfilledBy) {
          return;
        }

        // If we tried to fetch the request for 5 times with 404, then 
        // it is likely that it was removed from the DB forever
        if(request.notFoundCount > 5) {
          return;
        }

        // Note that we check if the request has been fulfilled even if it has expired 
        // in order to take into account the fact that recommeneded time (displayed to the user)
        // is somewhat smaller than the real expiration time to take into account reorgs and the bad

        // luck of the sender, etc
        const requestStatus = await getRequest(request.id);

        if (requestStatus?.fulfilledAt) {
          console.log('Updaing status');
          this.updateRequestFields(request.id, {
            fulfilledBy: requestStatus.fulfilledBy!
          })
        } else if(!requestStatus) { // Basically if the result was 404, then we should add to a count            
          this.updateRequestFields(request.id, {
            notFoundCount: request.notFoundCount+1
          });
        }
      });

      try {
        await Promise.all(checkedFulfilledPromises);
      } catch (e) {
        console.warn(`An error while update occured: ${e.toString()}`);
      }
    },
    fixedPrice(price: number) {
      if(!isFinite(price)) {
        return 'Loading...';
      }

      if(price < 0.01) {
        return '<0.01';
      }

      return price.toFixed(2);
    },
    hasExpired(request: requestType) {
      const timeLeft = (request.sendUntil - new Date().getTime()) / 1000;
      return timeLeft <= 0;
    },
    getFormattedTime(time: number): string {
      return moment(time).format("M/D/YYYY h:mm:ss A");
    },

    async updateStatus() {
      this.featureStatus = await getStatus();
    },

    /* Step 0 */
    async checkAddress() {
      this.loading = true;
      try {
        const provider = await this.getProvider();
        walletData.set({ syncProvider: provider });
        const state = await provider.getState(this.address);

        if (!state.id || state.id === -1) {
          this.setAccountDoesNotExistModal();
          return;
        }

        if (state.committed.nonce) {
          // this.subError = 'bad noce';
          this.setNonceModal();
          return;
        }

        const existedForEnoughTime = await checkEligibilty(this.address);
        if (!existedForEnoughTime) {
          this.setTooYoungModal();
          return;
        }

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
            balance: provider.tokenSet.formatToken(symbol, amount),
            rawBalance: BigNumber.from(amount),
            verifiedBalance: provider.tokenSet.formatToken(symbol, amount),
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

    getEtherscanLink(hash: string): string {
      return APP_ETH_BLOCK_EXPLORER + "/tx/" + hash;
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
      this.currentRequest = null;

      this.step = 3;
      const loggedInSuccessefully = await this.$store.dispatch('wallet/walletRefresh', true);
      if(!loggedInSuccessefully) {
        this.step = 1;
        this.loading = false;
        return;
      }

      this.tip = "Requesting withdraw...";
      const withdrawResponse = await this.withdrawRequest();
      if(!withdrawResponse) {
        this.tip = "";
        this.loading = false;
        this.step = 2;
        return;
      }

      const ethWallet = walletData.get().ethWallet as any;
      const provider = await this.getProvider();
      this.tip = "Confirm the transaction to pay the fee";
      try {
        const amount = provider.tokenSet.parseToken('ETH', withdrawResponse.token.amount);
        const value = BigNumber.from(amount);
        const tx = await ethWallet.sendTransaction({
          to: this.featureStatus?.forcedExitContractAddress,
          value: value,
          gasLimit: BigNumber.from('35000')
        });
        this.currentRequest = withdrawResponse;
        this.addRequest(withdrawResponse);
        this.setWalletTx(withdrawResponse.id, tx.hash);
        this.transactionInfo.hash = tx.hash;
        this.transactionInfo.explorerLink = APP_ETH_BLOCK_EXPLORER + "/tx/" + tx.hash;

        this.tip = "Waiting for the transaction to be mined...";
        const receipt = await tx.wait();
        this.transactionInfo.fee.token.tokenPrice = this.tokenPricesMap['ETH'];
        this.transactionInfo.fee.amount = '0';

        this.tip = "Processing...";
        this.checkFulfilled();

        this.tip = `Waiting for ${this.featureStatus?.waitConfirmations} confirmations...`;
        this.checkTxStatusLoop(withdrawResponse.id);
      } catch (error) {
        console.log('Tx error', error);
        this.step = 1;
      } finally {
        this.loading = false;
      }
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
      this.addRequest(withdrawResponse);
      this.step = 2;
      this.loading = false;
    },
    async withdrawRequest(): Promise<requestType|null> {
      const provider = await this.getProvider();
      try {
        const selectedTokens = this.balancesList.filter((token) => token.choosed).map((token) => provider.tokenSet.resolveTokenId(token.symbol) as number);
        const pricePerTokenStr = this.featureStatus?.requestFee as string;
        const pricePerToken = BigNumber.from(pricePerTokenStr);
        await this.updateStatus();

        const withdrawalReponse = (await submitRequest(this.address, selectedTokens, pricePerToken.mul(selectedTokens.length).toString())) as WithdrawalResponse;

        console.log("respo", withdrawalReponse);
        this.txID = withdrawalReponse.id;

        const amountToSend = BigNumber.from(withdrawalReponse.priceInWei).add(this.txID);

        this.currentWithdrawalFee = provider.tokenSet.formatToken("ETH", amountToSend) as string;

        const createdAt = new Date(withdrawalReponse.createdAt).getTime();
        const recommendedValidUntil = new Date(createdAt + this.featureStatus!.recomendedTxIntervalMillis).getTime();
        const validUntil = new Date(withdrawalReponse.validUntil).getTime();

        const sendUntil = Math.min(recommendedValidUntil, validUntil);

        const requestToSave = {
          id: this.txID,
          createdAt,
          token: {
            amount: this.currentWithdrawalFee,
            symbol: "ETH",
          },
          sendUntil,
          contractAddress: this.featureStatus!.forcedExitContractAddress,
          balances: this.choosedItems,
          target: this.address,
          notFoundCount: 0
        } as requestType;

        for (let a = 0; a < this.balancesList.length; a++) {
          this.balancesList[a] = { ...this.balancesList[a], choosed: false };
        }

        this.forceUpdateVal++;
        this.search = "";

        return requestToSave;
      } catch (err) {
        this.setErrorModal(err);
        this.step = -1;
        this.address = "";
        return null;
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
