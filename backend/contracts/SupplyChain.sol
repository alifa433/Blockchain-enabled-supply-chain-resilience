// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SupplyChainRegistry
 * @notice End-to-end coordinator for supply-chain participants, delivery requests,
 *         matchmaking, contract drafting, deployment and tracking.
 */
contract SupplyChainRegistry {
    enum Role {
        Unknown,
        Supplier,
        Manufacturer,
        Depot,
        Carrier,
        Demander
    }

    enum AgreementStatus {
        Draft,
        Deployed,
        Completed
    }

    struct Participant {
        string orgName;
        Role role;
        string email;
        string region;
        string metadataURI;
        bool active;
    }

    struct CarrierProfile {
        string vehicleType;
        string[] coverageAreas;
        uint256 capacityPerTrip;
        uint256 baseCharge;
        uint256 leadTimeHours;
        uint256 collateralPct;
        bool exists;
    }

    struct DeliveryRequest {
        uint256 id;
        address requester;
        string demander;
        string fromRegion;
        string toRegion;
        string materialId;
        uint256 quantity;
        uint256 deadline;
        uint256 maxPrice;
        uint256 collateralStake;
        string notes;
        bool open;
    }

    struct MatchCandidate {
        address provider;
        string providerName;
        Role providerRole;
        uint256 score;
        bool capacityOk;
        uint256 priceEstimate;
        uint256 leadTimeHours;
        uint256 co2EstimateKg;
    }

    struct ContractTerm {
        string key;
        string value;
    }

    struct DeliveryAgreement {
        uint256 id;
        uint256 requestId;
        address demander;
        address provider;
        string partyAName;
        string partyBName;
        string onTimeReward;
        string tardyPenalty;
        AgreementStatus status;
        address contractAddress;
        string metadataURI;
    }

    struct RegistrationInput {
        string orgName;
        Role role;
        string email;
        string region;
        string metadataURI;
        string vehicleType;
        uint256 capacityPerTrip;
        uint256 baseCharge;
        uint256 leadTimeHours;
        uint256 collateralPct;
    }

    struct RequestInput {
        string demander;
        string fromRegion;
        string toRegion;
        string materialId;
        uint256 quantity;
        uint256 deadline;
        uint256 maxPrice;
        uint256 collateralStake;
        string notes;
    }

    struct AgreementDraftInput {
        uint256 requestId;
        address provider;
        string partyAName;
        string partyBName;
        string onTimeReward;
        string tardyPenalty;
        string metadataURI;
        ContractTerm[] terms;
    }

    struct TrackingEvent {
        uint256 timestamp;
        string statusText;
        string location;
    }

    uint256 private _requestIdTracker;
    uint256 private _agreementIdTracker;

    mapping(address => Participant) public participants;
    mapping(address => CarrierProfile) private carrierProfiles;
    address[] private participantAddresses;
    address[] private carriers;

    DeliveryRequest[] private deliveryRequests;

    mapping(uint256 => DeliveryAgreement) private agreements;
    mapping(uint256 => ContractTerm[]) private agreementTerms;

    mapping(uint256 => TrackingEvent[]) private requestTracking;

    event ParticipantRegistered(address indexed account, Role role, string orgName);
    event DeliveryRequested(uint256 indexed requestId, address indexed requester);
    event AgreementDrafted(uint256 indexed agreementId, uint256 indexed requestId, address provider);
    event AgreementDeployed(uint256 indexed agreementId, address contractAddress);
    event TrackingEventLogged(uint256 indexed requestId, string statusText, string location);

    modifier onlyRegistered() {
        require(participants[msg.sender].active, "NOT_REGISTERED");
        _;
    }

    function register(RegistrationInput calldata input, string[] calldata coverageAreas) external {
        require(!participants[msg.sender].active, "ALREADY_REGISTERED");
        require(bytes(input.orgName).length > 0, "ORG_NAME_REQUIRED");
        require(input.role != Role.Unknown, "ROLE_REQUIRED");

        Participant storage participant = participants[msg.sender];
        participant.orgName = input.orgName;
        participant.role = input.role;
        participant.email = input.email;
        participant.region = input.region;
        participant.metadataURI = input.metadataURI;
        participant.active = true;

        participantAddresses.push(msg.sender);

        if (input.role == Role.Carrier) {
            CarrierProfile storage profile = carrierProfiles[msg.sender];
            profile.vehicleType = input.vehicleType;
            profile.coverageAreas = coverageAreas;
            profile.capacityPerTrip = input.capacityPerTrip;
            profile.baseCharge = input.baseCharge;
            profile.leadTimeHours = input.leadTimeHours;
            profile.collateralPct = input.collateralPct;
            profile.exists = true;
            carriers.push(msg.sender);
        }

        emit ParticipantRegistered(msg.sender, input.role, input.orgName);
    }

    function getParticipant(address account) external view returns (Participant memory participant, CarrierProfile memory carrier) {
        participant = participants[account];
        carrier = carrierProfiles[account];
    }

    function createDeliveryRequest(RequestInput calldata input) external onlyRegistered returns (uint256) {
        require(input.quantity > 0, "QUANTITY_REQUIRED");
        require(bytes(input.demander).length > 0, "DEMANDER_REQUIRED");
        require(bytes(input.fromRegion).length > 0, "FROM_REQUIRED");
        require(bytes(input.toRegion).length > 0, "TO_REQUIRED");

        _requestIdTracker += 1;
        uint256 newId = _requestIdTracker;

        DeliveryRequest memory request = DeliveryRequest({
            id: newId,
            requester: msg.sender,
            demander: input.demander,
            fromRegion: input.fromRegion,
            toRegion: input.toRegion,
            materialId: input.materialId,
            quantity: input.quantity,
            deadline: input.deadline,
            maxPrice: input.maxPrice,
            collateralStake: input.collateralStake,
            notes: input.notes,
            open: true
        });

        deliveryRequests.push(request);

        emit DeliveryRequested(newId, msg.sender);
        return newId;
    }

    function getDeliveryRequest(uint256 requestId) public view returns (DeliveryRequest memory) {
        require(requestId > 0 && requestId <= deliveryRequests.length, "REQUEST_UNKNOWN");
        return deliveryRequests[requestId - 1];
    }

    function deliveryRequestCount() external view returns (uint256) {
        return deliveryRequests.length;
    }

    function findMatches(uint256 requestId) external view returns (MatchCandidate[] memory) {
        DeliveryRequest memory request = getDeliveryRequest(requestId);
        require(request.open, "REQUEST_CLOSED");

        uint256 carrierCount = carriers.length;
        MatchCandidate[] memory candidatesTemp = new MatchCandidate[](carrierCount);
        uint256 actualCount;

        for (uint256 i = 0; i < carrierCount; i++) {
            address provider = carriers[i];
            CarrierProfile storage profile = carrierProfiles[provider];
            if (!profile.exists) {
                continue;
            }

            bool coverage = _covers(profile.coverageAreas, request.fromRegion) ||
                _covers(profile.coverageAreas, request.toRegion);
            bool capacityOk = profile.capacityPerTrip == 0 || profile.capacityPerTrip >= request.quantity;

            uint256 baseScore = 50;
            if (coverage) baseScore += 20;
            if (capacityOk) baseScore += 20;
            if (profile.leadTimeHours > 0) {
                uint256 leadBonus = profile.leadTimeHours <= 24 ? 10 : (profile.leadTimeHours <= 48 ? 5 : 0);
                baseScore += leadBonus;
            }
            if (baseScore > 100) baseScore = 100;

            uint256 priceEstimate = profile.baseCharge + (request.quantity * 10);
            if (priceEstimate == 0) {
                priceEstimate = request.quantity * 15;
            }

            uint256 co2Estimate = request.quantity * 2;
            if (keccak256(bytes(profile.vehicleType)) == keccak256(bytes("EV"))) {
                co2Estimate = co2Estimate / 2;
            }

            MatchCandidate memory candidate = MatchCandidate({
                provider: provider,
                providerName: participants[provider].orgName,
                providerRole: participants[provider].role,
                score: baseScore,
                capacityOk: capacityOk,
                priceEstimate: priceEstimate,
                leadTimeHours: profile.leadTimeHours,
                co2EstimateKg: co2Estimate
            });

            candidatesTemp[actualCount] = candidate;
            actualCount++;
        }

        MatchCandidate[] memory candidates = new MatchCandidate[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            candidates[i] = candidatesTemp[i];
        }

        return candidates;
    }

    function draftContract(AgreementDraftInput calldata input) external onlyRegistered returns (uint256) {
        DeliveryRequest memory request = getDeliveryRequest(input.requestId);
        require(request.open, "REQUEST_CLOSED");
        require(request.requester == msg.sender, "ONLY_REQUESTER");
        require(participants[input.provider].active, "PROVIDER_UNKNOWN");

        _agreementIdTracker += 1;
        uint256 newId = _agreementIdTracker;

        DeliveryAgreement storage agreement = agreements[newId];
        agreement.id = newId;
        agreement.requestId = input.requestId;
        agreement.demander = request.requester;
        agreement.provider = input.provider;
        agreement.partyAName = input.partyAName;
        agreement.partyBName = input.partyBName;
        agreement.onTimeReward = input.onTimeReward;
        agreement.tardyPenalty = input.tardyPenalty;
        agreement.status = AgreementStatus.Draft;
        agreement.metadataURI = input.metadataURI;

        if (input.terms.length > 0) {
            ContractTerm[] storage storedTerms = agreementTerms[newId];
            for (uint256 i = 0; i < input.terms.length; i++) {
                storedTerms.push(input.terms[i]);
            }
        }

        emit AgreementDrafted(newId, input.requestId, input.provider);
        return newId;
    }

    function getAgreement(uint256 agreementId) public view returns (DeliveryAgreement memory agreement, ContractTerm[] memory terms) {
        agreement = agreements[agreementId];
        require(agreement.id != 0, "AGREEMENT_UNKNOWN");
        terms = agreementTerms[agreementId];
    }

    function deployContract(uint256 agreementId) external onlyRegistered returns (address) {
        (DeliveryAgreement memory agreement,) = getAgreement(agreementId);
        require(agreement.status == AgreementStatus.Draft, "NOT_DRAFT");
        require(agreement.demander == msg.sender, "ONLY_DEMANDER");

        DeliveryEscrow escrow = new DeliveryEscrow(
            agreement.demander,
            agreement.provider,
            agreement.requestId,
            agreement.metadataURI
        );
        agreement.contractAddress = address(escrow);
        agreement.status = AgreementStatus.Deployed;
        agreements[agreementId] = agreement;

        emit AgreementDeployed(agreementId, address(escrow));
        return address(escrow);
    }

    function logTrackingEvent(uint256 requestId, string calldata statusText, string calldata location) external onlyRegistered {
        DeliveryRequest memory request = getDeliveryRequest(requestId);
        require(request.requester == msg.sender || participants[msg.sender].role == Role.Carrier, "NOT_AUTHORISED");
        requestTracking[requestId].push(TrackingEvent(block.timestamp, statusText, location));
        emit TrackingEventLogged(requestId, statusText, location);
    }

    function trackingFor(uint256 requestId) external view returns (TrackingEvent[] memory events) {
        events = requestTracking[requestId];
    }

    function getAgreementTerms(uint256 agreementId) external view returns (ContractTerm[] memory) {
        return agreementTerms[agreementId];
    }

    function _covers(string[] storage coverageAreas, string memory region) internal view returns (bool) {
        if (coverageAreas.length == 0) {
            return false;
        }
        bytes32 regionHash = keccak256(bytes(region));
        for (uint256 i = 0; i < coverageAreas.length; i++) {
            if (keccak256(bytes(coverageAreas[i])) == regionHash) {
                return true;
            }
        }
        return false;
    }
}

contract DeliveryEscrow {
    address public immutable demander;
    address public immutable provider;
    address public immutable registry;
    uint256 public immutable requestId;
    string public metadataURI;

    enum Status {
        Draft,
        Active,
        Completed,
        Cancelled
    }

    Status public status;

    struct TrackingEvent {
        uint256 timestamp;
        string statusText;
        string location;
    }

    TrackingEvent[] private _events;

    modifier onlyRegistry() {
        require(msg.sender == registry, "ONLY_REGISTRY");
        _;
    }

    modifier onlyParties() {
        require(msg.sender == demander || msg.sender == provider, "ONLY_PARTIES");
        _;
    }

    constructor(address _demander, address _provider, uint256 _requestId, string memory _metadataURI) {
        demander = _demander;
        provider = _provider;
        registry = msg.sender;
        requestId = _requestId;
        metadataURI = _metadataURI;
        status = Status.Draft;
    }

    function activate() external onlyRegistry {
        require(status == Status.Draft, "NOT_DRAFT");
        status = Status.Active;
    }

    function complete() external onlyRegistry {
        require(status == Status.Active, "NOT_ACTIVE");
        status = Status.Completed;
    }

    function recordTrackingEvent(string calldata statusText, string calldata location) external onlyParties {
        _events.push(TrackingEvent(block.timestamp, statusText, location));
    }

    function trackingEvents() external view returns (uint256[] memory timestamps, string[] memory statuses, string[] memory locations) {
        uint256 length = _events.length;
        timestamps = new uint256[](length);
        statuses = new string[](length);
        locations = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            TrackingEvent storage eventItem = _events[i];
            timestamps[i] = eventItem.timestamp;
            statuses[i] = eventItem.statusText;
            locations[i] = eventItem.location;
        }
    }
}
