import type { AddressObject } from "@fortisim/engine";

interface NetworkTopologyProps {
  addresses: AddressObject[];
  highlightSystemIds?: string[];
}

interface SystemNode {
  id: string;
  label: string;
  address: AddressObject;
  zone: "WAN" | "LAN" | "DMZ";
}

function inferZone(addr: AddressObject): "WAN" | "LAN" | "DMZ" {
  const v = addr.value.toLowerCase();
  if (v.startsWith("10.0.2") || addr.name.toLowerCase().includes("dmz")) return "DMZ";
  if (v.startsWith("10.0.1") || addr.name.toLowerCase().includes("lan")) return "LAN";
  return "WAN";
}

const CANVAS_STYLE: React.CSSProperties = {
  backgroundColor: "#fbfcfd",
  backgroundImage: "radial-gradient(#d8dee5 1px, transparent 1px)",
  backgroundSize: "16px 16px",
};

function ConnectorDot({ color = "#6b7280" }: { color?: string }) {
  return <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

export function NetworkTopology({ addresses, highlightSystemIds = [] }: NetworkTopologyProps) {
  const systems: SystemNode[] = addresses
    .filter((a) => a.value.toLowerCase() !== "all" && a.value !== "0.0.0.0/0")
    .map((a, i) => ({ id: a.id, label: `System ${i + 1}`, address: a, zone: inferZone(a) }));

  const zones: ("WAN" | "LAN" | "DMZ")[] = ["WAN", "LAN", "DMZ"];
  const zoneDots: Record<string, string> = {
    WAN: "#fb923c",
    LAN: "#10b981",
    DMZ: "#60a5fa",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 overflow-hidden">
      <div className="text-[12px] font-medium text-gray-600 mb-3 uppercase tracking-wide">Network Topology</div>

      <div className="rounded border border-gray-200 p-4" style={CANVAS_STYLE}>
        <div className="flex items-start justify-center gap-6">
          {zones.map((zone) => {
            const zoneSystems = systems.filter((s) => s.zone === zone);
            if (zoneSystems.length === 0) return null;
            return (
              <div key={zone} className="flex flex-col items-center gap-1.5">
                <div className="text-[9.5px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: zoneDots[zone] }}>
                  {zone}
                </div>
                <div className="flex flex-col gap-3 items-center">
                  {zoneSystems.map((sys) => {
                    const highlighted = highlightSystemIds.includes(sys.id);
                    return (
                      <div key={sys.id} className="flex flex-col items-center">
                        <div
                          className={`relative w-14 h-11 rounded-sm bg-white border-2 flex items-center justify-center transition-all shadow-sm ${
                            highlighted ? "border-forti-red scale-110" : "border-gray-400"
                          }`}
                        >
                          <svg width="26" height="20" viewBox="0 0 26 20">
                            <rect x="1" y="1" width="24" height="14" rx="1" fill="#e5e7eb" stroke="currentColor" strokeWidth="1.5" className={highlighted ? "text-forti-red" : "text-gray-500"} />
                            <rect x="9" y="16" width="8" height="2" fill="currentColor" className={highlighted ? "text-forti-red" : "text-gray-500"} />
                            <rect x="6" y="18" width="14" height="1.5" rx="0.5" fill="currentColor" className={highlighted ? "text-forti-red" : "text-gray-500"} />
                          </svg>
                          {highlighted && (
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-forti-red animate-pulse"></div>
                          )}
                        </div>
                        <div className={`text-[9.5px] font-semibold mt-1 ${highlighted ? "text-forti-red" : "text-gray-700"}`}>
                          {sys.label}
                        </div>
                        <div className="text-[8px] text-gray-400 font-mono">{sys.address.value.split("/")[0]}</div>
                        <ConnectorDot color={zoneDots[zone]} />
                        <div className="w-px h-3" style={{ backgroundColor: zoneDots[zone] }}></div>
                      </div>
                    );
                  })}
                </div>
                <ConnectorDot color={zoneDots[zone]} />
                <div className="w-px h-5" style={{ backgroundColor: zoneDots[zone] }}></div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <div className="border-2 border-forti-red rounded-md px-4 py-2 bg-white flex items-center gap-2 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M9 1.5 15 3.5v5c0 4-3 6.5-6 8-3-1.5-6-4-6-8v-5L9 1.5Z" fill="#fee2e2" stroke="#DA291C" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-bold text-forti-red">FortiGate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
