// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IIdentityRegistry {
    function isVerified(address wallet) external view returns (bool);
}

/**
 * @title ComplianceManager
 * @dev Minimal compliance module validating participants via IdentityRegistry.
 *      Additional rules can be added for jurisdiction or investment limits.
 */
contract ComplianceManager is Ownable {
    IIdentityRegistry public identityRegistry;

    event IdentityRegistryUpdated(address indexed registry);

    constructor(address registry) Ownable(msg.sender) {
        require(registry != address(0), "Registry required");
        identityRegistry = IIdentityRegistry(registry);
    }

    function updateIdentityRegistry(address registry) external onlyOwner {
        require(registry != address(0), "Registry required");
        identityRegistry = IIdentityRegistry(registry);
        emit IdentityRegistryUpdated(registry);
    }

    function canTransfer(address from, address to) external view returns (bool) {
        if (from == address(0) || to == address(0)) {
            return true;
        }
        return identityRegistry.isVerified(from) && identityRegistry.isVerified(to);
    }
}
