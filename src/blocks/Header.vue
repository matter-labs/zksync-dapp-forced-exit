<template>
  <header class="indexHeader" :class="{'opened': opened}">
    <div class="mainIndexHeader">
      <i-container>
        <i-row>
          <i-column :xs="12" :md="4" class="_padding-left-0">
            <logo/>
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
import logo from "@/blocks/Logo.vue";
import SocialBlock from "@/blocks/SocialBlock.vue";
import Vue from "vue";

export default Vue.extend({
  components: {
    logo,
    SocialBlock,
  },
  data() {
    return {
      opened: false,
      showLogo: true,
    };
  },
  beforeMount() {
    if (process.client && window.pageXOffset < 768) {
      window.addEventListener("scroll", this.handleScroll);
    }
  },
  beforeDestroy() {
    if (process.client && window.pageXOffset < 768) {
      window.removeEventListener("scroll", this.handleScroll);
    }
  },
  methods: {
    handleScroll() {
      this.showLogo = window.pageYOffset > 300;
    },
  },
});
</script>
