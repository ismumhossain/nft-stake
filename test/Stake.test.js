const { assert, expect } = require("chai")
const { providers } = require("ethers")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Stake", () => {
          let deployer
          let badGuy
          const tokenIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
          const unstakeTokenIds = ["2", "4"]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              badGuy = accounts[1]
              await deployments.fixture(["all"])
              ihToken = await ethers.getContract("IHToken")
              collectionNft = await ethers.getContract("CollectionNFT")
              stake = await ethers.getContract("Stake")
              const approve = await collectionNft.setApprovalForAll(stake.address, true)
              await approve.wait(1)
              const amount = "10"
              const tokenURI =
                  "https://ipfs.io/ipfs/QmPwp5kCCtCt5HVoeXx9WSCvsRyRTv8U2oDcyNX4eq2A6G?filename=Metadata2.json"
              const mintNft = await collectionNft.mint(deployer.address, amount, tokenURI)
              await mintNft.wait(1)
              const tokenAmount = "1000000000000000000000000"
              const mintToken = await ihToken.mint(stake.address, tokenAmount)
              await mintToken.wait(1)
          })

          describe("stake", function () {
              it("emits an event", async () => {
                  await expect(stake.stake(tokenIds)).to.emit(stake, "Staked")
              })

              it("reverts if the staker is not token owner", async () => {
                  const connect = await stake.connect(badGuy)
                  await expect(connect.stake(tokenIds)).to.be.reverted
              })

              it("transfers nfts correctly", async () => {
                  await stake.stake(tokenIds)
                  const owner = await collectionNft.ownerOf("1")
                  assert.equal(stake.address, owner)
              })

              it("updates staked token array", async () => {
                  await stake.stake(tokenIds)
                  const response = await stake.viewStaker(deployer.address)
                  const tokenId = response.stakedTokenIds[8]
                  assert.equal(tokenId, "9")
              })

              it("updates tokenIdToStaker mapping", async () => {
                  await stake.stake(tokenIds)
                  const stakerAddress = await stake.viewTokenIdToStaker("1")
                  assert.equal(deployer.address, stakerAddress)
              })

              it("updates reward", async () => {
                  await stake.stake(tokenIds)
                  const firstResponse = await stake.viewStaker(deployer.address)
                  const atFirstReward = firstResponse.rewards
                  console.log(atFirstReward.toString())
                  const id = ["10"]
                  await stake.stake(id)
                  const secondResponse = await stake.viewStaker(deployer.address)
                  const secondTimeReward = secondResponse.rewards
                  console.log(secondTimeReward.toString())
                  expect(secondTimeReward).to.be.above(atFirstReward)
              })
          })

          describe("unstake", function () {
              beforeEach(async () => {
                  await stake.stake(tokenIds)
              })
              it("emits event", async () => {
                  await expect(stake.unstake(unstakeTokenIds)).to.emit(stake, "Unstaked")
              })

              it("reverts if the token is not staked by the caller", async () => {
                  const connect = await stake.connect(badGuy)
                  await expect(connect.unstake(unstakeTokenIds)).to.be.reverted
              })

              it("removes tokenId form array after unstake", async () => {
                  await stake.unstake(unstakeTokenIds)
                  const response = await stake.viewStaker(deployer.address)
                  const stakedAmount = response.stakedTokenIds.length
                  assert.equal(stakedAmount.toString(), "7")
              })

              it("deletes mapping after unstaking", async () => {
                  await stake.unstake(unstakeTokenIds)
                  const tokenIdToStaker = await stake.viewTokenIdToStaker("2")
                  const address = "0x0000000000000000000000000000000000000000"
                  assert.equal(tokenIdToStaker, address)
              })

              it("transfers nfts correctly", async () => {
                  await stake.unstake(unstakeTokenIds)
                  const owner = await collectionNft.ownerOf("2")
                  assert.equal(deployer.address, owner)
              })

              it("updates reward", async () => {
                  const firstResponse = await stake.viewStaker(deployer.address)
                  const atFirstReward = firstResponse.rewards
                  console.log(atFirstReward.toString())
                  await stake.unstake(unstakeTokenIds)
                  const response = await stake.viewStaker(deployer.address)
                  const reward = response.rewards
                  console.log(reward.toString())
                  expect(reward).to.be.above(atFirstReward)
              })
          })

          describe("claimReward", async () => {
              beforeEach(async () => {
                  await stake.stake(tokenIds)
              })
              it("reverts if reward is 0", async () => {
                  expect(await stake.claimReward()).to.be.reverted
              })

              it("emits event", async () => {
                  await stake.stake(["10"])
                  await expect(stake.claimReward()).to.emit(stake, "RewardClaimed")
              })

              it("resets the reward to 0 after claiming", async () => {
                  await stake.stake(["10"])
                  await stake.claimReward()
                  const response = await stake.viewStaker(deployer.address)
                  const reward = response.rewards
                  assert.equal(reward, "0")
              })

              it("transfers reward tokens correctly", async () => {
                  const firstBalance = await ihToken.balanceOf(deployer.address)
                  console.log(firstBalance.toString())
                  await stake.stake(["10"])
                  await stake.claimReward()
                  const secondBalance = await ihToken.balanceOf(deployer.address)
                  console.log(secondBalance.toString())
                  expect(firstBalance).to.be.below(secondBalance)
              })
          })

          describe("setReward", async () => {
              it("reverts if someone else calls the function", async () => {
                  const connect = await stake.connect(badGuy)
                  await expect(connect.setReward("1")).to.be.reverted
              })

              it("updates rewardPerHour", async () => {
                  const hourReward = await stake.perHourReward()
                  console.log(hourReward.toString())
                  const set = "400000"
                  await stake.setReward(set)
                  const newReward = await stake.perHourReward()
                  console.log(newReward.toString())
                  assert.equal(set, newReward)
              })
          })
      })
