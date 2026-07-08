import { Scenario } from "@fortisim/engine";
import {
  webServerAccessScenario,
  dbLockdownScenario,
  dmzMultiServiceScenario,
  interZoneTrustScenario,
  fullNetworkPolicyScenario,
  multiSystemScenario,
  webFilterScenario,
} from "@fortisim/engine";

const allScenarios: Scenario[] = [
  webServerAccessScenario,
  dbLockdownScenario,
  dmzMultiServiceScenario,
  interZoneTrustScenario,
  fullNetworkPolicyScenario,
  multiSystemScenario,
  webFilterScenario,
];

export function listScenarios() {
  return allScenarios.map(({ id, title, description }) => ({ id, title, description }));
}

export function getScenarioById(id: string): Scenario | undefined {
  return allScenarios.find((s) => s.id === id);
}

export function getStudentFacingScenario(id: string) {
  const scenario = getScenarioById(id);
  if (!scenario) return undefined;
  const { expectedOutcomes, ...studentFacing } = scenario;
  return studentFacing;
}
