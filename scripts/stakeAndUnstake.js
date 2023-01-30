const {ethers, getNamedAccounts} = require("hardhat")

async function main() {
    const {deployer} = await getNamedAccounts()
    const stake = await ethers.getContract("Stake", deployer)
    const collectionNft = await ethers.getContract("CollectionNFT", deployer)

    console.log(`Found Stake at ${stake.address}`)
    console.log(`Found Collection NFT at ${collectionNft.address}`)

    console.log("Let's mint first...")

    const amount = "10"
    const metadata = "https://ipfs.io/ipfs/QmPwp5kCCtCt5HVoeXx9WSCvsRyRTv8U2oDcyNX4eq2A6G?filename=Metadata2.json"

    const mintTx = await collectionNft.mint(deployer, amount.toString(), metadata)
    await mintTx.wait(1)

    console.log(`Minted ${amount} tokens....`)

    console.log("We have to set approval.....")
    console.log("Approving.....")

    const approve = await collectionNft.setApprovalForAll(stake.address, true)
    await approve.wait(1)

    console.log("Let's start staking now....")

    console.log("Staking....")

    const tokenIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]

    //try {
        const stakeTx = await stake.stake(tokenIds, {gasLimit: 30000000})
    //} catch (e) {
       //console.log(e.message)
       //throw e
    //}
    
    await stakeTx.wait(1)

    console.log(`${tokenIds} token staked....`)

    console.log("Now let's unstake some of them...")

    const unstakeIds = ["2", "3", "4", "5"]

    const unstakeTx = await stake.unstake(unstakeIds)
    await unstakeTx.wait(1)

    console.log(`Unstaked ${unstakeIds} tokens....`)
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error)
      process.exit(1)
   })