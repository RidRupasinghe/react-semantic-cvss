import { Colors } from "./colors";
import { CVSSMetric, CVSSSeverityRating } from "./types";

export const popupData: Record<string, Record<string, string>> = {
  A: {
    H: "<b>Worst:</b> There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed).",
    L: "<b>Bad:</b> Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users.",
    N: "<b>Good:</b> There is no impact to availability within the impacted component.",
    help: "This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. It refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email)."
  },
  AC: {
    L: "<b>Worst:</b> Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success when attacking the vulnerable component.",
    H: "<b>Bad:</b> A successful attack depends on conditions beyond the attacker's control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected.",
    help: "This metric describes the conditions beyond the attacker’s control that must exist in order to exploit the vulnerability. Such conditions may require the collection of more information about the target or computational exceptions."
  },
  AV: {
    N: "<b>Worst:</b> The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed below, up to and including the entire Internet. Such a vulnerability is often termed “remotely exploitable”.",
    A: "<b>Worse:</b> The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology (e.g. local IP subnet, Bluetooth, 802.11).",
    L: "<b>Bad:</b> The vulnerable component is not bound to the network stack and the attacker’s path is via read/write/execute capabilities locally (e.g., keyboard, console, SSH, or local social engineering).",
    P: "<b>Bad:</b> The attack requires the attacker to physically touch or manipulate the vulnerable component (e.g. cold boot attack, FireWire/USB DMA attack).",
    help: "This metric reflects the context by which vulnerability exploitation is possible. The Base Score increases the more remote (logically and physically) an attacker can be in order to exploit the vulnerable component."
  },
  C: {
    H: "<b>Worst:</b> There is a total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. For example, an attacker steals administrative passwords or private encryption keys.",
    L: "<b>Bad:</b> There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount is limited.",
    N: "<b>Good:</b> There is no loss of confidentiality within the impacted component.",
    help: "This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability."
  },
  I: {
    H: "<b>Worst:</b> There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any or all files protected by the impacted component.",
    L: "<b>Bad:</b> Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited.",
    N: "<b>Good:</b> There is no loss of integrity within the impacted component.",
    help: "This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information."
  },
  PR: {
    N: "<b>Worst:</b> The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack.",
    L: "<b>Worse:</b> The attacker requires privileges that provide basic user capabilities that could normally affect only settings and files owned by a user.",
    H: "<b>Bad:</b> The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable component.",
    help: "This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability."
  },
  S: {
    C: "<b>Worst:</b> An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component (e.g., escaping a VM or sandbox).",
    U: "<b>Bad:</b> An exploited vulnerability can only affect resources managed by the same security authority.",
    help: "Does a successful attack impact a component other than the vulnerable component? If so, the Base Score increases."
  },
  UI: {
    N: "<b>Worst:</b> The vulnerable system can be exploited without interaction from any user.",
    R: "<b>Bad:</b> Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited (e.g., clicking a phishing link or installing an update).",
    help: "This metric captures the requirement for a user, other than the attacker, to participate in the successful compromise of the vulnerable component."
  }
};

// Base metrics configuration
export const baseMatrices: CVSSMetric[] = [
  {
    key: 'AV',
    name: 'Attack Vector',
    help: popupData.AV.help,
    options: [
      { name: 'N', l: 'Network', d: popupData.AV.N },
      { name: 'A', l: 'Adjacent', d: popupData.AV.A },
      { name: 'L', l: 'Local', d: popupData.AV.L },
      { name: 'P', l: 'Physical', d: popupData.AV.P }
    ]
  },
  {
    key: 'AC',
    name: 'Attack Complexity',
    help: popupData.AC.help,
    options: [
      { name: 'L', l: 'Low', d: popupData.AC.L },
      { name: 'H', l: 'High', d: popupData.AC.H }
    ]
  },
  {
    key: 'PR',
    name: 'Privileges Required',
    help: popupData.PR.help,
    options: [
      { name: 'N', l: 'None', d: popupData.PR.N },
      { name: 'L', l: 'Low', d: popupData.PR.L },
      { name: 'H', l: 'High', d: popupData.PR.H }
    ]
  },
  {
    key: 'UI',
    name: 'User Interaction',
    help: popupData.UI.help,
    options: [
      { name: 'N', l: 'None', d: popupData.UI.N },
      { name: 'R', l: 'Required', d: popupData.UI.R }
    ]
  },
  {
    key: 'S',
    name: 'Scope',
    help: popupData.S.help,
    options: [
      { name: 'U', l: 'Unchanged', d: popupData.S.U },
      { name: 'C', l: 'Changed', d: popupData.S.C }
    ]
  },
  {
    key: 'C',
    name: 'Confidentiality',
    help: popupData.C.help,
    options: [
      { name: 'N', l: 'None', d: popupData.C.N },
      { name: 'L', l: 'Low', d: popupData.C.L },
      { name: 'H', l: 'High', d: popupData.C.H }
    ]
  },
  {
    key: 'I',
    name: 'Integrity',
    help: popupData.I.help,
    options: [
      { name: 'N', l: 'None', d: popupData.I.N },
      { name: 'L', l: 'Low', d: popupData.I.L },
      { name: 'H', l: 'High', d: popupData.I.H }
    ]
  },
  {
    key: 'A',
    name: 'Availability',
    help: popupData.A.help,
    options: [
      { name: 'N', l: 'None', d: popupData.A.N },
      { name: 'L', l: 'Low', d: popupData.A.L },
      { name: 'H', l: 'High', d: popupData.A.H }
    ]
  }
];

// Severity ratings configuration
export const severityRatings: CVSSSeverityRating[] = [
  {
    name: "None",
    bottom: 0.0,
    top: 0.0,
    color: Colors.securityCaseSeverityNone,
  },
  {
    name: "Low",
    bottom: 0.1,
    top: 3.9,
    color: Colors.securityCaseSeverityLow,
  },
  {
    name: "Medium",
    bottom: 4.0,
    top: 6.9,
    color: Colors.securityCaseSeverityMedium,
  },
  {
    name: "High",
    bottom: 7.0,
    top: 8.9,
    color: Colors.securityCaseSeverityHigh,
  },
  {
    name: "Critical",
    bottom: 9.0,
    top: 10.0,
    color: Colors.securityCaseSeverityCritical,
  }
];

// CVSS v3.1 weights mapping
export const weight = {
  AV: {
    N: 0.85,
    A: 0.62,
    L: 0.55,
    P: 0.2
  },
  AC: {
    H: 0.44,
    L: 0.77
  },
  PR: {
    // Values used when Scope is Unchanged (U)
    U: {
      N: 0.85,
      L: 0.62,
      H: 0.27
    },
    // Values used when Scope is Changed (C)
    C: {
      N: 0.85,
      L: 0.68,
      H: 0.5
    }
  },
  UI: {
    N: 0.85,
    R: 0.62
  },
  S: {
    U: 6.42,
    C: 7.52
  },
  C: {
    N: 0,
    L: 0.22,
    H: 0.56
  },
  I: {
    N: 0,
    L: 0.22,
    H: 0.56
  },
  A: {
    N: 0,
    L: 0.22,
    H: 0.56
  }
} as const;

export const exploitabilityCoefficient = 8.22;
export const scopeCoefficient = 1.08;
