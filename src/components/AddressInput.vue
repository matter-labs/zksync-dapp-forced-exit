<template>
  <div class="addressInput">
    <div class="walletContainer inputWallet" :class="{'error': error}" @click.self="focusInput()">
      <user-img v-if="isValid" :wallet="inputtedWallet"/>
      <div class="userImgPlaceholder userImg" v-else></div>
      <input ref="input" v-model="inputtedWallet" autocomplete="none" class="walletAddress" maxlength="45" placeholder="0x-address to withdraw the funds from" spellcheck="false" type="text" @keyup.enter="$emit('enter')">
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import utils from '@/plugins/utils'

import userImg from '@/components/userImg.vue'

export default Vue.extend({
  props: {
    value: {
      type: String,
      default: '',
      required: false,
    },
  },
  data () {
    return {
      inputtedWallet: this.value ? this.value : '',
    }
  },
  watch: {
    inputtedWallet (val) {
      const trimmed = val.trim()

      console.log('inputtewd', val);
      this.inputtedWallet = trimmed;
      this.$emit('change', '');

      if (val !== trimmed) {
        return
      } 

      console.log('wallet', this.inputtedWallet);
      console.log('inputtewd', this.isValid);
      if (this.isValid) {
        this.$emit('input', val)
      } else {
        this.$emit('input', '')
      }
    },
    value (val) {
      if (this.isValid || (!this.isValid && !!val)) {
        this.inputtedWallet = val
      }
    },
  },
  components: {
    userImg,
  },
  computed: {
    isValid: function (): boolean {
      return utils.validateAddress(this.inputtedWallet)
    },
    error: function (): string {
      if (this.inputtedWallet && !this.isValid) {
        return 'Invalid address'
      } else {
        return ''
      }
    },
  },
  methods: {
    focusInput: function (): void {
      if (this.$refs.input) {
        // @ts-ignore: Unreachable code error
        this.$refs.input.focus()
      }
    },
  },
})
</script>
