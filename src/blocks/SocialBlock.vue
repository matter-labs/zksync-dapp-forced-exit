<template>
  <div class="socialIcons">
    <a
      v-for="(socialProfile, numIndex) in socialNetworks"
      :key="numIndex"
      :href="socialProfile.url"
      class="socialItem"
      target="_blank">
      <i :class="[socialProfile.icon,'fab']"/>
    </a>
  </div>
</template>

<script>
export default {
  props: {
    location: {
      required: false,
      type: String,
      default: "header",
    },
  },
  computed: {
    socialNetworks() {
      const socialIcons = [
        {
          name: "Discord Community",
          icon: ["fa-discord", "fab"],
          url: "https://join.zksync.dev/",
        },
        {
          name: "Twitter Community",
          icon: ["fa-twitter", "fab"],
          url: "https://twitter.com/zksync",
        },
        {
          name: "All Contacts",
          icon: ["fa-at", "fal"],
          url: "/contact.html",
          hideIn: "footer",
        },
      ];
      return socialIcons.filter((item) => !item.hideIn || item.hideIn !== this.location);
    },
  },
};
</script>
