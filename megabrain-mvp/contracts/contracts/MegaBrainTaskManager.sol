// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MegaBrainRegistry.sol";

/**
 * @title MegaBrainTaskManager
 * @dev Main contract for task lifecycle: creation, assignment, submission, evaluation, settlement
 */
contract MegaBrainTaskManager is Ownable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum TaskStatus { 
        Created,      // Task created, waiting for workers
        Open,         // Workers can join
        Evaluating,   // Results submitted, evaluators scoring
        Settled,      // Payments distributed
        Disputed,     // Under dispute
        Cancelled     // Cancelled by requester
    }

    // ============ Structs ============
    
    struct Task {
        bytes32 taskId;
        address requester;
        string description;
        bytes32 taskClass;
        uint256 totalBudget;
        uint256 workerPoolAmount;   // 70%
        uint256 evaluatorPoolAmount; // 20%
        uint256 bonusPoolAmount;     // 10%
        uint256 workerStake;
        uint256 evaluatorStake;
        uint64 submissionDeadline;
        uint64 evaluationDeadline;
        uint64 createdAt;
        TaskStatus status;
        uint8 workerCount;      // Default: 3
        uint8 evaluatorCount;   // Default: 2
        address[] workers;
        address[] evaluators;
        bytes32 metadataURI;    // IPFS hash for full task spec
    }
    
    struct Result {
        bytes32 resultHash;
        string summary;
        bytes32 proof;          // Optional ZK proof or attestation
        uint64 submittedAt;
        bool submitted;
        uint8 finalScore;       // 0-100
        uint256 payment;
        bool inConsensus;
    }
    
    struct Evaluation {
        uint8 score;            // 0-100
        uint8 confidence;       // 0-100
        bytes32 evaluationHash;
        string rationale;
        uint64 submittedAt;
        bool submitted;
        uint256 payment;
        bool alignedWithConsensus;
    }

    // ============ State ============
    
    MegaBrainRegistry public registry;
    IERC20 public paymentToken;
    
    // Task storage
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => mapping(address => Result)) public results; // taskId => worker => result
    mapping(bytes32 => mapping(address => mapping(address => Evaluation))) public evaluations; // taskId => evaluator => worker => eval
    
    // Task tracking
    bytes32[] public allTaskIds;
    mapping(address => bytes32[]) public requesterTasks;
    mapping(address => bytes32[]) public workerTasks;
    mapping(address => bytes32[]) public evaluatorTasks;
    
    // Consensus tracking (simplified: oracle-provided)
    mapping(bytes32 => bytes32) public winningClusterHash;
    mapping(bytes32 => mapping(address => bool)) public inConsensusCluster;
    
    // Default parameters
    uint8 public defaultWorkerCount = 3;
    uint8 public defaultEvaluatorCount = 2;
    uint64 public defaultSubmissionWindow = 24 hours;
    uint64 public defaultEvaluationWindow = 12 hours;
    
    // Payment splits (in basis points, 10000 = 100%)
    uint256 public constant WORKER_POOL_BP = 7000;    // 70%
    uint256 public constant EVALUATOR_POOL_BP = 2000; // 20%
    uint256 public constant BONUS_POOL_BP = 1000;     // 10%
    uint256 public constant BASIS_POINTS = 10000;

    // ============ Events ============
    
    event TaskCreated(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 totalBudget,
        uint8 workerCount,
        uint8 evaluatorCount,
        uint64 submissionDeadline
    );
    
    event WorkerJoined(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 stakeLocked
    );
    
    event EvaluatorJoined(
        bytes32 indexed taskId,
        address indexed evaluator,
        uint256 stakeLocked
    );
    
    event ResultSubmitted(
        bytes32 indexed taskId,
        address indexed worker,
        bytes32 resultHash,
        uint64 timestamp
    );
    
    event EvaluationSubmitted(
        bytes32 indexed taskId,
        address indexed evaluator,
        address indexed worker,
        uint8 score,
        uint8 confidence
    );
    
    event TaskSettled(
        bytes32 indexed taskId,
        bytes32 winningClusterHash,
        uint256 totalPaid,
        uint256 totalSlashed
    );
    
    event WorkerPaid(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 amount,
        bool bonus
    );
    
    event EvaluatorPaid(
        bytes32 indexed taskId,
        address indexed evaluator,
        uint256 amount
    );
    
    event StakeSlashed(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 amount,
        string reason
    );
    
    event DisputeOpened(
        bytes32 indexed taskId,
        address indexed disputant,
        uint64 arbitrationDeadline
    );

    // ============ Modifiers ============
    
    modifier onlyTaskRequester(bytes32 _taskId) {
        require(tasks[_taskId].requester == msg.sender, "Not requester");
        _;
    }
    
    modifier onlyTaskWorker(bytes32 _taskId) {
        bool isWorker = false;
        for (uint i = 0; i < tasks[_taskId].workers.length; i++) {
            if (tasks[_taskId].workers[i] == msg.sender) {
                isWorker = true;
                break;
            }
        }
        require(isWorker, "Not assigned worker");
        _;
    }
    
    modifier onlyTaskEvaluator(bytes32 _taskId) {
        bool isEvaluator = false;
        for (uint i = 0; i < tasks[_taskId].evaluators.length; i++) {
            if (tasks[_taskId].evaluators[i] == msg.sender) {
                isEvaluator = true;
                break;
            }
        }
        require(isEvaluator, "Not assigned evaluator");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _registry,
        address _paymentToken,
        address initialOwner
    ) Ownable(initialOwner) {
        registry = MegaBrainRegistry(_registry);
        paymentToken = IERC20(_paymentToken);
    }

    // ============ Task Creation ============
    
    /**
     * @dev Create a new task with budget and requirements
     */
    function createTask(
        bytes32 _taskId,
        string calldata _description,
        bytes32 _taskClass,
        uint256 _totalBudget,
        uint256 _workerStake,
        uint256 _evaluatorStake,
        uint64 _submissionDeadline,
        bytes32 _metadataURI,
        uint8 _workerCount,
        uint8 _evaluatorCount
    ) external nonReentrant returns (bool) {
        require(tasks[_taskId].requester == address(0), "Task already exists");
        require(_totalBudget > 0, "Budget must be > 0");
        require(bytes(_description).length > 0, "Description required");
        require(_submissionDeadline > block.timestamp, "Deadline in past");
        
        uint8 workerCount = _workerCount > 0 ? _workerCount : defaultWorkerCount;
        uint8 evaluatorCount = _evaluatorCount > 0 ? _evaluatorCount : defaultEvaluatorCount;
        
        // Transfer budget from requester
        require(
            paymentToken.transferFrom(msg.sender, address(this), _totalBudget),
            "Budget transfer failed"
        );
        
        // Calculate pool amounts
        uint256 workerPool = (_totalBudget * WORKER_POOL_BP) / BASIS_POINTS;
        uint256 evaluatorPool = (_totalBudget * EVALUATOR_POOL_BP) / BASIS_POINTS;
        uint256 bonusPool = (_totalBudget * BONUS_POOL_BP) / BASIS_POINTS;
        
        Task storage task = tasks[_taskId];
        task.taskId = _taskId;
        task.requester = msg.sender;
        task.description = _description;
        task.taskClass = _taskClass;
        task.totalBudget = _totalBudget;
        task.workerPoolAmount = workerPool;
        task.evaluatorPoolAmount = evaluatorPool;
        task.bonusPoolAmount = bonusPool;
        task.workerStake = _workerStake;
        task.evaluatorStake = _evaluatorStake;
        task.submissionDeadline = _submissionDeadline;
        task.evaluationDeadline = _submissionDeadline + defaultEvaluationWindow;
        task.createdAt = uint64(block.timestamp);
        task.status = TaskStatus.Open;
        task.workerCount = workerCount;
        task.evaluatorCount = evaluatorCount;
        task.metadataURI = _metadataURI;
        
        allTaskIds.push(_taskId);
        requesterTasks[msg.sender].push(_taskId);
        
        emit TaskCreated(
            _taskId,
            msg.sender,
            _totalBudget,
            workerCount,
            evaluatorCount,
            _submissionDeadline
        );
        
        return true;
    }
    
    /**
     * @dev Simplified: Requester manually selects workers (for MVP)
     * In production, this would use random selection from staked pool
     */
    function selectWorkers(bytes32 _taskId, address[] calldata _workers) external onlyTaskRequester(_taskId) {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(_workers.length == task.workerCount, "Wrong worker count");
        require(task.workers.length == 0, "Workers already selected");
        
        for (uint i = 0; i < _workers.length; i++) {
            address worker = _workers[i];
            require(registry.isEligibleWorker(worker), "Not eligible worker");
            
            // Lock stake if required
            if (task.workerStake > 0) {
                require(
                    paymentToken.transferFrom(worker, address(this), task.workerStake),
                    "Worker stake transfer failed"
                );
            }
            
            task.workers.push(worker);
            workerTasks[worker].push(_taskId);
            
            emit WorkerJoined(_taskId, worker, task.workerStake);
        }
    }
    
    /**
     * @dev Simplified: Requester manually selects evaluators (for MVP)
     */
    function selectEvaluators(bytes32 _taskId, address[] calldata _evaluators) external onlyTaskRequester(_taskId) {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open || task.status == TaskStatus.Created, "Task not open");
        require(_evaluators.length == task.evaluatorCount, "Wrong evaluator count");
        require(task.workers.length == task.workerCount, "Select workers first");
        require(task.evaluators.length == 0, "Evaluators already selected");
        
        for (uint i = 0; i < _evaluators.length; i++) {
            address evaluator = _evaluators[i];
            require(registry.isEligibleEvaluator(evaluator), "Not eligible evaluator");
            
            // Check not also a worker
            bool isWorker = false;
            for (uint j = 0; j < task.workers.length; j++) {
                if (task.workers[j] == evaluator) {
                    isWorker = true;
                    break;
                }
            }
            require(!isWorker, "Evaluator cannot be worker");
            
            // Lock stake if required
            if (task.evaluatorStake > 0) {
                require(
                    paymentToken.transferFrom(evaluator, address(this), task.evaluatorStake),
                    "Evaluator stake transfer failed"
                );
            }
            
            task.evaluators.push(evaluator);
            evaluatorTasks[evaluator].push(_taskId);
            
            emit EvaluatorJoined(_taskId, evaluator, task.evaluatorStake);
        }
    }

    // ============ Submission ============
    
    /**
     * @dev Worker submits result hash
     */
    function submitResult(
        bytes32 _taskId,
        bytes32 _resultHash,
        string calldata _summary,
        bytes32 _proof
    ) external onlyTaskWorker(_taskId) nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(block.timestamp <= task.submissionDeadline, "Deadline passed");
        require(!results[_taskId][msg.sender].submitted, "Already submitted");
        require(_resultHash != bytes32(0), "Invalid result hash");
        require(bytes(_summary).length > 0 && bytes(_summary).length <= 500, "Summary 1-500 chars");
        
        results[_taskId][msg.sender] = Result({
            resultHash: _resultHash,
            summary: _summary,
            proof: _proof,
            submittedAt: uint64(block.timestamp),
            submitted: true,
            finalScore: 0,
            payment: 0,
            inConsensus: false
        });
        
        emit ResultSubmitted(_taskId, msg.sender, _resultHash, uint64(block.timestamp));
        
        // Check if all workers submitted
        bool allSubmitted = true;
        for (uint i = 0; i < task.workers.length; i++) {
            if (!results[_taskId][task.workers[i]].submitted) {
                allSubmitted = false;
                break;
            }
        }
        
        if (allSubmitted) {
            task.status = TaskStatus.Evaluating;
        }
    }

    // ============ Evaluation ============
    
    /**
     * @dev Evaluator submits score for a specific worker's result
     */
    function submitEvaluation(
        bytes32 _taskId,
        address _evaluatedWorker,
        uint8 _score,
        uint8 _confidence,
        bytes32 _evaluationHash,
        string calldata _rationale
    ) external onlyTaskEvaluator(_taskId) nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Evaluating, "Task not in evaluation");
        require(block.timestamp <= task.evaluationDeadline, "Evaluation deadline passed");
        require(_evaluatedWorker != msg.sender, "Cannot evaluate self");
        require(_score <= 100, "Score 0-100");
        require(_confidence <= 100, "Confidence 0-100");
        require(results[_taskId][_evaluatedWorker].submitted, "Worker not submitted");
        require(!evaluations[_taskId][msg.sender][_evaluatedWorker].submitted, "Already evaluated");
        
        evaluations[_taskId][msg.sender][_evaluatedWorker] = Evaluation({
            score: _score,
            confidence: _confidence,
            evaluationHash: _evaluationHash,
            rationale: _rationale,
            submittedAt: uint64(block.timestamp),
            submitted: true,
            payment: 0,
            alignedWithConsensus: false
        });
        
        emit EvaluationSubmitted(_taskId, msg.sender, _evaluatedWorker, _score, _confidence);
    }

    // ============ Settlement ============
    
    /**
     * @dev Settle task with consensus results (oracle-provided for MVP)
     */
    function settleTask(
        bytes32 _taskId,
        bytes32 _winningClusterHash,
        address[] calldata _consensusWorkers,
        uint8[] calldata _workerScores,
        address[] calldata _alignedEvaluators,
        address[] calldata _outlierEvaluators
    ) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Evaluating, "Task not evaluating");
        require(_consensusWorkers.length <= task.workers.length, "Too many consensus workers");
        require(_workerScores.length == _consensusWorkers.length, "Score count mismatch");
        
        task.status = TaskStatus.Settled;
        winningClusterHash[_taskId] = _winningClusterHash;
        
        uint256 totalPaid = 0;
        uint256 totalSlashed = 0;
        
        // Mark consensus workers
        for (uint i = 0; i < _consensusWorkers.length; i++) {
            inConsensusCluster[_taskId][_consensusWorkers[i]] = true;
            results[_taskId][_consensusWorkers[i]].inConsensus = true;
            results[_taskId][_consensusWorkers[i]].finalScore = _workerScores[i];
        }
        
        // Calculate worker payments
        uint256 totalWorkerScore = 0;
        for (uint i = 0; i < _consensusWorkers.length; i++) {
            totalWorkerScore += _workerScores[i];
        }
        
        // Distribute worker pool
        for (uint i = 0; i < _consensusWorkers.length; i++) {
            address worker = _consensusWorkers[i];
            uint256 payment = (task.workerPoolAmount * _workerScores[i]) / totalWorkerScore;
            results[_taskId][worker].payment = payment;
            
            // Bonus for top performers (>90th percentile)
            bool gotBonus = false;
            if (_workerScores[i] >= 90 && task.bonusPoolAmount > 0) {
                uint256 bonus = task.bonusPoolAmount / _consensusWorkers.length;
                payment += bonus;
                gotBonus = true;
            }
            
            // Return stake + payment
            uint256 totalTransfer = payment + task.workerStake;
            require(paymentToken.transfer(worker, totalTransfer), "Worker payment failed");
            totalPaid += payment;
            
            // Update reputation
            registry.updateWorkerReputation(worker, int256(uint256(_workerScores[i])) / 10);
            
            emit WorkerPaid(_taskId, worker, payment, gotBonus);
        }
        
        // Slash workers not in consensus
        for (uint i = 0; i < task.workers.length; i++) {
            address worker = task.workers[i];
            if (!inConsensusCluster[_taskId][worker]) {
                // Slash worker stake
                if (task.workerStake > 0) {
                    totalSlashed += task.workerStake;
                    emit StakeSlashed(_taskId, worker, task.workerStake, "Not in consensus");
                }
                // Penalize reputation
                registry.updateWorkerReputation(worker, -10);
            }
        }
        
        // Distribute evaluator payments
        uint256 evaluatorPayment = task.evaluatorPoolAmount / (_alignedEvaluators.length + 1); // +1 for buffer
        
        for (uint i = 0; i < _alignedEvaluators.length; i++) {
            address evaluator = _alignedEvaluators[i];
            evaluations[_taskId][evaluator][task.workers[0]].alignedWithConsensus = true;
            evaluations[_taskId][evaluator][task.workers[0]].payment = evaluatorPayment;
            
            // Return stake + payment
            uint256 totalTransfer = evaluatorPayment + task.evaluatorStake;
            require(paymentToken.transfer(evaluator, totalTransfer), "Evaluator payment failed");
            totalPaid += evaluatorPayment;
            
            // Update reputation
            registry.updateEvaluatorReputation(evaluator, 5);
            
            emit EvaluatorPaid(_taskId, evaluator, evaluatorPayment);
        }
        
        // Slash outlier evaluators
        for (uint i = 0; i < _outlierEvaluators.length; i++) {
            address evaluator = _outlierEvaluators[i];
            if (task.evaluatorStake > 0) {
                uint256 slashAmount = task.evaluatorStake / 4; // 25% slash
                totalSlashed += slashAmount;
                // Return remaining stake
                require(paymentToken.transfer(evaluator, task.evaluatorStake - slashAmount), "Stake return failed");
                emit StakeSlashed(_taskId, evaluator, slashAmount, "Evaluation deviation");
            }
            // Penalize reputation
            registry.updateEvaluatorReputation(evaluator, -5);
        }
        
        // Return remaining bonus pool to requester if not distributed
        uint256 remainingBonus = task.bonusPoolAmount;
        if (_consensusWorkers.length > 0) {
            // Bonus was distributed above
            remainingBonus = 0;
        }
        if (remainingBonus > 0) {
            require(paymentToken.transfer(task.requester, remainingBonus), "Bonus return failed");
        }
        
        emit TaskSettled(_taskId, _winningClusterHash, totalPaid, totalSlashed);
    }
    
    /**
     * @dev Cancel task before workers join (requester only)
     */
    function cancelTask(bytes32 _taskId) external onlyTaskRequester(_taskId) nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open || task.status == TaskStatus.Created, "Cannot cancel");
        require(task.workers.length == 0, "Workers already joined");
        
        task.status = TaskStatus.Cancelled;
        
        // Return full budget
        require(paymentToken.transfer(task.requester, task.totalBudget), "Refund failed");
    }

    // ============ View Functions ============
    
    function getTask(bytes32 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }
    
    function getResult(bytes32 _taskId, address _worker) external view returns (Result memory) {
        return results[_taskId][_worker];
    }
    
    function getEvaluation(bytes32 _taskId, address _evaluator, address _worker) external view returns (Evaluation memory) {
        return evaluations[_taskId][_evaluator][_worker];
    }
    
    function getRequesterTasks(address _requester) external view returns (bytes32[] memory) {
        return requesterTasks[_requester];
    }
    
    function getWorkerTasks(address _worker) external view returns (bytes32[] memory) {
        return workerTasks[_worker];
    }
    
    function getEvaluatorTasks(address _evaluator) external view returns (bytes32[] memory) {
        return evaluatorTasks[_evaluator];
    }
    
    function getTaskCount() external view returns (uint256) {
        return allTaskIds.length;
    }

    // ============ Admin ============
    
    /**
     * @dev Update default parameters
     */
    function updateDefaults(
        uint8 _workerCount,
        uint8 _evaluatorCount,
        uint64 _submissionWindow,
        uint64 _evaluationWindow
    ) external onlyOwner {
        defaultWorkerCount = _workerCount;
        defaultEvaluatorCount = _evaluatorCount;
        defaultSubmissionWindow = _submissionWindow;
        defaultEvaluationWindow = _evaluationWindow;
    }
    
    /**
     * @dev Emergency withdrawal of stuck tokens (only owner)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(IERC20(_token).transfer(owner(), _amount), "Withdrawal failed");
    }
}