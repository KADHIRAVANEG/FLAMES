import React from 'react';

interface NetworkSimCanvasProps {
  addresses: any[];
  traces: any[];
  onClose: () => void;
}

const NetworkSimCanvas: React.FC<NetworkSimCanvasProps> = ({ addresses, traces, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[95%] max-h-[95vh] bg-zinc-950 border border-gray-700 rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 bg-zinc-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <div className="font-semibold">Network Simulation</div>
              <div className="text-xs text-gray-400">Live packet flow visualization</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
          >
            ✕ Close
          </button>
        </div>
        
        <div className="h-full pt-16 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-6xl mb-6 animate-pulse">📡</div>
            <h2 className="text-3xl font-bold mb-4">Network Simulation Canvas</h2>
            <p className="text-gray-400 max-w-md mx-auto">Packets will animate here based on current firewall policy and traces</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NetworkSimCanvas };
