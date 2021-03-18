<template>
  <div class="indexPage" :class="{'hasRequests': (requestsList.length>0 && step===0)}">
    <div class="tileBlock">
      <div class="tileHeadline h3" :class="{'withBtn': step===1}">
        <transition name="fade">
          <div class="returnBtn" v-if="step===1" @click="step=0">
            <i class="far fa-long-arrow-alt-left"></i>
          </div>
        </transition>
        <div>Alternative Withdrawal</div>  
      </div>
      <div class="formContainer">
        <transition name="fade">
          <div v-if="loading" class="centerBlock loadingBlock">
            <loader/>
          </div>
        </transition>
        <div class="_margin-top-2" v-if="step===0">
          <div class="inputLabel">Address</div>
          <address-input v-model="address" />
          <i-button block sizemax="lg" variant="secondary" :disabled="!address" class="_margin-top-2" @click="checkAddress()">Continue</i-button>
        </div>
        <div v-else-if="step===-1">
          <p class="_text-center _margin-top-0">
            Sorry, August tomated forced exit procedure is unavailable now. In case of any inconvenience contact us by
          </p>
          <social-block />
          <i-button block size="lg" variant="secondary" class="_margin-top-2" @click="finish()">Ok</i-button>
        </div>
        <div class="_margin-top-2" v-else-if="step===1">
          <i-input v-model="search" placeholder="Filter tokens" maxlength="6">
            <i slot="prefix" class="far fa-search"></i>
          </i-input>
          <div v-if="search && displayedList.length===0" class="centerBlock _margin-top-2">
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
            Your request save with the number <b>#ID-{{txID}}</b>.
            <br>Please send exactly <b>{{currentWithdrawalFee}}</b> ETH to the address {{featureStatus && featureStatus.forcedExitContractAddress}} next <b>48 hours</b> to perform an alternative withdrawal
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
            <div class="_text-align-center">Time to send <b>{{item.token.amount}}{{item.token.symbol}}</b>: <time-ticker :time="item.sendUntil" /></div>
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

/* import dropdown from "@/components/DropdownBlock.vue"; */
import socialBlock from "@/blocks/SocialBlock.vue";
import addressInput from "@/components/AddressInput.vue";
import dropdown from "@/components/DropdownBlock.vue";
import timeTicker from "@/components/TimeTicker.vue";

const NETWORK = 'localhost';
const FORCED_EXIT_API = 'http://localhost:3001/api/forced_exit_requests/v0.1';

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

    return await response.json();
}

interface requestType {
  id: number,
  createdAt: number,
  sendUntil: number,
  token: {
    amount: string,
    symbol: string
  },
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
  },
  async created() {
    this.featureStatus = await getStatus();

    if (this.featureStatus.status == 'enabled') {
      this.loading = false;
    } else {
      this.step = -1;
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

    /* Step 0 */
    checkAddress: async function() {
      this.loading=true;
      try {

        const provider = await this.getProvider();
        const state = await provider.getState(this.address);

        // TODO: better error-handling so show errors to the user
        // and not only in console
        if (state.committed.nonce) {
          throw new Error('Can not forced exit account with non-zero nonce');
        }

        if (!state.id || state.id === -1) {
          throw new Error("The account does not exist in the zkSync network");
        } 

        // A person might have a bunch of tokens, so it is better to fetch prices 
        // in paralel
        const tokenPricesPromises = Object.keys(state.committed.balances).map(async (token) => ({
          [token]: await provider.getTokenPrice(token)
        }));
        const tokenPricesArray = await Promise.all(tokenPricesPromises);
        const tokenPricesObj = tokenPricesArray.reduce((prev, cur) => ({
          ...prev,
          ...cur
        }));

        this.balancesList = [];
        Object.entries(state.committed.balances).forEach(([symbol, amount]) => {
          const tokenPrice = tokenPricesObj[symbol] as number;
          console.log(tokenPrice);
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
        this.step=-1;
      }
      this.loading=false;
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

      const withdrawalReponse = await submitRequest(
        this.address,
        selectedTokens,
        pricePerToken.mul(selectedTokens.length).toString()
      ) as WithdrawalResponse;

      this.txID=withdrawalReponse.id;
      this.step=2;

      const amountToSend = BigNumber.from(withdrawalReponse.priceInWei).add(this.txID)

      this.currentWithdrawalFee = this.provider?.tokenSet.formatToken("ETH", amountToSend) as string;

      this.saveToLocalStorage({
        id: this.txID, 
        createdAt: (new Date(withdrawalReponse.createdAt)).getTime(), 
        token: {
          amount: this.currentWithdrawalFee,
          symbol: "ETH"
        }, 
        sendUntil: (new Date(withdrawalReponse.validUntil)).getTime(), 
        balances: this.choosedItems
      });

      for(let a=0; a<this.balancesList.length; a++) {
        this.balancesList[a] = {...this.balancesList[a], choosed: false}
      }

      this.forceUpdateVal++;
      this.address='';
      this.search='';
      this.loading=false;
    },

    /* Step 2 */
    finish: function() {
      this.step=0;
    }
  },
});
</script>
