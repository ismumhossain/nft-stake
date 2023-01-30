const {ethers, getNamedAccounts} = require("hardhat")
async function main() {
    const {deployer} = await getNamedAccounts()
    const ihToken = await ethers.getContract("IHToken", deployer)

    console.log(`Found IH Token at ${ihToken.address}`)

    console.log("Minting IH Token....")

    const amount = "1000000000000000000000000"

    const mintTx = await ihToken.mint(deployer, amount.toString())
    await mintTx.wait(1)

    console.log(`${amount} token minted....`)
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error)
      process.exit(1)
   })