<template>
    <span>
        {{timeStr}}
    </span>
</template>

<script>
import utils from "@/plugins/utils";

var tickerInterval;
export default {
    props: {
        time: {
            type: Number,
            required: true,
            default: 0
        }
    },
    data() {
        return {
            forceUpdateVal: -1000000000
        }
    },
    watch: {
        time() {
            this.forceUpdateVal++;
        }
    },
    computed: {
        timeStr: function() {
            this.forceUpdateVal++;
            const timeLeft = parseInt((this.time-new Date().getTime())/1000);
            console.log(timeLeft);
            if(timeLeft<=0) {
                return 'Expired';
            }
            const { hours, minutes, seconds } = utils.timeCalc(timeLeft);
            return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        }
    },
    mounted() {
        tickerInterval = setInterval(() => {
            this.forceUpdateVal++;
        }, 1000);
    },
    beforeDestroy() {
        clearInterval(tickerInterval);
    }
}
</script>