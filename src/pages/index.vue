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
          <i-button block size="lg" variant="secondary" :disabled="!address" class="_margin-top-2" @click="checkAddress()">Continue</i-button>
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
            <br>Please send exactly <b>12.443ETH</b> to the address next <b>48 hours</b> to perform a forcedexit
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
import { BigNumber } from 'ethers'
import { getDefaultProvider, Provider } from 'zksync';
import { Balance, TokenPrices } from '@/plugins/types'

/* import dropdown from "@/components/DropdownBlock.vue"; */
import socialBlock from "@/blocks/SocialBlock.vue";
import addressInput from "@/components/AddressInput.vue";
import dropdown from "@/components/DropdownBlock.vue";
import timeTicker from "@/components/TimeTicker.vue";

const NETWORK = 'mainnet';

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
      loading: false,
      provider: null as Provider|null,

      /* Step 0 */
      address: '',
      
      /* Step 1 */
      search: '',
      balancesList: [] as Array<Balance>,
      forceUpdateVal: 0,
      forceUpdateRequestsVal: 0,

      /* Step 2 */
      txID: 0
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
      await new Promise((resolve)=> {
        setTimeout(() => {
          resolve(true);
        }, 600);
      });
      this.txID=Math.ceil(Math.random()*1000000000);
      this.step=2;
      this.saveToLocalStorage({id: this.txID, createdAt: new Date().getTime(), token: {amount: "0.001",symbol:"ETH"}, sendUntil: new Date().getTime()+172800000, balances: this.choosedItems});
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
