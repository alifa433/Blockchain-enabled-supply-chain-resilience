require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

const networks = {
  hardhat: {},
  localhost: {
    url: "http://127.0.0.1:8545"
  }
};

if (PRIVATE_KEY && RPC_URL) {
  networks.custom = {
    url: RPC_URL,
    accounts: [PRIVATE_KEY]
  };
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
