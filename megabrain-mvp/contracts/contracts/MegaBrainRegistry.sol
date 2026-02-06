// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MegaBrainRegistry
 * @dev Agent registration, staking, and reputation tracking
 */
contract MegaBrainRegistry is Ownable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum AgentRole { None, Worker, Evaluator, Both }
    enum AgentStatus { Inactive, Active, Suspended, Banned }

    // ============ Structs ============
    
    struct Agent {
        AgentRole role;
        AgentStatus status;
        uint256 stakeAmount;
        uint256 workerReputation;
        uint256 evaluatorReputation;
        uint64 registrationTime;
        uint64 lastActive;
        bytes32 capabilitiesHash; // Hash of agent capabilities/skills
        string metadataURI;       // IPFS URI for agent details
    }

    struct StakeInfo {
        uint256 amount;
        uint64 stakedAt;
        bool locked;
    }

    // ============ State ============
    
    IERC20 public stakingToken;
    
    // Minimum stakes required
    uint256 public minWorkerStake;
    uint256 public minEvaluatorStake;
    uint256 public minArbitratorStake;
    
    // Agent registry
    mapping(address => Agent) public agents;
    mapping(address => StakeInfo) public stakes;
    
    // Lists for selection
    address[] public workerPool;
    address[] public evaluatorPool;
    mapping(address => uint256) public workerPoolIndex;
    mapping(address => uint256) public evaluatorPoolIndex;
    
    // Vouching system
    mapping(address => mapping(address => uint256)) public vouches; // voucher => vouchee => amount
    mapping(address => uint256) public totalVouchReceived;
    
    // Reputation parameters
    uint256 public constant INITIAL_REPUTATION = 100;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant REPUTATION_DECIMALS = 100; // For fractions

    // ============ Events ============
    
    event AgentRegistered(
        address indexed agent,
        AgentRole role,
        uint256 stakeAmount,
        uint64 timestamp
    );
    
    event AgentUpdated(
        address indexed agent,
        AgentRole newRole,
        string metadataURI
    );
    
    event StakeDeposited(
        address indexed agent,
        uint256 amount,
        uint256 totalStake
    );
    
    event StakeWithdrawn(
        address indexed agent,
        uint256 amount,
        uint256 remainingStake
    );
    
    event StakeSlashed(
        address indexed agent,
        uint256 amount,
        bytes32 indexed taskId,
        string reason
    );
    
    event ReputationUpdated(
        address indexed agent,
        bool isWorker,
        uint256 newScore,
        int256 change
    );
    
    event VouchCreated(
        address indexed voucher,
        address indexed vouchee,
        uint256 amount
    );
    
    event AgentStatusChanged(
        address indexed agent,
        AgentStatus oldStatus,
        AgentStatus newStatus
    );

    // ============ Modifiers ============
    
    modifier onlyActiveAgent() {
        require(agents[msg.sender].status == AgentStatus.Active, "Not active agent");
        _;
    }
    
    modifier onlyRegistered() {
        require(agents[msg.sender].role != AgentRole.None, "Not registered");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _stakingToken,
        uint256 _minWorkerStake,
        uint256 _minEvaluatorStake,
        uint256 _minArbitratorStake,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        minWorkerStake = _minWorkerStake;
        minEvaluatorStake = _minEvaluatorStake;
        minArbitratorStake = _minArbitratorStake;
    }

    // ============ Registration ============
    
    /**
     * @dev Register as a new agent with initial stake
     */
    function register(
        AgentRole _role,
        bytes32 _capabilitiesHash,
        string calldata _metadataURI,
        uint256 _stakeAmount
    ) external nonReentrant returns (bool) {
        require(agents[msg.sender].role == AgentRole.None, "Already registered");
        require(_role != AgentRole.None, "Invalid role");
        
        uint256 minStake = getMinStakeForRole(_role);
        require(_stakeAmount >= minStake, "Insufficient stake");
        
        // Transfer stake
        require(
            stakingToken.transferFrom(msg.sender, address(this), _stakeAmount),
            "Stake transfer failed"
        );
        
        // Create agent
        agents[msg.sender] = Agent({
            role: _role,
            status: AgentStatus.Active,
            stakeAmount: _stakeAmount,
            workerReputation: INITIAL_REPUTATION,
            evaluatorReputation: INITIAL_REPUTATION,
            registrationTime: uint64(block.timestamp),
            lastActive: uint64(block.timestamp),
            capabilitiesHash: _capabilitiesHash,
            metadataURI: _metadataURI
        });
        
        stakes[msg.sender] = StakeInfo({
            amount: _stakeAmount,
            stakedAt: uint64(block.timestamp),
            locked: false
        });
        
        // Add to pools
        _addToPools(msg.sender, _role);
        
        emit AgentRegistered(
            msg.sender,
            _role,
            _stakeAmount,
            uint64(block.timestamp)
        );
        
        return true;
    }
    
    /**
     * @dev Update agent metadata and role
     */
    function updateAgent(
        AgentRole _newRole,
        bytes32 _capabilitiesHash,
        string calldata _metadataURI
    ) external onlyRegistered {
        Agent storage agent = agents[msg.sender];
        
        // Check minimum stake for new role
        if (_newRole != agent.role) {
            uint256 minStake = getMinStakeForRole(_newRole);
            require(agent.stakeAmount >= minStake, "Insufficient stake for new role");
            
            _removeFromPools(msg.sender, agent.role);
            agent.role = _newRole;
            _addToPools(msg.sender, _newRole);
        }
        
        agent.capabilitiesHash = _capabilitiesHash;
        agent.metadataURI = _metadataURI;
        agent.lastActive = uint64(block.timestamp);
        
        emit AgentUpdated(msg.sender, _newRole, _metadataURI);
    }

    // ============ Staking ============
    
    /**
     * @dev Add more stake
     */
    function depositStake(uint256 _amount) external onlyRegistered nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(!stakes[msg.sender].locked, "Stake locked");
        
        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        agents[msg.sender].stakeAmount += _amount;
        stakes[msg.sender].amount += _amount;
        
        emit StakeDeposited(msg.sender, _amount, agents[msg.sender].stakeAmount);
    }
    
    /**
     * @dev Withdraw excess stake (above minimum)
     */
    function withdrawStake(uint256 _amount) external onlyRegistered nonReentrant {
        Agent storage agent = agents[msg.sender];
        StakeInfo storage stakeInfo = stakes[msg.sender];
        
        require(!stakeInfo.locked, "Stake locked");
        
        uint256 minStake = getMinStakeForRole(agent.role);
        require(agent.stakeAmount - _amount >= minStake, "Cannot go below minimum");
        
        agent.stakeAmount -= _amount;
        stakeInfo.amount -= _amount;
        
        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");
        
        emit StakeWithdrawn(msg.sender, _amount, agent.stakeAmount);
    }
    
    /**
     * @dev Lock stake for task participation (called by TaskManager)
     */
    function lockStake(address _agent, bytes32 _taskId) external onlyOwner {
        stakes[_agent].locked = true;
    }
    
    /**
     * @dev Unlock stake after task completion (called by TaskManager)
     */
    function unlockStake(address _agent, bytes32 _taskId) external onlyOwner {
        stakes[_agent].locked = false;
    }
    
    /**
     * @dev Slash an agent's stake (called by TaskManager)
     */
    function slashStake(
        address _agent,
        uint256 _amount,
        bytes32 _taskId,
        string calldata _reason
    ) external onlyOwner {
        Agent storage agent = agents[_agent];
        
        uint256 slashAmount = _amount > agent.stakeAmount ? agent.stakeAmount : _amount;
        agent.stakeAmount -= slashAmount;
        stakes[_agent].amount -= slashAmount;
        
        // Burn or transfer to treasury (here we just hold it)
        
        emit StakeSlashed(_agent, slashAmount, _taskId, _reason);
    }

    // ============ Reputation ============
    
    /**
     * @dev Update worker reputation (called by TaskManager)
     */
    function updateWorkerReputation(
        address _agent,
        int256 _change
    ) external onlyOwner {
        Agent storage agent = agents[_agent];
        
        if (_change > 0) {
            agent.workerReputation += uint256(_change);
            if (agent.workerReputation > MAX_REPUTATION) {
                agent.workerReputation = MAX_REPUTATION;
            }
        } else {
            uint256 decrease = uint256(-_change);
            if (decrease >= agent.workerReputation) {
                agent.workerReputation = 0;
            } else {
                agent.workerReputation -= decrease;
            }
        }
        
        emit ReputationUpdated(_agent, true, agent.workerReputation, _change);
    }
    
    /**
     * @dev Update evaluator reputation (called by TaskManager)
     */
    function updateEvaluatorReputation(
        address _agent,
        int256 _change
    ) external onlyOwner {
        Agent storage agent = agents[_agent];
        
        if (_change > 0) {
            agent.evaluatorReputation += uint256(_change);
            if (agent.evaluatorReputation > MAX_REPUTATION) {
                agent.evaluatorReputation = MAX_REPUTATION;
            }
        } else {
            uint256 decrease = uint256(-_change);
            if (decrease >= agent.evaluatorReputation) {
                agent.evaluatorReputation = 0;
            } else {
                agent.evaluatorReputation -= decrease;
            }
        }
        
        emit ReputationUpdated(_agent, false, agent.evaluatorReputation, _change);
    }

    // ============ Vouching ============
    
    /**
     * @dev Vouch for another agent with stake
     */
    function vouchFor(address _vouchee, uint256 _amount) external onlyActiveAgent {
        require(agents[_vouchee].status == AgentStatus.Active, "Vouchee not active");
        require(_vouchee != msg.sender, "Cannot vouch for self");
        require(_amount > 0, "Amount must be > 0");
        
        vouches[msg.sender][_vouchee] += _amount;
        totalVouchReceived[_vouchee] += _amount;
        
        // Lock vouch amount
        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Vouch transfer failed"
        );
        
        emit VouchCreated(msg.sender, _vouchee, _amount);
    }

    // ============ Admin ============
    
    /**
     * @dev Suspend or ban an agent
     */
    function setAgentStatus(address _agent, AgentStatus _status) external onlyOwner {
        AgentStatus oldStatus = agents[_agent].status;
        agents[_agent].status = _status;
        
        if (_status != AgentStatus.Active) {
            _removeFromPools(_agent, agents[_agent].role);
        } else if (oldStatus != AgentStatus.Active) {
            _addToPools(_agent, agents[_agent].role);
        }
        
        emit AgentStatusChanged(_agent, oldStatus, _status);
    }
    
    /**
     * @dev Update minimum stake requirements
     */
    function updateMinStakes(
        uint256 _worker,
        uint256 _evaluator,
        uint256 _arbitrator
    ) external onlyOwner {
        minWorkerStake = _worker;
        minEvaluatorStake = _evaluator;
        minArbitratorStake = _arbitrator;
    }

    // ============ View Functions ============
    
    function getAgent(address _agent) external view returns (Agent memory) {
        return agents[_agent];
    }
    
    function getMinStakeForRole(AgentRole _role) public view returns (uint256) {
        if (_role == AgentRole.Worker) return minWorkerStake;
        if (_role == AgentRole.Evaluator) return minEvaluatorStake;
        if (_role == AgentRole.Both) {
            return minWorkerStake > minEvaluatorStake ? minWorkerStake : minEvaluatorStake;
        }
        return 0;
    }
    
    function isEligibleWorker(address _agent) external view returns (bool) {
        Agent memory agent = agents[_agent];
        return agent.status == AgentStatus.Active && 
               (agent.role == AgentRole.Worker || agent.role == AgentRole.Both) &&
               agent.stakeAmount >= minWorkerStake;
    }
    
    function isEligibleEvaluator(address _agent) external view returns (bool) {
        Agent memory agent = agents[_agent];
        return agent.status == AgentStatus.Active && 
               (agent.role == AgentRole.Evaluator || agent.role == AgentRole.Both) &&
               agent.stakeAmount >= minEvaluatorStake;
    }
    
    function getWorkerPool() external view returns (address[] memory) {
        return workerPool;
    }
    
    function getEvaluatorPool() external view returns (address[] memory) {
        return evaluatorPool;
    }

    // ============ Internal ============
    
    function _addToPools(address _agent, AgentRole _role) internal {
        if (_role == AgentRole.Worker || _role == AgentRole.Both) {
            if (workerPoolIndex[_agent] == 0) {
                workerPool.push(_agent);
                workerPoolIndex[_agent] = workerPool.length;
            }
        }
        if (_role == AgentRole.Evaluator || _role == AgentRole.Both) {
            if (evaluatorPoolIndex[_agent] == 0) {
                evaluatorPool.push(_agent);
                evaluatorPoolIndex[_agent] = evaluatorPool.length;
            }
        }
    }
    
    function _removeFromPools(address _agent, AgentRole _role) internal {
        if (_role == AgentRole.Worker || _role == AgentRole.Both) {
            uint256 index = workerPoolIndex[_agent];
            if (index > 0) {
                uint256 arrayIndex = index - 1;
                address lastAgent = workerPool[workerPool.length - 1];
                workerPool[arrayIndex] = lastAgent;
                workerPoolIndex[lastAgent] = index;
                workerPool.pop();
                delete workerPoolIndex[_agent];
            }
        }
        if (_role == AgentRole.Evaluator || _role == AgentRole.Both) {
            uint256 index = evaluatorPoolIndex[_agent];
            if (index > 0) {
                uint256 arrayIndex = index - 1;
                address lastAgent = evaluatorPool[evaluatorPool.length - 1];
                evaluatorPool[arrayIndex] = lastAgent;
                evaluatorPoolIndex[lastAgent] = index;
                evaluatorPool.pop();
                delete evaluatorPoolIndex[_agent];
            }
        }
    }
}