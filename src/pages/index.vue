<template>
  <div >
    <header-component />
    <!-- <logo class="_margin-top-1"/> -->
    <div class="indexPage" :class="{'hasRequests': (requestsList.length>0 && step===0)}">
      <i-modal v-model="howThisWorksModal" size="md" class="howThisWorksModal">
        <template slot="header">How does this all work?</template>
        <div>
          <!-- <div>zkSync enables withdrawal from L2 to L1 within its wallet, but for the wallets 
            which are not web3-compatible supported by zkSync natively, the alternative withdrawal can be used.</div> -->
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
      <div class="tileBlock">
        <div class="tileHeadline h3" :class="{'withBtn': step===1}">
          <div class="returnBtn" v-if="step===1" @click="step=0">
              <i class="far fa-long-arrow-alt-left"></i>
          </div>
          <div class="_margin-left-1">Alternative Withdrawal <i class="fas fa-question questionMark" @click="toggleHowThisWorksModal()"></i></div>  
        </div>
        <div class="formContainer">
          <transition name="fade">
            <div v-if="loading" class="centerBlock loadingBlock">
              <loader/>
            </div>
          </transition>
          <div class="_margin-top-2" v-if="step===0">
            <!-- <div class="inputLabel">Address</div> -->
            <address-input v-model="address" @change="setSubError"/>
            <!-- <div v-if=> -->
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
            <p class="_text-center" v-if="modalParams.social">If you think this is a mistake, contact us by</p>
            <support-block v-if="modalParams.social" />
            <i-button v-if="modalParams.closable" block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
          </div>
          <div v-else-if="step===1">
            <i-input class="_margin-top-1" v-model="search" placeholder="Filter tokens" maxlength="6">
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
                <i-tooltip v-if="maxTokensReached && !item.choosed" class="witdth-100 height-60">
                  <div class="no-padding balanceItem disabled">
                    <div class="leftSide">
                      <div class="checkboxContainer">
                        <i class="far fa-check"></i>
                      </div>
                      <div class="tokenSymbol">{{ item.symbol }}</div>
                    </div>
                    <div class="rightSide">
                      <div class="rowItem">
                        <div class="total"><span class="balancePrice">~${{ fixedPrice(item.balance*item.tokenPrice) }}</span>&nbsp;&nbsp;{{ item.balance }}</div>
                      </div>
                    </div>
                  </div>  
                  <template slot="body">Can't select more than {{featureStatus.maxTokensPerRequest}} tokens</template>
                </i-tooltip>
                <div v-else class="balanceItem cursor-pointer enabled" :class="{checked: item.choosed}" @click="setItemChecked(item)">
                  <div class="leftSide">
                    <div class="checkboxContainer">
                      <i class="far fa-check"></i>
                    </div>
                    <div class="tokenSymbol">{{ item.symbol }}</div>
                  </div>
                  <div class="rightSide">
                    <div class="rowItem">
                      <div class="total"><span class="balancePrice">~${{ fixedPrice(item.balance*item.tokenPrice) }}</span>&nbsp;&nbsp;{{ item.balance }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <i-button block size="lg" variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-2" @click="withdraw()">Withdraw</i-button>
            <div class="_text-center expectedInfo _display-block">
                Fee: ~{{ currentExpectedFee }} ETH
                <span class="expectedPrice"><span class="">~${{ fixedPrice(currentExpectedFee*tokenPricesMap['ETH']) }}</span></span>
            </div>
          </div>
          <div v-else-if="step===2">
            <p class="_text-center _margin-top-0">
              Your request was saved under <b>#ID-{{txID}}</b>.
              <br>Please send exactly <b>{{currentWithdrawalFee}}</b> ETH 
              <br>to the address <b>{{featureStatus && featureStatus.forcedExitContractAddress}}</b> within the next <b>{{waitTime}}</b> to perform an alternative withdrawal.
            </p>
            <p class="_text-center">
              The information about the withdrawal has been saved in the local browser storage. 
              Alternatively, you can keep track of the account on its <a :href="addressZkScanLink" target="_blank">zkscan</a> page. 
              After the request is fulfilled, it may take up to 5 hours before the funds reach your L1 account.
            </p>
            <i-button block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
          </div>
        </div>
      </div>
      <div class="dropdownsContainer" v-if="step===0">
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
                <div class="_text-align-center">send <b>exactly</b> <b>{{item.token.amount}} {{item.token.symbol}}</b> </div>
                <div class="_text-align-center">to <b>{{item.contractAddress}}</b></div>
                <div class="_text-align-center">Time until the order expires: <b><time-ticker :time="item.sendUntil" /></b></div>
              </div>
              <div v-else>
                <div class="_text-align-center _margin-top-1">The request has expired.</div>
              </div>
              <div class="transactionDetails _margin-top-1">
                <div class="_margin-top-1 bigText"><b>Details:</b></div>
                <div class="_margin-top-1 ">Account:</div> 
                <div class="bold">{{item.target}}</div>
                <div class="_margin-top-1 ">Tokens to withdraw:</div>
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
import Vue from 'vue';

import moment from "moment";
import { BigNumber, BigNumberish } from 'ethers'
import { getDefaultProvider, Provider, types as SyncTypes } from 'zksync';
import { Address, Balance } from '@/plugins/types'

import utils from "@/plugins/utils";
import supportBlock from "@/blocks/SupportBlock.vue";
import addressInput from "@/components/AddressInput.vue";
import dropdown from "@/components/DropdownBlock.vue";
import timeTicker from "@/components/TimeTicker.vue";
import logo from "@/blocks/Logo.vue";
import headerComponent from "@/blocks/Header.vue";
import footerComponent from "@/blocks/Footer.vue";

const ZKSCAN_ADDRESS = 'http://localhost:7000';
const NETWORK = 'localhost';
const FORCED_EXIT_API = 'http://localhost:3001/api/forced_exit_requests/v0.1';

const UNAVALIABLE_MESSAGE = 'Sorry, the automated forced exit procedure is unavailable now. In case of any inconvenience contact us by';

interface StatusResponse {
    status: 'enabled' | 'disabled';
    requestFee: string;
    maxTokensPerRequest: number;
    recomendedTxIntervalMillis: number;
    forcedExitContractAddress: Address;
}

function getEndpoint(endpoint: string) {
  return FORCED_EXIT_API + endpoint;
}

async function getStatus() {
    const endpoint = getEndpoint('/status');
    const response = await fetch(endpoint);

    const json = await response.json();
    return json as StatusResponse;
}

async function submitRequest(address: string, tokens: number[], price_in_wei: BigNumberish) {
    const endpoint = getEndpoint('/submit');

    const data = {
        target: address,
        tokens,
        price_in_wei: price_in_wei.toString()
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(data)
    });

    const json = await response.json();

    if (response.status < 200 || response.status > 299) {
      throw new Error(json.title);
    }

    return json;
}

async function checkEligibilty(address: string): Promise<boolean> {
  const endpoint = getEndpoint(`/checks/eligibility/${address}`);

  console.log(endpoint);

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

interface RequestStatusResponse {
  id: number,
  target: string,
  tokens: number[],
  priceInWei: string,
  validUntil: string,
  createdAt: string,
  fulfilledBy: string[]|null,
  fulfilledAt: string|null
}

interface requestType {
  id: number,
  createdAt: number,
  sendUntil: number,
  target: string,
  token: {
    amount: string,
    symbol: string
  },
  contractAddress: string,
  balances: Array<Balance>,
  fulfilledBy?: string[],
}

interface WithdrawalResponse {
    id: number,
    target: SyncTypes.Address,
    tokens: number[],
    priceInWei: string,
    // Date objects are json since it is how
    // the `.json()` deserializes them
    validUntil: string,
    createdAt: string,
    fulfilledBy?: string[],
    fulfilledAt?: string,
}

interface ModalParams {
  // If the open is open or not
  open: boolean,
  // What message is displayed
  message: string,
  // Are there any social links 
  social: boolean,
  // If it is possible to close the modal
  closable: boolean
}

interface TokenPricesMap {
  [key: string]: number
}

type SubErrorType = 'Active' | 'NotExists' | 'TooYoung' | 'None' | 'Other';

export default Vue.extend({
  components: {
    addressInput,
    dropdown,
    timeTicker,
    supportBlock,
    headerComponent,
    footerComponent,
    logo
  },
  layout: "index",
  data() {
    return {
      step: 0,
      loading: true,
      provider: null as Provider|null,
      featureStatus: null as StatusResponse|null,
      modalParams: {
        open: false,
        message: '',
        social: false,
        closable: false
      } as ModalParams,
      subError: '',
      subErrorType: 'None' as SubErrorType,
      tokenPricesMap: {} as TokenPricesMap,

      /* Step 0 */
      address: '',
      howThisWorksModal: false,
      
      /* Step 1 */
      search: '',
      balancesList: [] as Array<Balance>,
      forceUpdateVal: 0,
      forceUpdateRequestsVal: 0,

      /* Step 2 */
      txID: 0,
      currentWithdrawalFee: ''
    };
  },
  computed: {
    addressZkScanLink: function(): string {
      return `${ZKSCAN_ADDRESS}/accounts/${this.address}`;
    },
    maxTokensReached: function(): boolean {
      return this.choosedItems.length >= this.featureStatus!.maxTokensPerRequest;
    },
    currentExpectedFee: function(): string {
      const feeForOneRequest = BigNumber.from(this.featureStatus?.requestFee);
      const expectedFee = feeForOneRequest.mul(this.choosedItems.length);

      return this.provider!.tokenSet.formatToken('ETH', expectedFee.toString());
    },

    requestsList: function(): Array<requestType> {
      this.forceUpdateRequestsVal;
      return this.getItemsFromStorage();
    },

    /* Step 1 */
    choosedItems: function (): Array<Balance> {
      this.forceUpdateVal;
      return this.balancesList.filter((e: Balance) => e.choosed===true);
    },
    displayedList: function (): Array<Balance> {
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
    }
  },
  async created() {
    this.featureStatus = await getStatus();

    if (this.featureStatus.status == 'enabled') {
      this.loading = false;
    } else {
      this.setUnavaliabeModal();
    }

    const updateFulfilledInterval = setInterval(() => {
        this.checkFulfilled();
    }, 1000);
  },
  methods: {
    toggleHowThisWorksModal() {
      this.howThisWorksModal = !this.howThisWorksModal;
    },
    zkscanLinkToTx(hash: string) {
      return `${ZKSCAN_ADDRESS}/transactions/${hash}`;
    },
    async checkFulfilled() {
      const requests = this.getItemsFromStorage();

      // Here we check for each request if it has been fulfilled
      const checkedFulfilledPromises = requests.map(async (request) => {
        // If it has been already fulfilled, no need to check it again
        if(request.fulfilledBy) {
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
            fulfilledBy: requestStatus.fulfilledBy
          } as requestType;
        } else {
          return request;
        }
      });

      try {
        const checkedFullfilled = await Promise.all(checkedFulfilledPromises);
        this.updateLocalStorage(checkedFullfilled);
      } catch(e) {
        console.warn(`An error while update occured: ${e.toString()}`);
      }
    },
    fixedPrice(price: number) {
      return price.toFixed(2);
    },
    hasExpired(request: requestType) {
      const timeLeft = (request.sendUntil-(new Date()).getTime())/1000;
      return timeLeft <= 0;
    },
    getFormattedTime: function (time: number): string {
      return moment(time).format("M/D/YYYY h:mm:ss A");
    },
    getItemsFromStorage: function(): Array<requestType> {
      var data = localStorage.getItem('forcedExitRequests');
      try {
        if(!data) {
          return []
        }
        data = JSON.parse(data);
        if(!Array.isArray(data)) {return []}
      } catch (error) {
        return []
      }
      return data.sort((a, b) => b.createdAt - a.createdAt);
    },
    saveToLocalStorage: function(tx: requestType) {
      var newData = this.getItemsFromStorage();
      newData.push(tx);
      this.updateLocalStorage(newData);
    },
    removeFromLocalStorage(request: requestType) {
      var newData = this.getItemsFromStorage();
      newData = newData.filter((r) => r.id != request.id);
      this.updateLocalStorage(newData);
    },
    updateLocalStorage: function(txs: requestType[]) {
      localStorage.setItem('forcedExitRequests', JSON.stringify(txs));
      this.forceUpdateRequestsVal++;
    },

    async getProvider() {
      if(!this.provider) {
        this.provider = await getDefaultProvider(NETWORK);
      } 
      return this.provider;
    },

    async updateStatus() {
      this.featureStatus = await getStatus();
    },

    /* Step 0 */
    checkAddress: async function() {
      this.loading=true;
      try {

        const provider = await this.getProvider();
        const state = await provider.getState(this.address);

        if (!state.id || state.id === -1) {
          this.setAccountDoesNotExistModal();
          return;
        } 

        if (state.committed.nonce) {
          //this.subError = 'bad noce';
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
          [token]: await provider.getTokenPrice(token)
        }));
        const tokenPricesArray = await Promise.all(tokenPricesPromises);

        if (!tokenPricesArray.length) {
          this.balancesList = [];
          this.step = 1;
          return;
        }

        const tokenPricesObj = tokenPricesArray.reduce((prev, cur) => ({
          ...prev,
          ...cur
        }));

        if(!tokenPricesObj['ETH']) {
          tokenPricesObj['ETH'] = await this.provider!.getTokenPrice('ETH');
        }

        this.tokenPricesMap = tokenPricesObj;

        this.balancesList = [];
        Object.entries(state.committed.balances).forEach(([symbol, amount]) => {
          const tokenPrice = tokenPricesObj[symbol] as number;
          
          this.balancesList.push({
            symbol,
            status: "Pending",
            balance: provider.tokenSet.formatToken(symbol, amount.toString()),
            rawBalance: BigNumber.from(amount),
            verifiedBalance: provider.tokenSet.formatToken(symbol, amount.toString()),
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

        this.step=1;
      } catch (error) {
        console.log('an error handled: ', error);
        const errorStr = error?.toString();
        this.setErrorModal(errorStr);
      } finally {
        this.loading=false;
      }
    },
    
    /* Step 1 */
    setItemChecked: function(item: Balance) {
      for(let a=0; a<this.balancesList.length; a++) {
        if(this.balancesList[a].symbol===item.symbol) {
          this.balancesList[a] = {...this.balancesList[a], choosed: !this.balancesList[a].choosed}
          this.forceUpdateVal++;
          break;
        }
      }
    },
    withdraw: async function() {
      this.loading=true;

      const selectedTokens = this.balancesList
        .filter((token) => token.choosed)
        .map((token) => this.provider?.tokenSet.resolveTokenId(token.symbol) as number);
      
      const pricePerTokenStr = this.featureStatus?.requestFee as string;
      const pricePerToken = BigNumber.from(pricePerTokenStr);

      try {
        await this.updateStatus();

        const withdrawalReponse = await submitRequest(
          this.address,
          selectedTokens,
          pricePerToken.mul(selectedTokens.length).toString()
        ) as WithdrawalResponse;
        console.log('respo', withdrawalReponse);
        this.txID=withdrawalReponse.id;
        this.step=2;
    

        const amountToSend = BigNumber.from(withdrawalReponse.priceInWei).add(this.txID)

        this.currentWithdrawalFee = this.provider?.tokenSet.formatToken("ETH", amountToSend) as string;

        const createdAt = (new Date(withdrawalReponse.createdAt)).getTime();
        const recommendedValidUntil = (new Date(createdAt + this.featureStatus!.recomendedTxIntervalMillis)).getTime();
        const validUntil = (new Date(withdrawalReponse.validUntil)).getTime();

        const sendUntil = Math.min(recommendedValidUntil, validUntil);

        this.saveToLocalStorage({
          id: this.txID, 
          createdAt, 
          token: {
            amount: this.currentWithdrawalFee,
            symbol: "ETH"
          }, 
          sendUntil, 
          contractAddress: this.featureStatus?.forcedExitContractAddress as string,
          balances: this.choosedItems,
          target: this.address
        });

        for(let a=0; a<this.balancesList.length; a++) {
          this.balancesList[a] = {...this.balancesList[a], choosed: false}
        }
      } catch(err) {
        this.setErrorModal(err);
        this.step = -1;
        this.address='';
      } finally {
        this.forceUpdateVal++;
        this.search='';
        this.loading=false;
      }
    },

    /* Step 2 */
    finish: function() {
      this.address='';
      this.step=0;
    },

    removeModal() {
      this.modalParams.open = false;
    },

    setUnavaliabeModal() {
      this.step= -1;
      this.modalParams = {
        open: true,
        message: UNAVALIABLE_MESSAGE,
        social: true,
        closable: false,
      };
    },

    setErrorModal(err: any) {
      this.step= -1;

      this.modalParams = {
        open: true,
        message: err.toString(),
        social: true,
        closable: true,
      };
    },


    setSubError(err: any) {
      if(!err) {
        this.removeError();
      } else {
      //console.log('here comes', err);
        this.subErrorType = 'Other';
        this.subError = err.toString();
      }
    },  

    setTooYoungModal() {
        this.subErrorType = 'TooYoung';
        this.subError = '';
    },

    setNonceModal() {
      //this.step= -1;

      this.subErrorType = 'Active';
      this.subError = 'The account that had any activity on zkSync can only use the wallet to withdraw';

      // this.modalParams = {
      //   open: true,
      //   message: 'The account should have a zero nonce & should exist (hold any funds in the network) for at least 24 hours',
      //   social: false,
      //   closable: true,
      // };
    },

    setAccountDoesNotExistModal() {

      this.subErrorType = 'NotExists';
      this.subError = 'The account does not exist in the zkSync network';

      // this.step= -1;

      // this.modalParams = {
      //   open: true,
      //   message: 'The account does not exist in the zkSync network',
      //   social: false,
      //   closable: true,
      // };
    },

    removeError(){
      this.subError = '';
      this.subErrorType = 'None';
    }
  },
});
</script>
