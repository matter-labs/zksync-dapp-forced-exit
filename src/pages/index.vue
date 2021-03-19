<template>
  <div class="indexPage" :class="{'hasRequests': (requestsList.length>0 && step===0)}">
    <div class="tileBlock">
      <div class="tileHeadline h3" :class="{'withBtn': step===1}">
        <div class="returnBtn" v-if="step===1" @click="step=0">
            <i class="far fa-long-arrow-alt-left"></i>
        </div>
        <div>Alternative Withdrawal</div>  
      </div>
      <div class="formContainer">
        <transition name="fade">
          <div v-if="loading" class="centerBlock loadingBlock">
            <loader/>
          </div>
        </transition>
        <div class="_margin-top-2" v-if="step===0">
          <!-- <div class="inputLabel">Address</div> -->
          <address-input v-model="address" @change="removeError()"/>
          <!-- <div v-if=> -->
          <div v-if="SubErrorType==='Active'" class="errorText _text-center _margin-top-1 secondaryText">
            The provided account has done transactions on zkSync before.
            <br/>Please go to the <a target="_blank" href="http://wallet.zksync.io/" class="linkText">official wallet</a> to withdraw the funds.
          </div>
          <div v-if="SubErrorType==='NotExists'" class="errorText _text-center _margin-top-1 secondaryText">
            The account does not exist on zkSync network.
          </div>
          <div v-if="SubErrorType==='TooYoung'" class="errorText _text-center _margin-top-1 secondaryText">
            To perform an alternative withdrawal an account should exist at least 24 hours.
          </div>
          <div v-if="SubErrorType==='Other'" class="errorText _text-center _margin-top-1 secondaryText">
            {{subError}}
          </div>
          
          <i-button block sizemax="lg" variant="secondary" :disabled="!address" class="_margin-top-1" @click="checkAddress()">Continue</i-button>
        </div>
        <div v-else-if="step===-1 && modalParams.open">
          <p class="_text-center _margin-top-0">
            {{modalParams.message}}
          </p>
          <p class="_text-center" v-if="modalParams.social">If you think this is a mistake, contact us by</p>
          <social-block v-if="modalParams.social" />
          <i-button v-if="modalParams.closable" block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
        </div>
        <div class="_margin-top-2" v-else-if="step===1">
          <i-input v-model="search" placeholder="Filter tokens" maxlength="6">
            <i slot="prefix" class="far fa-search"></i>
          </i-input>
          <div v-if="balancesList.length===0" class="centerBlock _margin-top-2">
            <span>The account's balance is empty</span>
          </div>
          <div v-else-if="search && displayedList.length===0" class="centerBlock _margin-top-2">
            <span>Your search <b>"{{ search }}"</b> did not match any tokens</span>
          </div>
          <div v-else class="balancesList _margin-top-1">
            <div v-for="(item,index) in displayedList" :key="index" class="balanceItem" :class="{'checked': item.choosed}" @click="setItemChecked(item)">
              <div class="leftSide">
                <div class="checkboxContainer">
                  <i class="far fa-check"></i>
                </div>
                <div class="tokenSymbol">{{ item.symbol }}</div>
              </div>
              <div class="rightSide">
                <div class="rowItem">
                  <div class="total"><span class="balancePrice">~${{ item.balance*item.tokenPrice }}</span>&nbsp;&nbsp;{{ item.balance }}</div>
                </div>
              </div>
            </div>
          </div>
          <i-button block size="lg" variant="secondary" :disabled="choosedItems.length<=0" class="_margin-top-2" @click="withdraw()">Withdraw</i-button>
        </div>
        <div v-else-if="step===2">
          <p class="_text-center _margin-top-0">
            Your request was saved with the number <b>#ID-{{txID}}</b>.
            <br>Please send exactly <b>{{currentWithdrawalFee}}</b> ETH 
            <br>to the address {{featureStatus && featureStatus.forcedExitContractAddress}} within the next <b>{{waitTime}}</b> to perform an alternative withdrawal
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
            <div class="_text-align-center">Requested at {{getFormattedTime(item.createdAt)}}</div>
            <div class="_text-align-center">Time left to send <b>{{item.token.amount}} {{item.token.symbol}}</b>: <time-ticker :time="item.sendUntil" /></div>
            <div class="_text-align-center">To <b>{{item.contractAddress}}</b></div>
            <div class="balancesList _margin-top-1">
              <div v-for="(item,index) in item.balances" :key="index" class="balanceItem" @click="setItemChecked(item)">
                <div class="tokenSymbol">{{ item.symbol }}</div>
                <div class="rightSide">
                  <div class="rowItem">
                    <div class="total"><span class="balancePrice">~${{ item.balance*item.tokenPrice }}</span>&nbsp;&nbsp;{{ item.balance }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import moment from "moment";
import { BigNumber, BigNumberish } from 'ethers'
import { getDefaultProvider, Provider, types as SyncTypes } from 'zksync';
import { Address, Balance } from '@/plugins/types'

import utils from "@/plugins/utils";
import socialBlock from "@/blocks/SocialBlock.vue";
import addressInput from "@/components/AddressInput.vue";
import dropdown from "@/components/DropdownBlock.vue";
import timeTicker from "@/components/TimeTicker.vue";

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

interface requestType {
  id: number,
  createdAt: number,
  sendUntil: number,
  token: {
    amount: string,
    symbol: string
  },
  contractAddress: string,
  balances: Array<Balance>
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

type SubErrorType = 'Active' | 'NotExists' | 'TooYoung' | 'None' | 'Other';

export default Vue.extend({
  components: {
    addressInput,
    dropdown,
    timeTicker,
    socialBlock
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
      SubErrorType: 'None' as SubErrorType,

      /* Step 0 */
      address: '',
      
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
  },
  methods: { 
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
      localStorage.setItem('forcedExitRequests', JSON.stringify(newData));
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

        // TODO: better error-handling so show errors to the user
        // and not only in console
        if (state.committed.nonce) {
          //this.subError = 'bad noce';
          this.setNonceModal();
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

        this.step=1;
      } catch (error) {
        console.log(error);
        this.subError = error.toString();
      //  this.setErrorModal(error);
        this.step=-1;
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
          balances: this.choosedItems
        });

        for(let a=0; a<this.balancesList.length; a++) {
          this.balancesList[a] = {...this.balancesList[a], choosed: false}
        }
      } catch(err) {
        this.setErrorModal(err);
        this.step = -1;
      } finally {
        this.forceUpdateVal++;
        this.address='';
        this.search='';
        this.loading=false;
      }
    },

    /* Step 2 */
    finish: function() {
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

    setNonceModal() {
      //this.step= -1;

      this.SubErrorType = 'Active';
      this.subError = 'The account that had any activity on zkSync can only use the wallet to withdraw';

      // this.modalParams = {
      //   open: true,
      //   message: 'The account should have a zero nonce & should exist (hold any funds in the network) for at least 24 hours',
      //   social: false,
      //   closable: true,
      // };
    },

    setAccountDoesNotExistModal() {

      this.SubErrorType = 'NotExists';
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
      this.SubErrorType = 'None';
    }
  },
});
</script>
