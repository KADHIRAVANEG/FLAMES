import { Scenario, StudentSubmission } from "./types";
import { evaluatePacket } from "./evaluator";

export interface PacketDiagnostic {
  testPacketId: string;
  description: string;
  passed: boolean;
  studentAction: "ACCEPT" | "DENY";
  webFiltered: boolean;
}

export interface GradingReport {
  scenarioId: string;
  totalChecks: number;
  passedChecks: number;
  overallPassed: boolean;
  diagnostics: PacketDiagnostic[];
}

export function gradeSubmission(scenario: Scenario, submission: StudentSubmission): GradingReport {
  const diagnostics: PacketDiagnostic[] = scenario.expectedOutcomes.map((expected) => {
    const packet = scenario.testPackets.find((p) => p.id === expected.testPacketId);
    if (!packet) {
      return { testPacketId: expected.testPacketId, description: "(unknown packet)", passed: false, studentAction: "DENY", webFiltered: false };
    }
    const result = evaluatePacket(packet, submission.policies, submission.addresses, submission.services, submission.webFilterProfiles ?? []);
    return { testPacketId: packet.id, description: packet.description, passed: result.finalAction === expected.expectedAction, studentAction: result.finalAction, webFiltered: result.webFiltered };
  });

  const passedChecks = diagnostics.filter((d) => d.passed).length;
  return { scenarioId: scenario.id, totalChecks: diagnostics.length, passedChecks, overallPassed: passedChecks === diagnostics.length, diagnostics };
}
