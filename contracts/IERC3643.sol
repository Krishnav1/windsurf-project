// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC3643 Interface
 * @dev Interface for ERC-3643 compliant security tokens (T-REX Protocol)
 * 
 * ERC-3643 is the industry standard for permissioned tokens representing securities.
 * It provides built-in compliance, identity management, and transfer restrictions.
 */

interface IERC3643 {
    // ERC-20 Standard Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // ERC-3643 Specific Events
    event IdentityRegistryAdded(address indexed identityRegistry);
    event ComplianceAdded(address indexed compliance);
    event RecoverySuccess(address indexed lostWallet, address indexed newWallet, address indexed investor);
    event AddressFrozen(address indexed addr, bool indexed isFrozen, address indexed owner);
    event TokensFrozen(address indexed addr, uint256 amount);
    event TokensUnfrozen(address indexed addr, uint256 amount);
    
    // ERC-20 Standard Functions
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // ERC-3643 Compliance Functions
    function identityRegistry() external view returns (address);
    function compliance() external view returns (address);
    function paused() external view returns (bool);
    
    // Transfer Control
    function forcedTransfer(address from, address to, uint256 amount) external returns (bool);
    function batchTransfer(address[] calldata toList, uint256[] calldata amounts) external;
    
    // Freeze/Recovery Functions
    function setAddressFrozen(address addr, bool freeze) external;
    function freezePartialTokens(address addr, uint256 amount) external;
    function unfreezePartialTokens(address addr, uint256 amount) external;
    function getFrozenTokens(address addr) external view returns (uint256);
    
    // Recovery
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);
    
    // Pause Control
    function pause() external;
    function unpause() external;
    
    // Minting/Burning (Agent only)
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function batchMint(address[] calldata toList, uint256[] calldata amounts) external;
    function batchBurn(address[] calldata fromList, uint256[] calldata amounts) external;
    
    // Compliance Check
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
}
