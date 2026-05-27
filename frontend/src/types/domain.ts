export type Role = {
  id: string;
  code: string;
  name: string;
  factoryId: string | null;
};

export type UserScope = {
  id: string;
  scopeType: "GLOBAL" | "FACTORY" | "DEPARTMENT" | "WORKCENTER" | "LINE";
  factoryId: string | null;
  departmentId: string | null;
  workcenterId: string | null;
  lineId: string | null;
};

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  isStaff: boolean;
  isSuperuser: boolean;
  roles: Role[];
  permissions: string[];
  scopes: UserScope[];
  featureFlags: Record<string, unknown>;
};

export type Factory = {
  id: string;
  code: string;
  name: string;
  timezone: string;
  isActive: boolean;
};

export type Department = {
  id: string;
  factoryId: string;
  code: string;
  name: string;
  departmentType: string;
  isActive: boolean;
};

export type Workcenter = {
  id: string;
  factoryId: string;
  departmentId: string;
  code: string;
  name: string;
  workcenterType: string;
  capacityUnit: string;
  isActive: boolean;
};

export type Line = {
  id: string;
  factoryId: string;
  departmentId: string;
  workcenterId: string | null;
  code: string;
  name: string;
  lineType: string;
  isActive: boolean;
};

export type AuditEvent = {
  id: string;
  eventCode: string;
  entityType: string;
  entityId: string;
  entityDisplayCode: string;
  action: string;
  oldValueJson: Record<string, unknown>;
  newValueJson: Record<string, unknown>;
  reason: string;
  metadata: Record<string, unknown>;
  performedBy: number | null;
  source: string;
  createdAt: string;
};

export type ApprovalStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type EntityRef = {
  id: string;
  code: string;
  name: string;
  isActive?: boolean;
};

export type Customer = EntityRef & {
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
  defaultAqlLevel: string;
};

export type Buyer = EntityRef & {
  customerId: string;
  customerCode: string;
};

export type ProductType = EntityRef;

export type Vendor = EntityRef & {
  vendorType: string;
  nominated: boolean;
  standardLeadTimeDays: number;
};

export type Material = EntityRef & {
  materialType: string;
  uom: string;
  standardLeadTimeDays: number;
  defaultVendorId: string | null;
  nominatedVendorRequired: boolean;
  inspectionRequired: boolean;
};

export type PlanningThreshold = EntityRef & {
  thresholdType: string;
  value: number;
  unit: string;
};

export type StyleReadiness = {
  styleId: string;
  styleCode: string;
  planningReady: boolean;
  missingItems: string[];
  approvedBomId: string | null;
  approvedOperationBulletinId: string | null;
  approvedWashRouteId: string | null;
};

export type StyleListItem = {
  id: string;
  styleCode: string;
  customerName: string;
  customerCode: string;
  buyerName: string | null;
  productType: string;
  washComplexity: string;
  sewingComplexity: string;
  overallComplexity: string;
  status: ApprovalStatus;
  planningReady: boolean;
  missingItems: string[];
};

export type StyleDetail = StyleListItem & {
  description: string;
  fitType: string;
  fabricCategory: string;
  season: string;
  referenceSampleNo: string;
  defaultWashRouteId: string | null;
  readiness: StyleReadiness;
};

export type BOMLine = {
  id: string;
  material: Material;
  consumptionPerPiece: number;
  wastagePercent: number;
  uom: string;
  requiredStage: string;
  nominatedVendorRequired: boolean;
};

export type BOMHeader = {
  id: string;
  styleId: string;
  styleCode: string;
  version: string;
  status: ApprovalStatus;
  effectiveDate: string | null;
  approvedAt: string | null;
  lineCount: number;
  lines?: BOMLine[];
};

export type OperationMaster = EntityRef & {
  operationGroup: string;
  defaultMachineTypeId: string | null;
  defaultMachineTypeCode: string | null;
  defaultSkillLevel: string;
};

export type OperationBulletinLine = {
  id: string;
  sequenceNo: number;
  operationMasterId: string;
  operationCode: string;
  operationName: string;
  operationGroup: string;
  machineTypeId: string | null;
  machineType: string | null;
  attachmentRequired: string;
  skillLevel: string;
  smv: number;
  targetPph: number;
  qcCheckpoint: boolean;
  criticalOperation: boolean;
  parallelAllowed: boolean;
  reworkSensitive: boolean;
};

export type OperationBulletin = {
  id: string;
  styleId: string;
  styleCode: string;
  customerName: string;
  productType: string;
  version: string;
  status: ApprovalStatus;
  totalSmv: number;
  operationCount: number;
  criticalOperationCount: number;
  approvedAt: string | null;
  operations?: OperationBulletinLine[];
};

export type WashRouteStep = {
  id: string;
  sequenceNo: number;
  name: string;
  workcenterId: string | null;
  workcenterCode: string | null;
  machineTypeId: string | null;
  machineType: string | null;
  standardMinutes: number;
  qcStep: boolean;
  required: boolean;
};

export type WashRoute = EntityRef & {
  productType: string | null;
  complexity: string;
  status: ApprovalStatus;
  approvedAt: string | null;
  stepCount: number;
  steps?: WashRouteStep[];
};

export type MachineType = EntityRef & {
  category: string;
};

export type Machine = EntityRef & {
  machineTypeId: string;
  machineTypeCode: string;
  factoryId: string;
  status: string;
  currentLineId: string | null;
};

export type LineCapability = {
  lineId: string;
  lineCode: string;
  lineName: string;
  workingMinutes: number;
  currentManpower: number;
  baselineEfficiency: number;
  availableMinutes: number;
  allowedProductTypes: string[];
  machineCount: number;
  machineTypes: string[];
};

export type WorkcenterCapacityDay = {
  id: string;
  workcenterId: string;
  workcenterCode: string;
  capacityDate: string;
  availableMinutes: number;
  capacityUnit: string;
  capacityValue: number;
  source: string;
};

export type OrderStage =
  | "CREATED"
  | "PRE_PRODUCTION"
  | "PCD_PENDING"
  | "PCD_READY"
  | "CUTTING"
  | "SEWING"
  | "WASHING"
  | "FINISHING"
  | "PACKING"
  | "SHIPMENT_READY"
  | "SHIPPED"
  | "ON_HOLD"
  | "CANCELLED";

export type ReadinessStatus =
  | "IN_REVIEW"
  | "READY"
  | "CONDITIONALLY_READY"
  | "BLOCKED"
  | "ESCALATED"
  | "RELEASED";

export type ChecklistItemStatus = "PENDING" | "PASSED" | "FAILED" | "WAIVED" | "NOT_APPLICABLE";

export type FabricQcStatus = "PENDING" | "PASSED" | "FAILED" | "HOLD" | "WAIVED";

export type OrderOwner = {
  id: number;
  displayName: string;
};

export type ProductionOrder = {
  id: string;
  orderNo: string;
  poNumber: string;
  customer: EntityRef;
  buyer: EntityRef | null;
  style: {
    id: string;
    styleCode: string;
    productType: string;
    washComplexity: string;
    sewingComplexity: string;
  };
  productType: string;
  orderQty: number;
  plannedPcdDate: string;
  plannedShipDate: string | null;
  committedShipDate: string;
  currentStage: OrderStage;
  lifecycleStatus: OrderStage;
  riskStatus: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";
  pcdStatus: ReadinessStatus | "NOT_STARTED";
  materialReadinessStatus: string;
  fabricQcStatus: FabricQcStatus;
  shipmentReadinessStatus: string;
  owner: OrderOwner | null;
  nextAction: string;
  openExceptionCount: number;
  releaseAllowed: boolean;
  releaseBlockers: string[];
  lastUpdatedAt: string;
  lines?: OrderLine[];
  summary?: Record<string, number>;
  pcdReadiness?: PcdReadiness | null;
  materialReadiness?: MaterialReadiness;
  openBlockers?: Array<{ category: string; severity: string; message: string }>;
};

export type OrderLine = {
  id: string;
  size: string;
  color: string;
  quantity: number;
};

export type OrderTimelineEvent = {
  id: string;
  eventCode: string;
  fromStage: string;
  toStage: string;
  message: string;
  metadata: Record<string, unknown>;
  performedBy: OrderOwner | null;
  createdAt: string;
};

export type MaterialReadinessItem = {
  id: string;
  orderId: string;
  orderNo: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  requiredQty: number;
  shortageQty: number;
  requiredDate: string | null;
  requiredStage: string;
  status: string;
  latestEta: string | null;
  etaAfterPcd: boolean;
  vendorCode: string | null;
};

export type MaterialReadiness = {
  orderId: string;
  orderNo: string;
  readinessStatus: string;
  riskStatus: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";
  items: MaterialReadinessItem[];
  blockedCount: number;
};

export type MaterialPurchaseOrder = {
  id: string;
  poNo: string;
  orderId: string | null;
  orderNo: string | null;
  vendorCode: string;
  vendorName: string;
  materialCode: string;
  materialName: string;
  orderedQty: number;
  acknowledgedQty: number | null;
  expectedArrivalDate: string | null;
  revisedEta: string | null;
  actualArrivalDate: string | null;
  status: string;
};

export type FabricRoll = {
  id: string;
  rollNo: string;
  rollLength: number;
  width: number | null;
  gsm: number | null;
  shade: string;
  qcStatus: FabricQcStatus;
};

export type FabricLot = {
  id: string;
  orderId: string | null;
  orderNo: string | null;
  lotNo: string;
  shadeLot: string;
  receivedQty: number;
  receivedDate: string;
  status: string;
  rolls: FabricRoll[];
};

export type FabricQcInspection = {
  id: string;
  fabricRollId: string;
  rollNo: string;
  lotNo: string;
  orderNo: string | null;
  inspectionDate: string;
  fourPointScore: number | null;
  widthResult: number | null;
  gsmResult: number | null;
  shrinkagePercent: number | null;
  status: FabricQcStatus;
  remarks: string;
  waiverReason: string;
};

export type FabricQcDashboard = {
  lots: FabricLot[];
  inspections: FabricQcInspection[];
};

export type PcdReadinessItem = {
  id: string;
  itemCode: string;
  itemLabel: string;
  isMandatory: boolean;
  status: ChecklistItemStatus;
  ownerId: number | null;
  dueDate: string | null;
  waiverReason: string;
  evidenceUrl: string;
  remarks: string;
};

export type ConditionalRelease = {
  id: string;
  status: "REQUESTED" | "APPROVED" | "EXPIRED" | "REJECTED";
  openItemCodes: string[];
  reason: string;
  riskNote: string;
  expiryDate: string;
  requestedBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
};

export type PcdReadiness = {
  id: string;
  orderId: string;
  orderNo: string;
  styleCode: string;
  customerName: string;
  plannedPcdDate: string;
  readinessStatus: ReadinessStatus;
  conditionalRelease: boolean;
  conditionalReleaseReason: string;
  conditionalReleaseExpiry: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  releasedToCuttingAt: string | null;
  releaseAllowed: boolean;
  releaseBlockers: string[];
  items: PcdReadinessItem[];
  conditionalReleases: ConditionalRelease[];
};

export type RiskStatus = "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";

export type PlanningHorizon = {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
};

export type PlanVersion = {
  id: string;
  horizonId: string;
  versionNo: number;
  status: "DRAFT" | "FROZEN" | "ARCHIVED";
  riskStatus: RiskStatus;
  frozenAt: string | null;
  notes: string;
};

export type PlannedWorkItem = {
  id: string;
  planVersionId: string;
  orderId: string;
  orderNo: string;
  styleCode: string;
  customerName: string;
  workcenterId: string;
  workcenterCode: string;
  workcenterName: string;
  lineId: string | null;
  lineCode: string | null;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedShift: string;
  planningZone: "FROZEN_ZONE" | "FIRM_ZONE" | "FLEXIBLE_ZONE";
  productionStage: string;
  colorCode: string;
  shadeLot: string;
  approvalRequired: boolean;
  plannedQuantity: number;
  loadMinutes: number;
  sequenceNo: number;
  status: "PLANNED" | "RELEASE_READY" | "BLOCKED" | "RELEASED";
  riskStatus: RiskStatus;
  locked: boolean;
};

export type WorkcenterCapacityDefinition = {
  id: string;
  workcenterType: string;
  capacityUnit: string;
  planningBucket: string;
  primaryConstraintResource: string;
  secondaryConstraintResource: string;
  normalCapacityValue: number;
  normalCapacityUnit: string;
  overtimeAllowed: boolean;
  approvedOvertimeCapacityValue: number;
  capacityLossTriggers: string[];
  recoveryLevers: string[];
};

export type WorkcenterLoad = {
  id?: string;
  workcenterId: string;
  workcenterCode: string;
  workcenterName: string;
  workcenterType?: string;
  factoryCode?: string;
  snapshotDate?: string;
  availableMinutes: number;
  plannedLoadMinutes: number;
  actualLoadMinutes?: number;
  utilizationPercent: number;
  queueQuantity: number;
  oldestQueueAgeHours?: number;
  constraintStatus: "NORMAL" | "WATCH" | "OVERLOADED" | "CRITICAL";
  riskStatus: RiskStatus;
  topAffectedOrderId?: string | null;
  topAffectedOrderNo: string | null;
  suggestedAction: string;
  capacityDefinition?: WorkcenterCapacityDefinition | null;
};

export type PlanImpactPreview = {
  planVersionId: string;
  orderId: string;
  workcenterId: string;
  addedMinutes: number;
  planningZone: "FROZEN_ZONE" | "FIRM_ZONE" | "FLEXIBLE_ZONE";
  approvalRequired: boolean;
  autoRescheduleAllowed: boolean;
  schedulingGrain: Record<string, unknown>;
  before: Pick<
    WorkcenterLoad,
    "availableMinutes" | "plannedLoadMinutes" | "utilizationPercent" | "constraintStatus" | "riskStatus"
  >;
  after: Pick<
    WorkcenterLoad,
    "availableMinutes" | "plannedLoadMinutes" | "utilizationPercent" | "constraintStatus" | "riskStatus"
  >;
  writeApplied: boolean;
  warnings: string[];
};

export type WeeklyPlanningPayload = {
  horizon: PlanningHorizon | null;
  plan: PlanVersion | null;
  backlog: ProductionOrder[];
  workItems: PlannedWorkItem[];
  workcenterLoads: WorkcenterLoad[];
  changeRequests: PlanChangeRequest[];
};

export type PlanChangeRequest = {
  id: string;
  planVersionId: string;
  workItemId: string | null;
  changeType: string;
  status: string;
  reason: string;
  payload: Record<string, unknown>;
  impactPreview: Record<string, unknown>;
  createdAt: string;
};

export type WorkcenterQueueItem = {
  id: string;
  workcenterId: string;
  workcenterCode: string;
  snapshotDate: string;
  orderId: string | null;
  orderNo: string | null;
  queueStage: string;
  queueQuantity: number;
  ageHours: number;
  riskStatus: RiskStatus;
  ownerLabel: string;
  nextAction: string;
};

export type ReleaseValidationCheck = {
  code: string;
  passed: boolean;
  owner: string;
};

export type ReleaseBlocker = {
  code: string;
  message: string;
  severity: "WATCH" | "ACTION" | "CRITICAL";
  owner: string;
};

export type ReleaseValidationResult = {
  id: string;
  releaseId: string | null;
  plannedWorkItemId: string | null;
  orderId: string;
  orderNo: string;
  isValid: boolean;
  riskStatus: RiskStatus;
  checkedAt: string;
  checks: ReleaseValidationCheck[];
  blockers: ReleaseBlocker[];
};

export type ProductionRelease = {
  id: string;
  releaseNo: string;
  plannedWorkItemId: string | null;
  orderId: string;
  orderNo: string;
  workcenterId: string;
  workcenterCode: string;
  workcenterName: string;
  releaseDate: string;
  releaseType: string;
  status:
    | "DRAFT"
    | "READY"
    | "BLOCKED"
    | "OVERRIDE_REQUESTED"
    | "OVERRIDE_APPROVED"
    | "RELEASED"
    | "COMPLETED";
  riskStatus: RiskStatus;
  releasedAt: string | null;
  completedAt: string | null;
  overrideReason: string;
  validation: ReleaseValidationResult | null;
};

export type BoundarySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BoundaryEventStatus =
  | "OPEN"
  | "IMPACT_PREVIEWED"
  | "ACTION_PROPOSED"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type BoundaryImpactPreview = {
  canApply: boolean;
  approvalRequired: boolean;
  riskBefore: RiskStatus;
  riskAfter: RiskStatus;
  affectedOrders: Array<Record<string, unknown>>;
  affectedWorkcenters: Array<Record<string, unknown>>;
  affectedWip: Array<Record<string, unknown>>;
  affectedShipments: Array<Record<string, unknown>>;
  capacityImpact: Record<string, unknown>;
  recommendedActions: string[];
  warnings: string[];
  blockingReasons: string[];
};

export type BoundaryCaseEvent = {
  id: string;
  eventNo: string;
  eventType: string;
  status: BoundaryEventStatus;
  severity: BoundarySeverity;
  linkedOrderId: string | null;
  linkedOrderNo: string | null;
  linkedWorkcenterId: string | null;
  linkedWorkcenterCode: string | null;
  eventStage: string;
  triggerSource: string;
  affectedQuantity: number;
  affectedCapacityMinutes: number;
  affectedShipmentDate: string | null;
  riskBefore: RiskStatus;
  riskAfter: RiskStatus;
  recommendedAction: string;
  approvalRequired: boolean;
  ownerId: number | null;
  ownerName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  impactPreviews?: BoundaryImpactPreview[];
};

export type ExternalPlanValidationResult = {
  id: string;
  conflictType: string;
  severity: string;
  rowNumber: number;
  orderNo: string;
  message: string;
  metadata: Record<string, unknown>;
};

export type ExternalPlanImportBatch = {
  id: string;
  importNo: string;
  sourceType: string;
  status: string;
  sourceReference: string;
  rowCount: number;
  validationSummary: Record<string, unknown>;
  createdDraftPlanId: string | null;
  validationResults: ExternalPlanValidationResult[];
  createdAt: string;
};

export type CutBundle = {
  id: string;
  bundleNo: string;
  quantity: number;
  shadeLot: string;
  status: string;
};

export type CuttingOutputEntry = {
  id: string;
  jobId: string;
  jobNo: string;
  clientEventId: string;
  outputQty: number;
  defectQty: number;
  reworkQty: number;
  netCutQty: number;
  recordedAt: string;
  remarks: string;
};

export type CuttingJob = {
  id: string;
  jobNo: string;
  releaseId: string;
  releaseNo: string;
  orderId: string;
  orderNo: string;
  styleCode: string;
  workcenterId: string;
  workcenterCode: string;
  plannedQuantity: number;
  markerNo: string;
  colorCode: string;
  shadeLot: string;
  status: string;
  riskStatus: RiskStatus;
  startedAt: string | null;
  completedAt: string | null;
  handedOverAt: string | null;
  outputQty: number;
  netCutQty: number;
  bundleCount: number;
  outputs?: CuttingOutputEntry[];
  bundles?: CutBundle[];
};

export type WipStageSummary = {
  quantity: number;
  availableQuantity: number;
  heldQuantity: number;
  riskStatus: RiskStatus;
};

export type WipSummary = {
  orderId: string;
  orderNo: string;
  stages: Record<string, WipStageSummary>;
  totalAvailable: number;
};

export type WipMovement = {
  id: string;
  movementNo: string;
  orderId: string;
  orderNo: string;
  sourceLotId: string | null;
  targetLotId: string | null;
  fromStage: string;
  toStage: string;
  quantity: number;
  movementType: string;
  reason: string;
  createdAt: string;
};

export type SewingLineLoading = {
  id: string;
  loadingNo: string;
  releaseId: string;
  releaseNo: string;
  orderId: string;
  orderNo: string;
  styleCode: string;
  lineId: string;
  lineCode: string;
  lineName: string;
  workcenterId: string;
  workcenterCode: string;
  bulletinId: string;
  bulletinVersion: string;
  plannedQuantity: number;
  targetOutputPerDay: number;
  targetEfficiency: number;
  expectedDefectRate: number;
  planningZone: string;
  plannedShift: string;
  colorCode: string;
  shadeLot: string;
  fitStatus: string;
  status: string;
  riskStatus: RiskStatus;
  activatedAt: string | null;
  closedAt: string | null;
};

export type HourlyOutputBucket = {
  time: string;
  target: number;
  actual: number;
};

export type OperatorAllocation = {
  code: string;
  name: string;
  role: string;
  status: "PRESENT" | "ABSENT" | string;
};

export type RecoveryAction = {
  label: string;
  description: string;
  actionLabel: string;
};

export type SewingLineAnalysis = {
  title: string;
  subtitle: string;
  hourlyOutput: HourlyOutputBucket[];
  bottleneckOperation: {
    operationName: string;
    smv: number;
    station: string;
    wipAccumulation: number;
  };
  operatorAllocation: OperatorAllocation[];
  absenceImpact: string;
  recoveryAction: RecoveryAction;
};

export type SewingLineBoardRow = {
  id: string;
  lineLoadingId: string;
  lineCode: string;
  rawLineCode: string;
  poNo: string;
  orderNo: string;
  style: string;
  smv: number;
  target: number;
  actual: number;
  efficiencyPercent: number;
  defectPercent: number;
  netGood: number;
  plannedManpower: number;
  actualManpower: number;
  status: string;
  riskStatus: RiskStatus;
  analysis: SewingLineAnalysis;
};

export type SewingLineLoadingBoard = {
  summary: {
    activeLines: number;
    overloadedLines: number;
    underloadedLines: number;
    avgNetGoodEfficiency: number;
    highestRisk: {
      lineId: string;
      lineCode: string;
      efficiencyPercent: number;
      defectPercent: number;
      riskStatus: RiskStatus;
    };
  };
  lines: SewingLineBoardRow[];
  selectedLineId: string | null;
};

export type LineLoadingPreview = {
  releaseId: string;
  releaseNo: string;
  orderId: string;
  orderNo: string;
  lineId: string;
  lineCode: string;
  bulletinId: string;
  bulletinVersion: string;
  styleCode: string;
  styleSmv: number;
  plannedQuantity: number;
  dailyTarget: number;
  targetEfficiency: number;
  expectedDefectRate: number;
  availableMinutes: number;
  fitStatus: string;
  riskStatus: RiskStatus;
  machineGaps: Array<Record<string, unknown>>;
  skillGaps: Array<Record<string, unknown>>;
  approvalRequired: boolean;
  warnings: string[];
};

export type LineRealignmentGap = {
  id?: string;
  gapType?: string;
  label?: string;
  machineType?: string;
  operationName?: string;
  required?: number;
  available?: number;
  requiredOperators?: number;
  availableOperators?: number;
  gap: number;
  recommendation: string;
};

export type LineRealignmentPreview = {
  lineId: string;
  lineCode: string;
  lineLoadingId: string | null;
  orderId: string | null;
  orderNo: string;
  styleCode: string;
  bulletinId: string;
  bulletinVersion: string;
  fitStatus: string;
  expectedOutputBefore: number;
  expectedOutputAfter: number;
  changeoverMinutes: number;
  machineGaps: LineRealignmentGap[];
  skillGaps: LineRealignmentGap[];
  bottleneckOperations: Array<{ operationName: string; loadPercent: number }>;
  recommendations: string[];
  approvalRequired: boolean;
  riskStatus: RiskStatus;
};

export type LineRealignment = LineRealignmentPreview & {
  id: string;
  requestNo: string;
  status: string;
  targetOutput: number;
  gaps: LineRealignmentGap[];
};

export type SewingOutputEntry = {
  id: string;
  lineLoadingId: string;
  loadingNo: string;
  clientEventId: string;
  orderId: string;
  orderNo: string;
  lineId: string;
  lineCode: string;
  entryTime: string;
  timeSlot: string;
  grossQty: number;
  defectQty: number;
  reworkQty: number;
  netGoodQty: number;
  source: string;
  remarks: string;
};

export type SewingLineEfficiency = {
  lineLoadingId: string;
  loadingNo: string;
  orderNo: string;
  lineCode: string;
  targetOutput: number;
  grossQty: number;
  defectQty: number;
  reworkQty: number;
  netGoodQty: number;
  efficiencyPercent: number;
  riskStatus: RiskStatus;
};

export type OperationBulletinPerformance = {
  bulletinId: string;
  styleCode: string;
  version: string;
  totalSmv: number;
  activeLineLoadings: number;
  plannedQuantity: number;
  targetQuantity: number;
  grossQty: number;
  netGoodQty: number;
  efficiencyPercent: number;
  performanceVariance: number;
};
