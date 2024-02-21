import { utils as zkUtils } from "zksync";
import { BigNumberish, utils } from "ethers";
import { walletData } from "@/plugins/walletData";
import { Address, DecimalBalance, GweiBalance, TokenSymbol } from "@/plugins/types";

/**
 *
 * @param symbol
 * @param amount
 * @return {BigNumber|*}
 */
const parseToken = (symbol: TokenSymbol, amount: DecimalBalance | number) => {
  /**
   * skip already bignumber
   */
  if (typeof amount === "object") {
    return amount;
  }
  if (typeof amount === "number") {
    const tokenDecimals = walletData.get().syncProvider!.tokenSet.resolveTokenDecimals(symbol);
    amount = amount.toFixed(tokenDecimals);
  }
  return walletData.get().syncProvider!.tokenSet.parseToken(symbol, amount.toString());
};

const handleFormatToken = (symbol: TokenSymbol, amount: GweiBalance) => {
  if (!amount || amount === "undefined") return "0";
  return walletData.get().syncProvider!.tokenSet.formatToken(symbol, amount);
};

export default {
  parseToken,

  timeCalc: (timeInSec: number) => {
    const hours = Math.floor(timeInSec / 60 / 60);
    const minutes = Math.floor(timeInSec / 60) - hours * 60;
    const seconds = timeInSec - hours * 60 * 60 - minutes * 60;

    return {
      hours,
      minutes,
      seconds,
    };
  },

  handleTimeAmount: (time: number, string: string) => `${time} ${string}${time > 1 ? "s" : ""}`,

  handleFormatToken,

  getFormattedTotalPrice: (price: number, amount: number) => {
    const total = price * amount;
    if (!amount || total === 0) {
      return "$0.00";
    }
    return total < 0.01 ? `<$0.01` : `~$${total.toFixed(2)}`;
  },

  /**
   * @todo Optimize sorting
   *
   * @param a
   * @param b
   * @return {number}
   */
  sortBalancesById: (a: any, b: any) => {
    if (a.hasOwnProperty("id")) {
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }
      return 0;
    } else {
      return a.symbol.localeCompare(b.symbol);
    }
  },

  isAmountPackable: (amount: String): boolean => {
    return zkUtils.isTransactionAmountPackable(amount as BigNumberish);
  },

  validateAddress: (address: Address): boolean => {
    return utils.isAddress(address);
  },

  screenAddress: async (address: string) => {
    if (!process.env.APP_SCREENING_API_URL) {
      return;
    }

    const url = new URL(process.env.APP_SCREENING_API_URL);
    url.searchParams.append("address", address);

    let response;
    try {
      const fetchResponse = await fetch(url.toString());
      if (!fetchResponse.ok) {
        throw new Error("Network response was not ok.");
      }
      response = await fetchResponse.json();
    } catch (error) {
      response = { result: true }; // Fallback response in case of error
    }

    if (!response.result) {
      throw new Error("We were unable to process this transaction...");
    }
  },
};
