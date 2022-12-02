<template>
  <header class="indexHeader">
    <div class="mainIndexHeader">
      <i-container>
        <i-row>
          <i-column :xs="12" :md="4" class="_padding-left-0">
            <a class="logoLink" href="http://zksync.io/" target="_blank">
              <logo/>
              <network-badge />
            </a>
          </i-column>
          <i-column :xs="12" :md="4" class="_margin-left-auto _padding-right-0 _justify-content-end desktopOnly">
            <social-block/>
          </i-column>
        </i-row>
      </i-container>
    </div>
  </header>
</template>

<script lang="ts">
import Logo from "@/blocks/Logo.vue";
import SocialBlock from "@/blocks/SocialBlock.vue";
import NetworkBadge from "@/blocks/NetworkBadge.vue";
import Vue from "vue";

export default Vue.extend({
  components: {
    Logo,
    SocialBlock,
    NetworkBadge
  },
});
</script>
