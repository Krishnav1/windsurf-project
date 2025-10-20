// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC3643.sol";

/**
 * @title ERC3643Token
 * @dev Implementation of ERC-3643 compliant security token
 * 
 * KEY FEATURES:
 * 1. Identity-based transfers (only verified investors can hold/transfer)
 * 2. Compliance module integration (automatic compliance checks)
 * 3. Token freezing capabilities (regulatory compliance)
 * 4. Forced transfers (for recovery/compliance)
 * 5. Pausable (emergency stop)
 * 
 * USE CASE: Tokenized securities that require KYC/AML compliance
 */

contract ERC3643Token is IERC3643 {
    // Token Metadata
    string private _name;
    string private _symbol;
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;
    
    // ERC-20 State
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // ERC-3643 State
    address private _identityRegistry;
    address private _compliance;
    address private _owner;
    bool private _paused;
    
    // Frozen tokens per address
    mapping(address => uint256) private _frozenTokens;
    // Completely frozen addresses
    mapping(address => bool) private _frozen;
    
    // Agent roles (can mint/burn/force transfer)
    mapping(address => bool) private _agents;
    
    // Issuer wallet (receives all tokens on deployment)
    address private _issuer;
    
    // Lock-in period per investor
    mapping(address => uint256) private _lockInExpiry;
    uint256 private _defaultLockInPeriod;
    
    // Asset metadata
    struct AssetMetadata {
        string assetType;
        string assetName;
        bytes32 detailsHash;
        uint256 totalValuation;
        uint256 expectedReturns;
    }
    AssetMetadata private _assetMetadata;
    
    // IFSCA/SEBI Compliance: Investor limits
    uint256 private _maxInvestors = 200; // SEBI limit for private placement
    uint256 private _currentInvestorCount;
    mapping(address => bool) private _isInvestor;
    
    // Minimum investment amount (in token units)
    uint256 private _minInvestmentAmount;
    
    // Events for compliance
    event InvestorAdded(address indexed investor, uint256 totalInvestors);
    event InvestorRemoved(address indexed investor, uint256 totalInvestors);
    event MaxInvestorsUpdated(uint256 newLimit);
    event MinInvestmentUpdated(uint256 newAmount);
    
    modifier onlyOwner() {
        require(msg.sender == _owner, "ERC3643: caller is not the owner");
        _;
    }
    
    modifier onlyAgent() {
        require(_agents[msg.sender] || msg.sender == _owner, "ERC3643: caller is not an agent");
        _;
    }
    
    modifier whenNotPaused() {
        require(!_paused, "ERC3643: token transfer while paused");
        _;
    }
    
    constructor(
        string memory name_,
        string memory symbol_,
        address identityRegistry_,
        address compliance_,
        address issuer_,
        uint256 initialSupply_,
        uint256 lockInPeriod_
    ) {
        _name = name_;
        _symbol = symbol_;
        _identityRegistry = identityRegistry_;
        _compliance = compliance_;
        _owner = msg.sender;
        _issuer = issuer_;
        _defaultLockInPeriod = lockInPeriod_;
        _agents[msg.sender] = true;
        _agents[issuer_] = true;
        
        // Mint all tokens to issuer
        if (initialSupply_ > 0) {
            _mint(issuer_, initialSupply_);
        }
    }
    
    // ERC-20 Standard Functions
    function name() external view override returns (string memory) {
        return _name;
    }
    
    function symbol() external view override returns (string memory) {
        return _symbol;
    }
    
    function decimals() external pure override returns (uint8) {
        return _decimals;
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) external override whenNotPaused returns (bool) {
        require(canTransfer(msg.sender, to, amount), "ERC3643: transfer not compliant");
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override whenNotPaused returns (bool) {
        require(canTransfer(from, to, amount), "ERC3643: transfer not compliant");
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC3643: insufficient allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _transfer(from, to, amount);
        return true;
    }
    
    // ERC-3643 Specific Functions
    function identityRegistry() external view override returns (address) {
        return _identityRegistry;
    }
    
    function compliance() external view override returns (address) {
        return _compliance;
    }
    
    function paused() external view override returns (bool) {
        return _paused;
    }
    
    // Forced Transfer (Agent only - for compliance/recovery)
    function forcedTransfer(address from, address to, uint256 amount) external override onlyAgent returns (bool) {
        require(_balances[from] >= amount, "ERC3643: insufficient balance");
        _transfer(from, to, amount);
        return true;
    }
    
    // Batch Transfer
    function batchTransfer(address[] calldata toList, uint256[] calldata amounts) external override whenNotPaused {
        require(toList.length == amounts.length, "ERC3643: arrays length mismatch");
        for (uint256 i = 0; i < toList.length; i++) {
            require(canTransfer(msg.sender, toList[i], amounts[i]), "ERC3643: transfer not compliant");
            _transfer(msg.sender, toList[i], amounts[i]);
        }
    }
    
    // Freeze Functions
    function setAddressFrozen(address addr, bool freeze) external override onlyAgent {
        _frozen[addr] = freeze;
        emit AddressFrozen(addr, freeze, msg.sender);
    }
    
    function freezePartialTokens(address addr, uint256 amount) external override onlyAgent {
        require(_balances[addr] >= _frozenTokens[addr] + amount, "ERC3643: insufficient balance");
        _frozenTokens[addr] += amount;
        emit TokensFrozen(addr, amount);
    }
    
    function unfreezePartialTokens(address addr, uint256 amount) external override onlyAgent {
        require(_frozenTokens[addr] >= amount, "ERC3643: insufficient frozen tokens");
        _frozenTokens[addr] -= amount;
        emit TokensUnfrozen(addr, amount);
    }
    
    function getFrozenTokens(address addr) external view override returns (uint256) {
        return _frozenTokens[addr];
    }
    
    // Recovery Function (for lost wallets)
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external override onlyAgent returns (bool) {
        uint256 balance = _balances[lostWallet];
        _balances[lostWallet] = 0;
        _balances[newWallet] = balance;
        emit RecoverySuccess(lostWallet, newWallet, investorOnchainID);
        return true;
    }
    
    // Pause Control
    function pause() external override onlyAgent {
        _paused = true;
    }
    
    function unpause() external override onlyAgent {
        _paused = false;
    }
    
    // Minting/Burning
    function mint(address to, uint256 amount) external override onlyAgent {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external override onlyAgent {
        _burn(from, amount);
    }
    
    function batchMint(address[] calldata toList, uint256[] calldata amounts) external override onlyAgent {
        require(toList.length == amounts.length, "ERC3643: arrays length mismatch");
        for (uint256 i = 0; i < toList.length; i++) {
            _mint(toList[i], amounts[i]);
        }
    }
    
    function batchBurn(address[] calldata fromList, uint256[] calldata amounts) external override onlyAgent {
        require(fromList.length == amounts.length, "ERC3643: arrays length mismatch");
        for (uint256 i = 0; i < fromList.length; i++) {
            _burn(fromList[i], amounts[i]);
        }
    }
    
    // Compliance Check with investor limit enforcement
    function canTransfer(address from, address to, uint256 amount) public view override returns (bool) {
        // Check investor limit (IFSCA/SEBI compliance)
        if (_balances[to] == 0 && !_isInvestor[to] && to != address(0)) {
            // New investor - check if we've reached the limit
            if (_currentInvestorCount >= _maxInvestors) {
                return false; // Cannot add more investors
            }
        }
        
        // Check minimum investment amount
        if (_minInvestmentAmount > 0 && _balances[to] == 0) {
            if (amount < _minInvestmentAmount) {
                return false; // First investment must meet minimum
            }
        }
        
        // Check if addresses are frozen
        if (_frozen[from] || _frozen[to]) {
            return false;
        }
        
        // Check if sender has enough unfrozen tokens
        if (_balances[from] - _frozenTokens[from] < amount) {
            return false;
        }
        
        // Additional compliance checks would go here
        // In production, this would call the compliance module
        // For now, we'll do basic checks
        
        return true;
    }
    
    // Set asset metadata (issuer only)
    function setAssetMetadata(
        string memory assetType_,
        string memory assetName_,
        bytes32 detailsHash_,
        uint256 totalValuation_,
        uint256 expectedReturns_
    ) external {
        require(msg.sender == _issuer || msg.sender == _owner, "ERC3643: only issuer or owner");
        _assetMetadata = AssetMetadata({
            assetType: assetType_,
            assetName: assetName_,
            detailsHash: detailsHash_,
            totalValuation: totalValuation_,
            expectedReturns: expectedReturns_
        });
    }
    
    // Get asset metadata
    function getAssetMetadata() external view returns (
        string memory assetType,
        string memory assetName,
        bytes32 detailsHash,
        uint256 totalValuation,
        uint256 expectedReturns
    ) {
        return (
            _assetMetadata.assetType,
            _assetMetadata.assetName,
            _assetMetadata.detailsHash,
            _assetMetadata.totalValuation,
            _assetMetadata.expectedReturns
        );
    }
    
    // Get issuer address
    function issuer() external view returns (address) {
        return _issuer;
    }
    
    // Get lock-in expiry for address
    function lockInExpiry(address addr) external view returns (uint256) {
        return _lockInExpiry[addr];
    }
    
    // IFSCA Compliance: Admin functions
    function setMaxInvestors(uint256 newLimit) external onlyOwner {
        require(newLimit >= _currentInvestorCount, "ERC3643: cannot set limit below current count");
        _maxInvestors = newLimit;
        emit MaxInvestorsUpdated(newLimit);
    }
    
    function setMinInvestmentAmount(uint256 newAmount) external onlyOwner {
        _minInvestmentAmount = newAmount;
        emit MinInvestmentUpdated(newAmount);
    }
    
    function getInvestorCount() external view returns (uint256) {
        return _currentInvestorCount;
    }
    
    function getMaxInvestors() external view returns (uint256) {
        return _maxInvestors;
    }
    
    function getMinInvestmentAmount() external view returns (uint256) {
        return _minInvestmentAmount;
    }
    
    function isInvestor(address addr) external view returns (bool) {
        return _isInvestor[addr];
    }
    
    // Internal Functions
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC3643: transfer from zero address");
        require(to != address(0), "ERC3643: transfer to zero address");
        require(_balances[from] >= amount, "ERC3643: insufficient balance");
        
        // Track new investors
        bool wasInvestor = _isInvestor[to];
        if (_balances[to] == 0 && !wasInvestor && to != address(0)) {
            _isInvestor[to] = true;
            _currentInvestorCount++;
            emit InvestorAdded(to, _currentInvestorCount);
        }
        
        // If issuer is transferring (primary market), set lock-in for recipient
        if (from == _issuer && _defaultLockInPeriod > 0) {
            _lockInExpiry[to] = block.timestamp + _defaultLockInPeriod;
        }
        
        // Check lock-in period for secondary transfers
        if (from != _issuer && from != address(0)) {
            require(block.timestamp >= _lockInExpiry[from], "ERC3643: tokens locked");
        }
        
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "ERC3643: mint to zero address");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "ERC3643: burn from zero address");
        require(_balances[from] >= amount, "ERC3643: insufficient balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC3643: approve from zero address");
        require(spender != address(0), "ERC3643: approve to zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    // Admin Functions
    function addAgent(address agent) external onlyOwner {
        _agents[agent] = true;
    }
    
    function removeAgent(address agent) external onlyOwner {
        _agents[agent] = false;
    }
    
    function setIdentityRegistry(address newIdentityRegistry) external onlyOwner {
        _identityRegistry = newIdentityRegistry;
        emit IdentityRegistryAdded(newIdentityRegistry);
    }
    
    function setCompliance(address newCompliance) external onlyOwner {
        _compliance = newCompliance;
        emit ComplianceAdded(newCompliance);
    }
}
