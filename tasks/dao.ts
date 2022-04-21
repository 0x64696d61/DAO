import {task} from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import {ethers} from "hardhat";
import {BytesLike} from "@ethersproject/bytes"

const contract_name = 'Dao'
const prefix = contract_name + '_'

task(prefix + "vote", "vote")
    .addParam("address", "Contract address")
    .addParam("proposalId", "proposalId")
    .addParam("choice", "choice")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)
        await contract.connect(acc1).vote(taskArgs.proposalId, taskArgs.choice)
    });


task(prefix + "addProposal", "addProposal")
    .addParam("address", "contract address")
    .addParam("callData", "callData")
    .addParam("recipient", "recipient")
    .addParam("description", "description")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)

        await contract.connect(acc1).addProposal(
            taskArgs.callData,
            taskArgs.recipient,
            taskArgs.description,
            taskArgs.amount
        )
    });

task(prefix + "deposit", "deposit")
    .addParam("address", "contract address")
    .addParam("amount", "amount")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)

        await contract.deposit(taskArgs.amount)
    });

task(prefix + "finish", "deposit")
    .addParam("address", "contract address")
    .addParam("proposalId", "proposalId")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)

        await contract.finishProposal(taskArgs.proposalId)
    });