import { apiFetch } from "@/services/api/client";
import type {
  Buyer,
  Customer,
  EntityRef,
  Machine,
  MachineType,
  Material,
  PlanningThreshold,
  ProductType,
  Vendor,
} from "@/types/domain";

export async function getCustomers(): Promise<Customer[]> {
  return (await apiFetch<Customer[]>("/master/customers")).data;
}

export async function getBuyers(): Promise<Buyer[]> {
  return (await apiFetch<Buyer[]>("/master/buyers")).data;
}

export async function getVendors(): Promise<Vendor[]> {
  return (await apiFetch<Vendor[]>("/master/vendors")).data;
}

export async function getMaterials(): Promise<Material[]> {
  return (await apiFetch<Material[]>("/master/materials")).data;
}

export async function getProductTypes(): Promise<ProductType[]> {
  return (await apiFetch<ProductType[]>("/master/product-types")).data;
}

export async function getMachineTypes(): Promise<MachineType[]> {
  return (await apiFetch<MachineType[]>("/master/machine-types")).data;
}

export async function getMachines(): Promise<Machine[]> {
  return (await apiFetch<Machine[]>("/master/machines")).data;
}

export async function getDefectCodes(): Promise<EntityRef[]> {
  return (await apiFetch<EntityRef[]>("/master/defect-codes")).data;
}

export async function getThresholds(): Promise<PlanningThreshold[]> {
  return (await apiFetch<PlanningThreshold[]>("/master/thresholds")).data;
}

