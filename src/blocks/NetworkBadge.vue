<template>
  <i-badge v-if="!isMainnet" variant="primary">
    <small class="version">{{ network }}</small>
  </i-badge>
</template>
<script lang="ts">
import Vue from "vue";
import { ETHER_NETWORK_NAME } from "@/plugins/build";

export default Vue.extend({
  name: "NetworkBadge",
  computed: {
    isMainnet(): boolean {
      return ETHER_NETWORK_NAME === "mainnet";
    },
    network(): string {
      return ETHER_NETWORK_NAME;
    },
  },
});
</script>
