import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import {HardhatUserConfig} from "hardhat/config";
import "solidity-coverage";
import "./tasks/dao.ts";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    networks: {
        // hardhat: {
        //     forking: {
        //         url: process.env.RENKEBY_URL || '',
        //     },
        // },
        rinkeby: {
            url: process.env.RENKEBY_URL || '',
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        testnetBinance: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        binance: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        }

    },
    etherscan: {
        // Your API key for Etherscan https://etherscan.io
        apiKey: process.env.ETHERSCAN_KEY
       // apiKey: process.env.BINANCE_ETHSCAN_KEY
    }


};
export default config;
