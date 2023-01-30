const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("Deploying Stake...")

    const arguments = [
        // "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", (For hardhat)
        // "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "0x5386179f3D2643303811c5D0547185C98B15ceB6",
        "0xd177E998B1d6D1d73A1eC6F7FF3035183FC9A0D5"
    ]

    const stake = await deploy("Stake", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log(`Stake deployed at ${stake.address}....`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying....")
        await verify(stake.address, arguments)
    }
}

module.exports.tags = ["all", "stake"]
