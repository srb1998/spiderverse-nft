require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({path:".env"});

const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;
const SEPOLIYA_PRIVATE_KEY = process.env.SEPOLIYA_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.4",
  networks: {
    sepolia: {
      url: ALCHEMY_API_KEY_URL,
      accounts: [SEPOLIYA_PRIVATE_KEY]
    },
  },
};  
