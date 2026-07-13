import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchScenarioList } from "../api/client";
import { ALL_INTERFACE_SCENARIOS, ALL_PORT_SCENARIOS } from "@fortisim/engine";
import { ScenarioSession } from "../hooks/useScenarioSession";

interface TasksPageProps {
  session: ScenarioSession;
}

interface TaskEntry {
  id: string;
  title: string;
  description: string;
  track: "policy" | "interface" | "port";
  difficulty: number;
}

const TRACK_META = {
  port: { label: "Port Assignment", dot: "bg-emerald-500", icon: "🔌" },
  interface: { label: "Interface Config", dot: "bg-blue-500", icon: "⚙️" },
  policy: { label: "Firewall Policy", dot: "bg-forti-red", icon: "🛡️" },
};

function DifficultyStars({ level, max = 5 }: { level: number; max?: number }) {
  const stars = Math.round((level / 10) * max);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < stars ? "bg-amber-400" : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

export function TasksPage({ session }: TasksPageProps) {
  const navigate = useNavigate();
  const [policyScenarios, setPolicyScenarios] = useState<{ id: string; title: string; description: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchScenarioList()
      .then(setPolicyScenarios)
      .catch((err) => setError(err.message ?? "Failed to load tasks"));
  }, []);

  if (error) return <div className="text-red-600 text-[12.5px]">{error}</div>;
  if (!policyScenarios) return <div className="text-gray-500 text-[12.5px]">Loading tasks…</div>;

  const ps = policyScenarios;
  const tasks: TaskEntry[] = [
    { id: ALL_PORT_SCENARIOS[0].id, title: ALL_PORT_SCENARIOS[0].title, description: ALL_PORT_SCENARIOS[0].description, track: "port", difficulty: 1 },
    { id: ALL_INTERFACE_SCENARIOS[0].id, title: ALL_INTERFACE_SCENARIOS[0].title, description: ALL_INTERFACE_SCENARIOS[0].description, track: "interface", difficulty: 1 },
    { id: ALL_INTERFACE_SCENARIOS[1].id, title: ALL_INTERFACE_SCENARIOS[1].title, description: ALL_INTERFACE_SCENARIOS[1].description, track: "interface", difficulty: 2 },
    { id: ALL_PORT_SCENARIOS[1].id, title: ALL_PORT_SCENARIOS[1].title, description: ALL_PORT_SCENARIOS[1].description, track: "port", difficulty: 2 },
    { id: ps[0]?.id, title: ps[0]?.title, description: ps[0]?.description, track: "policy", difficulty: 3 },
    { id: ALL_PORT_SCENARIOS[2].id, title: ALL_PORT_SCENARIOS[2].title, description: ALL_PORT_SCENARIOS[2].description, track: "port", difficulty: 3 },
    { id: ps[1]?.id, title: ps[1]?.title, description: ps[1]?.description, track: "policy", difficulty: 4 },
    { id: ALL_INTERFACE_SCENARIOS[2].id, title: ALL_INTERFACE_SCENARIOS[2].title, description: ALL_INTERFACE_SCENARIOS[2].description, track: "interface", difficulty: 4 },
    { id: ps[2]?.id, title: ps[2]?.title, description: ps[2]?.description, track: "policy", difficulty: 5 },
    { id: ALL_PORT_SCENARIOS[3].id, title: ALL_PORT_SCENARIOS[3].title, description: ALL_PORT_SCENARIOS[3].description, track: "port", difficulty: 5 },
    { id: ps[3]?.id, title: ps[3]?.title, description: ps[3]?.description, track: "policy", difficulty: 6 },
    { id: ALL_PORT_SCENARIOS[4].id, title: ALL_PORT_SCENARIOS[4].title, description: ALL_PORT_SCENARIOS[4].description, track: "port", difficulty: 6 },
    { id: ps[4]?.id, title: ps[4]?.title, description: ps[4]?.description, track: "policy", difficulty: 7 },
    { id: ps[5]?.id, title: ps[5]?.title, description: ps[5]?.description, track: "policy", difficulty: 8 },
    { id: ps[6]?.id, title: ps[6]?.title, description: ps[6]?.description, track: "policy", difficulty: 8 },
    { id: ps[7]?.id, title: ps[7]?.title, description: ps[7]?.description, track: "policy", difficulty: 9 },
    { id: ps[8]?.id, title: ps[8]?.title, description: ps[8]?.description, track: "policy", difficulty: 9 },
    { id: ps[9]?.id, title: ps[9]?.title, description: ps[9]?.description, track: "policy", difficulty: 10 },
  ].filter((t) => t.id).sort((a, b) => a.difficulty - b.difficulty);

  const completedCount = tasks.filter((t) => session.completedTaskIds.has(t.id)).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const trackGroups: Record<string, TaskEntry[]> = { port: [], interface: [], policy: [] };
  tasks.forEach((t) => trackGroups[t.track].push(t));

  function handleSelect(task: TaskEntry) {
    if (task.track === "policy") {
      session.selectScenario(task.id);
      navigate("/policy/firewall-policy");
    } else {
      navigate(`/network/interfaces?track=${task.track}&scenario=${task.id}`);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-forti-dark mb-1">FortiSim Training Tasks</h1>
        <p className="text-gray-500 text-[12.5px]">Complete exercises across three tracks to master FortiGate firewall configuration.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-gray-700">Overall Progress</span>
          <span className="text-[13px] font-bold text-forti-red">{completedCount} / {tasks.length} completed</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-forti-red rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          {(["port", "interface", "policy"] as const).map((track) => {
            const meta = TRACK_META[track];
            const done = trackGroups[track].filter((t) => session.completedTaskIds.has(t.id)).length;
            return (
              <div key={track} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <div className={`w-2 h-2 rounded-full ${meta.dot}`}></div>
                {meta.label}: {done}/{trackGroups[track].length}
              </div>
            );
          })}
        </div>
      </div>

      {(["port", "interface", "policy"] as const).map((track) => {
        const meta = TRACK_META[track];
        const trackTasks = trackGroups[track];
        const done = trackTasks.filter((t) => session.completedTaskIds.has(t.id)).length;
        const isCollapsed = collapsed[track];

        return (
          <div key={track} className="mb-4">
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [track]: !prev[track] }))}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{meta.icon}</span>
                <div className="text-left">
                  <div className="text-[13.5px] font-semibold text-gray-800">{meta.label}</div>
                  <div className="text-[11px] text-gray-400">{done}/{trackTasks.length} completed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${(done / trackTasks.length) * 100}%` }} />
                </div>
                <span className="text-gray-400 text-[12px]">{isCollapsed ? "▶" : "▼"}</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="border border-t-0 border-gray-200 rounded-b-md overflow-hidden">
                {trackTasks.map((task, idx) => {
                  const completed = session.completedTaskIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleSelect(task)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${completed ? "bg-emerald-50 hover:bg-emerald-100" : "bg-white hover:bg-gray-50"}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${completed ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {completed ? "✓" : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[13px] font-medium ${completed ? "text-emerald-700" : "text-gray-800"}`}>{task.title}</span>
                          <DifficultyStars level={task.difficulty} />
                          {completed && <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">Completed</span>}
                        </div>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed line-clamp-2">{task.description}</p>
                      </div>
                      <div className="shrink-0 text-gray-300 text-[12px] mt-1">›</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
