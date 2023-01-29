//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Stake is ReentrancyGuard, Ownable {
    struct Staker {
        uint256[] stakedTokenIds;
        uint256 lastUpdateTime;
        uint256 rewards;
    }

    using SafeERC20 for IERC20;

    IERC20 private ihToken;

    IERC721 private collectionNft;

    uint256 constant HOUR_SECONDS = 3600;

    uint256 public perHourReward = 100000;

    mapping(address => Staker) private s_stakers;
    mapping(uint256 => address) private s_tokenIdToStaker;

    constructor(IERC721 _collectionNft, IERC20 _ihToken) {
        collectionNft = _collectionNft;
        ihToken = _ihToken;
    }

    function stake(uint256[] calldata _tokenIds) external {
        Staker storage staker = s_stakers[msg.sender];

        if (staker.stakedTokenIds.length > 0) {
            updateReward(msg.sender);
        } else {
            staker.lastUpdateTime = block.timestamp;
        }

        uint256 _tokenLength = _tokenIds.length;

        for (uint256 i; i < _tokenLength; ++i) {
            require(collectionNft.ownerOf(_tokenIds[i]) == msg.sender);

            collectionNft.transferFrom(msg.sender, address(this), _tokenIds[i]);

            staker.stakedTokenIds.push(_tokenIds[i]);
            s_tokenIdToStaker[_tokenIds[i]] = msg.sender;
        }
    }

    function unstake(uint256[] calldata _tokenIds) external nonReentrant {
        Staker storage staker = s_stakers[msg.sender];

        require(staker.stakedTokenIds.length > 0);
        updateReward(msg.sender);

        uint256 unstakeLen = _tokenIds.length;
        for (uint256 i; i < unstakeLen; ++i) {
            require(s_tokenIdToStaker[_tokenIds[i]] == msg.sender);

            uint256 stakedTokenLen = staker.stakedTokenIds.length;
            for (uint256 j; j < stakedTokenLen; ++j) {
                if (staker.stakedTokenIds[j] == _tokenIds[i]) {
                    staker.stakedTokenIds[staker.stakedTokenIds.length - 1] = staker.stakedTokenIds[
                        j
                    ];
                    staker.stakedTokenIds.pop();
                    break;
                }
            }

            delete s_tokenIdToStaker[_tokenIds[i]];
            collectionNft.transferFrom(address(this), msg.sender, _tokenIds[i]);
        }
    }

    function claimReward() external {
        Staker storage staker = s_stakers[msg.sender];

        uint256 reward = calculateReward() + staker.rewards;
        require(reward > 0);
        staker.lastUpdateTime = block.timestamp;
        staker.rewards = 0;

        ihToken.safeTransfer(msg.sender, reward);
    }

    function setReward(uint256 _value) external onlyOwner {
        perHourReward = _value;
    }

    function updateReward(address _staker) internal {
        Staker storage staker = s_stakers[msg.sender];

        staker.rewards += calculateReward();
        staker.lastUpdateTime = block.timestamp;
    }

    function calculateReward() internal view returns (uint256) {
        Staker memory staker = s_stakers[msg.sender];
        return (((((block.timestamp - staker.lastUpdateTime) * staker.stakedTokenIds.length)) *
            perHourReward) / HOUR_SECONDS);
    }

    function viewStaker(address _staker) external view returns (Staker memory) {
        return s_stakers[_staker];
    }
}
