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
