const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("Deploying Collection NFT...")

    const arguments = ["Collection NFT", "CN"]

    const collectionNft = await deploy("CollectionNFT", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log(`Collection NFT deployed at ${collectionNft.address}....`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying....")
        await verify(collectionNft.address, arguments)
    }
}

module.exports.tags = ["all", "collectionNft"]
