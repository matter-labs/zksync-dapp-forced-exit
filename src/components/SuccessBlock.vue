<template>
  <div class="successBlock tileBlock">
    <div class="tileHeadline h3">
      <span>{{ headline }}</span>
    </div>
    <checkmark />
    <a v-if="txLink" :href="txLink" class="_display-block _text-center" target="_blank"> Link to the transaction <i class="fas fa-external-link"></i> </a>
    <slot />
    <div v-if="recipient" class="infoBlockItem smaller _margin-top-2">
      <div class="amount">
        <span>Recipient:</span>
        <span v-if="isOwnAddress(recipient.address)" class="secondaryText">Own account</span>
        <span v-else-if="recipient.name" class="secondaryText">{{ recipient.name }}</span>
      </div>
      <wallet-address :wallet="recipient.address" />
    </div>
    <div v-if="amount" class="infoBlockItem _margin-top-1">
      <div class="headline">Amount:</div>
      <div class="amount">
        <span class="tokenSymbol">{{ amount.token.symbol }}</span>
        {{ amount.amount | formatToken(amount.token.symbol) }}
        <span class="secondaryText">
          {{ amount.amount | formatUsdAmount(amount.token.tokenPrice, amount.token.symbol) }}
        </span>
      </div>
    </div>
    <i-button v-if="continueBtnFunction" block size="lg" variant="secondary" class="_margin-top-2" @click="$emit('continue')">Ok</i-button>
    <i-button v-else block size="lg" variant="secondary" class="_margin-top-2" :to="continueBtnLink">Ok</i-button>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Address } from "@/plugins/types";
import Checkmark from "@/components/Checkmark.vue";
import WalletAddress from "@/components/walletAddress.vue";

export default Vue.extend({
  components: {
    Checkmark,
    WalletAddress,
  },
  props: {
    type: {
      type: String,
      default: "",
      required: false,
    },
    headline: {
      type: String,
      default: "",
      required: false,
    },
    txLink: {
      type: String,
      default: "",
      required: false,
    },
    continueBtnLink: {
      type: String,
      default: "/account",
      required: false,
    },
    continueBtnFunction: {
      type: Boolean,
      default: false,
      required: false,
    },
    recipient: {
      type: Object,
      required: false,
    },
    amount: {
      type: Object,
      required: false,
    },
    fee: {
      type: Object,
      required: false,
    },
  },
  computed: {
    ownAddress(): Address {
      return this.$store.getters["account/address"];
    },
  },
  methods: {
    isOwnAddress(address: Address): boolean {
      return this.ownAddress.toLowerCase() === address.toLowerCase();
    },
  },
});
</script>
