import {ethers} from "hardhat";

const contract_name = 'Dao'
const usdcToken = '0x58c391bfCf7C7aEf634052F4A41a79488Fe6A51F'
const chairMan = '0x7620B8FC45f0F445471Aa9534C3836d290CC6d93'
const minimumQuorum = 2
const debatingPeriodDuration = 3600


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const factory = await ethers.getContractFactory(contract_name);
    const contract = await factory.deploy(chairMan, usdcToken, minimumQuorum, debatingPeriodDuration);
    await contract.deployed();

    console.log("Contract deployed to:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });