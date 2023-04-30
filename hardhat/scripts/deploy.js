const { ethers } = require("hardhat");
require("dotenv").config({path:".env"});
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");


async function main() {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

  const metadataURL = METADATA_URL;

  const spiderverseContract = await ethers.getContractFactory("Spiderverse");

  const deployedSpiderverseContract = await spiderverseContract.deploy(
    metadataURL,
    whitelistContract
  );

  await deployedSpiderverseContract.deployed();

  console.log("Spiderverse Contract Address:",deployedSpiderverseContract.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
