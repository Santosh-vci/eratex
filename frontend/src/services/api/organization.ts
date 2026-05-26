import { apiFetch } from "@/services/api/client";
import type { Department, Factory, Line, Workcenter } from "@/types/domain";

export async function getFactories(): Promise<Factory[]> {
  return (await apiFetch<Factory[]>("/organization/factories")).data;
}

export async function getDepartments(): Promise<Department[]> {
  return (await apiFetch<Department[]>("/organization/departments")).data;
}

export async function getWorkcenters(): Promise<Workcenter[]> {
  return (await apiFetch<Workcenter[]>("/organization/workcenters")).data;
}

export async function getLines(): Promise<Line[]> {
  return (await apiFetch<Line[]>("/organization/lines")).data;
}
