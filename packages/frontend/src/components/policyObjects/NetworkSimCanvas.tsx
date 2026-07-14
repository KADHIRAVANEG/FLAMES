// ============================================================================
// Full-screen network simulation canvas. Renders a Packet-Tracer-style
// topology on an HTML5 canvas and animates test packets traveling from
// source → FortiGate → destination, colored green (ACCEPT) or red (DENY).
// Uses live evaluatePacket results from the student's actual policy config.
// ============================================================================

import { useEffect, useRef, useCallback } from "react";
import type { AddressObject, TestPacket, PolicyTraceEntry } from "@fortisim/engine";

interface SimTrace {
  packet: TestPacket;
  trace: PolicyTraceEntry[];
  finalAction: "ACCEPT" | "DENY";
}

interface NetworkSimCanvasProps {
  addresses: AddressObject[];
  traces: SimTrace[];
  onClose: () => void;
}

interface Node {
  x: number;
  y: number;
  label: string;
  sub: string;
  type: "fw" | "cloud" | "server" | "pc";
  color: string;
  bg: string;
  zone: "WAN" | "LAN" | "DMZ";
}

type NodeMap = Record<string, Node>;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

function inferZone(addr: AddressObject): "WAN" | "LAN" | "DMZ" {
  const v = addr.value.toLowerCase();
  if (v.startsWith("10.0.2") || addr.name.toLowerCase().includes("dmz")) return "DMZ";
  if (v.startsWith("10.0.1") || addr.name.toLowerCase().includes("lan")) return "LAN";
  return "WAN";
}

const ZONE_COLORS: Record<string, string> = { WAN: "#f97316", LAN: "#10b981", DMZ: "#3b82f6" };
const ZONE_BG: Record<string, string> = { WAN: "#fff7ed", LAN: "#ecfdf5", DMZ: "#eff6ff" };

export function NetworkSimCanvas({ addresses, traces, onClose }: NetworkSimCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const packetsRef = useRef<any[]>([]);
  const nodesRef = useRef<NodeMap>({});
  const logRef = useRef<HTMLDivElement>(null);

  function buildNodes(W: number, H: number): NodeMap {
    const cx = W / 2, cy = H / 2;
    const nodes: NodeMap = {
      fw: { x: cx, y: cy, label: "FortiGate", sub: "6000F", type: "fw", color: "#DA291C", bg: "#fee2e2", zone: "LAN" },
    };

    const validAddrs = addresses.filter((a) => a.value !== "0.0.0.0/0" && a.value.toLowerCase() !== "all");
    const byZone: Record<string, AddressObject[]> = { WAN: [], LAN: [], DMZ: [] };
    validAddrs.forEach((a) => byZone[inferZone(a)].push(a));

    const positions: Record<string, { baseX: number; spreadY: number }> = {
      WAN: { baseX: cx - W * 0.35, spreadY: cy - H * 0.05 },
      DMZ: { baseX: cx + W * 0.35, spreadY: cy - H * 0.15 },
      LAN: { baseX: cx + W * 0.35, spreadY: cy + H * 0.1 },
    };

    Object.entries(byZone).forEach(([zone, addrs]) => {
      addrs.forEach((addr, i) => {
        const spread = (i - (addrs.length - 1) / 2) * 60;
        const pos = positions[zone];
        nodes[addr.id] = {
          x: pos.baseX,
          y: pos.spreadY + spread,
          label: addr.name,
          sub: addr.value.split("/")[0],
          type: zone === "WAN" ? "cloud" : addr.name.toLowerCase().includes("server") ? "server" : "pc",
          color: ZONE_COLORS[zone],
          bg: ZONE_BG[zone],
          zone: zone as "WAN" | "LAN" | "DMZ",
        };
      });
    });

    return nodes;
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w,y, x+w,y+h, r);
    ctx.arcTo(x+w,y+h, x,y+h, r);
    ctx.arcTo(x,y+h, x,y, r);
    ctx.arcTo(x,y, x+w,y, r);
    ctx.closePath();
  }

  function drawDevice(ctx: CanvasRenderingContext2D, n: Node, highlight: boolean) {
    const { x, y, label, sub, type, color, bg } = n;
    ctx.save();
    if (highlight) { ctx.shadowColor = color; ctx.shadowBlur = 16; }

    if (type === "fw") {
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = highlight ? color : "#DA291C";
      ctx.lineWidth = highlight ? 2.5 : 2;
      roundRect(ctx, x-42, y-26, 84, 52, 12);
      ctx.fill(); ctx.stroke();
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#DA291C"; ctx.textAlign = "center";
      ctx.fillText("🛡 " + label, x, y - 4);
      ctx.font = "9px sans-serif"; ctx.fillStyle = "#999";
      ctx.fillText(sub, x, y + 10);
    } else if (type === "cloud") {
      ctx.fillStyle = highlight ? bg : "#f1f5f9";
      ctx.strokeStyle = highlight ? color : "#94a3b8";
      ctx.lineWidth = highlight ? 2 : 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 36, 22, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = highlight ? color : "#64748b";
      ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(label, x, y + 34);
      ctx.fillStyle = "#aaa"; ctx.font = "9px monospace";
      ctx.fillText(sub, x, y + 46);
    } else if (type === "server") {
      ctx.fillStyle = bg; ctx.strokeStyle = color;
      ctx.lineWidth = highlight ? 2 : 1.5;
      roundRect(ctx, x-30, y-24, 60, 48, 8);
      ctx.fill(); ctx.stroke();
      [y-10, y, y+10].forEach((ry) => {
        ctx.fillStyle = color; ctx.fillRect(x-16, ry-3, 32, 5);
        ctx.fillStyle = "#fff"; ctx.beginPath();
        ctx.arc(x+10, ry-1, 2, 0, Math.PI*2); ctx.fill();
      });
      ctx.font = "9.5px sans-serif"; ctx.fillStyle = "#444"; ctx.textAlign = "center";
      ctx.fillText(label, x, y + 36);
      ctx.fillStyle = "#aaa"; ctx.font = "8.5px monospace";
      ctx.fillText(sub, x, y + 47);
    } else {
      ctx.fillStyle = bg; ctx.strokeStyle = color;
      ctx.lineWidth = highlight ? 2 : 1.5;
      roundRect(ctx, x-28, y-22, 56, 44, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      roundRect(ctx, x-18, y-14, 36, 22, 3); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(x-3, y+8, 6, 6);
      ctx.fillStyle = color; ctx.fillRect(x-10, y+14, 20, 3);
      ctx.font = "9.5px sans-serif"; ctx.fillStyle = "#444"; ctx.textAlign = "center";
      ctx.fillText(label, x, y + 34);
      ctx.fillStyle = "#aaa"; ctx.font = "8.5px monospace";
      ctx.fillText(sub, x, y + 44);
    }
    ctx.restore();
  }

  function drawCable(ctx: CanvasRenderingContext2D, from: Node, to: Node, color: string) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 - 15;
    ctx.quadraticCurveTo(mx, my, to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    [{ x: from.x, y: from.y }, { x: to.x, y: to.y }].forEach((pt) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(100,100,100,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
  }

  function addLog(msg: string, color: string) {
    if (!logRef.current) return;
    const d = document.createElement("div");
    d.style.color = color;
    d.style.padding = "1px 0";
    d.textContent = "› " + msg;
    logRef.current.appendChild(d);
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const nodes = nodesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fafbfc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    const fw = nodes["fw"];
    Object.entries(nodes).forEach(([k, n]) => {
      if (k !== "fw") drawCable(ctx, fw, n, ZONE_COLORS[n.zone] + "55");
    });

    packetsRef.current.forEach((p) => {
      if (!p.done) {
        ctx.save();
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.fillText(p.svc, p.px, p.py - 12);
        ctx.restore();
      } else if (p.fade > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.fade);
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.fillText(p.finalAction === "ACCEPT" ? "✓" : "✕", p.px, p.py);
        ctx.restore();
      }
    });

    Object.entries(nodes).forEach(([k, n]) => {
      const hl = packetsRef.current.some((p) => p.activeNode === k && !p.done);
      drawDevice(ctx, n, hl);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const W = rect.width;
      const H = Math.max(320, W * 0.48);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.height = H + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      nodesRef.current = buildNodes(W, H);
      draw();
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [addresses, draw]);

  function runSimulation() {
    cancelAnimationFrame(animRef.current);
    packetsRef.current = [];
    if (logRef.current) logRef.current.innerHTML = "";
    addLog("Starting simulation with " + traces.length + " test packets...", "#6b7280");

    const nodes = nodesRef.current;

    traces.forEach((trace, i) => {
      setTimeout(() => {
        const pkt = trace.packet;
        const srcNode = Object.values(nodes).find((n) =>
          n.sub === pkt.srcIp || (pkt.srcIntf === n.zone && n.type === "cloud")
        ) || nodes["fw"];
        const dstNode = Object.values(nodes).find((n) =>
          n.sub === pkt.dstIp
        ) || nodes["fw"];

        const color = trace.finalAction === "ACCEPT" ? "#10b981" : "#ef4444";
        const svc = pkt.protocol + (pkt.port ? `/${pkt.port}` : "") + (pkt.domain ? ` (${pkt.domain})` : "");

        packetsRef.current.push({
          svc, color,
          finalAction: trace.finalAction,
          fx: srcNode.x, fy: srcNode.y,
          tx: dstNode.x, ty: dstNode.y,
          px: srcNode.x, py: srcNode.y,
          t: 0, atFW: false, phase2: false, t2: 0,
          done: false, fade: 0,
          activeNode: null,
        });

        addLog(`Packet ${i+1}: ${pkt.description}`, "#6b7280");

        function animatePkt() {
          const p = packetsRef.current[packetsRef.current.length - 1];
          if (!p || p === packetsRef.current.find((x) => x.svc === svc && x.fx === srcNode.x && !x.done && x.t === 0 && i > 0)) return;
          const allPkt = packetsRef.current;
          const myPkt = allPkt[allPkt.length - traces.length + i + (traces.length - 1)];
        }

        startAnimLoop();
      }, i * 1200);
    });
  }

  function startAnimLoop() {
    function frame() {
      let anyActive = false;
      const nodes = nodesRef.current;
      const fw = nodes["fw"];

      packetsRef.current.forEach((p) => {
        if (p.done) {
          if (p.fade > 0) { p.fade -= 0.015; anyActive = true; }
          return;
        }
        anyActive = true;

        if (!p.atFW) {
          p.t += 0.022;
          if (p.t >= 1) {
            p.t = 1; p.atFW = true;
            p.px = fw.x; p.py = fw.y;
            p.activeNode = "fw";
            addLog(p.svc + " → FortiGate evaluating...", "#f59e0b");
            setTimeout(() => { p.phase2 = true; }, 450);
          } else {
            p.px = lerp(p.fx, fw.x, ease(p.t));
            p.py = lerp(p.fy, fw.y, ease(p.t));
            p.activeNode = null;
          }
        } else if (p.phase2) {
          if (p.finalAction === "ACCEPT") {
            p.t2 += 0.022;
            if (p.t2 >= 1) {
              p.done = true; p.fade = 2;
              p.px = p.tx; p.py = p.ty;
              addLog("✓ ACCEPTED — " + p.svc, "#10b981");
            } else {
              p.px = lerp(fw.x, p.tx, ease(p.t2));
              p.py = lerp(fw.y, p.ty, ease(p.t2));
            }
            p.activeNode = p.t2 >= 1 ? null : "fw";
          } else {
            p.t2 += 0.025;
            p.px = fw.x + Math.sin(p.t2 * 14) * 8 * Math.max(0, 1 - p.t2);
            p.py = fw.y + Math.cos(p.t2 * 10) * 5 * Math.max(0, 1 - p.t2);
            if (p.t2 >= 1) {
              p.done = true; p.fade = 2;
              addLog("✕ DENIED — " + p.svc, "#ef4444");
            }
            p.activeNode = "fw";
          }
        }
      });

      draw();
      if (anyActive) animRef.current = requestAnimationFrame(frame);
    }
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    if (traces.length > 0) runSimulation();
    return () => cancelAnimationFrame(animRef.current);
  }, [traces]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[13px] font-semibold text-gray-800">Network Simulation</span>
            <span className="text-[11px] text-gray-400">FortiGate-6000F (Simulated)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1">×</button>
        </div>

        <canvas ref={canvasRef} className="w-full block" />

        <div
          ref={logRef}
          className="px-4 py-2 font-mono text-[11px] text-gray-500 bg-gray-950 overflow-y-auto"
          style={{ minHeight: 72, maxHeight: 100, color: "#9ca3af" }}
        />

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-[11.5px] text-gray-400">{traces.length} test packets • click × to close</span>
          <button
            onClick={runSimulation}
            className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12px] hover:bg-forti-red/90"
          >
            ▶ Replay
          </button>
        </div>
      </div>
    </div>
  );
}
