const {ethers, getNamedAccounts} = require("hardhat")
async function main() {
    const {deployer} = await getNamedAccounts()
    const collectionNft = await ethers.getContract("CollectionNFT", deployer)

    console.log(`Found Collection NFT at ${collectionNft.address}`)

    console.log("Minting IH Token....")

    const amount = "10"
    const metadata = "https://ipfs.io/ipfs/QmPwp5kCCtCt5HVoeXx9WSCvsRyRTv8U2oDcyNX4eq2A6G?filename=Metadata2.json"

    const mintTx = await collectionNft.mint(deployer, amount.toString(), metadata)
    await mintTx.wait(1)

    console.log(`${amount} token minted....`)
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error)
      process.exit(1)
   })