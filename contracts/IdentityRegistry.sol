// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityRegistry
 * @dev Minimal identity registry aligned with ERC-3643 concepts.
 *      Stores verified identities and allows updates/revocation by compliance operators.
 */
contract IdentityRegistry is Ownable {
    struct IdentityRecord {
        bool verified;
        uint256 kycExpiry;
        bytes32 identityHash;
    }

    constructor() Ownable(msg.sender) {}

    mapping(address => IdentityRecord) private identities;
    mapping(address => bool) public operators;

    event IdentityRegistered(address indexed wallet, bytes32 identityHash, uint256 kycExpiry);
    event IdentityRevoked(address indexed wallet);
    event IdentityUpdated(address indexed wallet, bytes32 identityHash, uint256 kycExpiry);
    event OperatorUpdated(address indexed operator, bool active);

    modifier onlyOperator() {
        require(owner() == _msgSender() || operators[_msgSender()], "Not authorized");
        _;
    }

    function setOperator(address operator, bool active) external onlyOwner {
        operators[operator] = active;
        emit OperatorUpdated(operator, active);
    }

    function registerIdentity(
        address wallet,
        bytes32 identityHash,
        uint256 kycExpiry
    ) external onlyOperator {
        identities[wallet] = IdentityRecord({
            verified: true,
            kycExpiry: kycExpiry,
            identityHash: identityHash
        });
        emit IdentityRegistered(wallet, identityHash, kycExpiry);
    }

    function revokeIdentity(address wallet) external onlyOperator {
        delete identities[wallet];
        emit IdentityRevoked(wallet);
    }

    function updateIdentity(
        address wallet,
        bytes32 identityHash,
        uint256 kycExpiry
    ) external onlyOperator {
        IdentityRecord storage record = identities[wallet];
        require(record.verified, "Identity not registered");
        record.identityHash = identityHash;
        record.kycExpiry = kycExpiry;
        emit IdentityUpdated(wallet, identityHash, kycExpiry);
    }

    function isVerified(address wallet) public view returns (bool) {
        IdentityRecord memory record = identities[wallet];
        return record.verified && block.timestamp <= record.kycExpiry;
    }

    function getIdentity(address wallet) external view returns (IdentityRecord memory) {
        return identities[wallet];
    }
}
