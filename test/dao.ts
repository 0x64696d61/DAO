import {expect} from "chai";
import {ethers, network} from "hardhat";

const contractName = "Dao"

describe(contractName, function () {
    let acc1: any
    let acc2: any
    let contractDao: any
    let contractUsdc: any
    const amount = 13
    const proposalDescription = 'This is proposal description'
    const proposalsNumber = 0
    const debatingPeriodDuration = 3600

    function getCallData() {
        const jsonAbi = [{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "mint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
        ];
        const iface = new ethers.utils.Interface(jsonAbi);
        return iface.encodeFunctionData('mint', [acc1.address, 100]);
    }

    beforeEach(async function () {

        [acc1, acc2] = await ethers.getSigners()

        let factory = await ethers.getContractFactory("myUSDC", acc1)
        contractUsdc = await factory.deploy();

        factory = await ethers.getContractFactory(contractName, acc1)
        contractDao = await factory.deploy(acc1.address, contractUsdc.address, 2, debatingPeriodDuration);

        contractUsdc.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DAO_ROLE')), contractDao.address)
        await contractUsdc.approve(contractDao.address, contractUsdc.totalSupply())
        await contractUsdc.connect(acc2).approve(contractDao.address, contractUsdc.totalSupply())

        await contractUsdc.transfer(acc2.address, amount + 1)
    })

    it("Should be deployed", async function () {
        expect(contractUsdc.address).to.be.properAddress
    })

    describe("deposit method", function () {
        it("User should be can deposit tokens", async function () {
            let balanceUser = await contractUsdc.balanceOf(acc1.address)
            await contractDao.deposit(amount)

            expect(await contractUsdc.balanceOf(acc1.address)).to.be.equal(balanceUser - amount)
            expect(await contractUsdc.balanceOf(contractDao.address)).to.be.equal(amount)
        })
        // it("User cannot deposit max uint value", async function () {
        //     await expect(contractDao.deposit(ethers.constants.MaxUint256)).to.be.revertedWith("Too much")
        // })
    })

    describe("withdrawal method", function () {
        it("User should be can withdrawal tokens after voting", async function () {
            await contractDao.deposit(amount)
            let balanceUser = await contractUsdc.balanceOf(acc1.address)
            let balanceDao = await contractUsdc.balanceOf(contractDao.address)
            await contractDao.withdrawal()

            expect(await contractUsdc.balanceOf(acc1.address)).to.be.equal(balanceUser.add(amount))
            expect(await contractUsdc.balanceOf(contractDao.address)).to.be.equal(balanceDao.sub(amount))
        })
        it("Disable withdrawal tokens when any voting in process", async function () {
            await contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)
            await contractDao.deposit(amount)
            await contractDao.vote(proposalsNumber, true)

            await expect(contractDao.withdrawal()).to.be.revertedWith("Time for a vote is not up")
        })
        it("Allow withdrawal tokens when voting in finished", async function () {
            let balanceUser = await contractUsdc.balanceOf(acc1.address)
            await contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)
            await contractDao.deposit(amount)
            await contractDao.vote(proposalsNumber, true)
            await network.provider.send("evm_increaseTime", [debatingPeriodDuration])
            await contractDao.withdrawal()

            expect(await contractUsdc.balanceOf(acc1.address)).to.be.equal(balanceUser)
        })
    })

    describe("vote method", function () {

        beforeEach(async function () {
            await contractDao.deposit(amount)
            await contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)
        })


        it("User cannot vote in a non-existent or finished proposal", async function () {
            await expect(contractDao.vote(99, true)).to.be.revertedWith("This proposal is not found or has already been completed")
        })

        it("You cannot vote twice", async function () {
            await contractDao.vote(proposalsNumber, true)
            await expect(contractDao.vote(proposalsNumber, true)).to.be.revertedWith("You already voted")
        })
        it("User cannot vote then voting is over", async function () {
            await network.provider.send("evm_increaseTime", [debatingPeriodDuration])

            await expect(contractDao.vote(proposalsNumber, true)).to.be.revertedWith("This proposal is not found or has already been completed")
        })
        it("User can vote", async function () {
            await contractDao.vote(proposalsNumber, true)
            expect((await contractDao.proposals([proposalsNumber])).votes).to.be.equal(amount)
            expect((await contractDao.proposals([proposalsNumber])).votedCounter).to.be.equal(1)
        })
        it("User can vote a negative", async function () {
            await contractDao.vote(proposalsNumber, false)
            expect((await contractDao.proposals([proposalsNumber])).votes).to.be.equal(-amount)
            expect((await contractDao.proposals([proposalsNumber])).votedCounter).to.be.equal(1)
        })

        it("Should be Event about vote", async function () {
            await expect(contractDao.vote(proposalsNumber, false)).to.be.to.emit(contractDao, "userVote").withArgs(acc1.address, false)
        })

    })

    describe("addProposal method", function () {

        it("Only chairMan can create a new proposal", async function () {
            await expect(contractDao.connect(acc2).addProposal(getCallData(), contractUsdc.address, proposalDescription)).to.be.revertedWith("Permission denied")
        })

        it("ChairMan can create a new proposal", async function () {
            await contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)
            expect((await contractDao.proposals([proposalsNumber])).description).to.be.equal(proposalDescription)
        })
        it("Should be Event about new proposal", async function () {
            await expect(contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)).to.be.to.emit(contractDao, "newProposal").withArgs(proposalsNumber, proposalDescription)
        })
    })

    describe("finishProposal method", function () {
        beforeEach(async function () {
            await contractDao.addProposal(getCallData(), contractUsdc.address, proposalDescription)
            await contractDao.deposit(amount)
            await contractDao.vote(proposalsNumber, false)
            await contractDao.connect(acc2).deposit(amount + 1)

        })
        it("User cannot complete voting if DebatingPeriodDuration has not passed", async function () {
            await contractDao.connect(acc2).vote(proposalsNumber, true)
            await expect(contractDao.finishProposal(proposalsNumber)).to.be.revertedWith('Time for a vote is not up')
        })
        it("Vote is False if DebatingPeriodDuration has not passed", async function () {
            await network.provider.send("evm_increaseTime", [debatingPeriodDuration])

            await contractDao.finishProposal(proposalsNumber)
            await expect((await contractDao.proposals([proposalsNumber])).status).to.be.false
        })
        it("Any user can finish votes", async function () {
            await contractDao.connect(acc2).vote(proposalsNumber, true)

            await network.provider.send("evm_increaseTime", [debatingPeriodDuration])
            await contractDao.connect(acc2).finishProposal(proposalsNumber)

            expect((await contractDao.proposals([proposalsNumber])).votes).to.be.equal(1)
            expect((await contractDao.proposals([proposalsNumber])).status).to.be.equal(true)
        })


    })

});
