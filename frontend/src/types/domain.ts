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
