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
