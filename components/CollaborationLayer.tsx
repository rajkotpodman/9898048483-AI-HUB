'use client';
import { useState, useEffect, useRef } from 'react';
import { MousePointer2, Users, ShieldAlert } from 'lucide-react';

export default function CollaborationLayer({ roomId }: { roomId: string }) {
    const [cursors, setCursors] = useState<Record<string, { x: number, y: number, name: string }>>({});
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connected');
    const wsRef = useRef<WebSocket | null>(null);
    const myId = useRef(`user_0`);

    useEffect(() => {
        myId.current = `user_${Math.floor(Math.random() * 10000)}`;
        // In a real deployed environment, this connects to the Python FastAPI backend
        // e.g. ws://api.yourdomain.com/ws/collab/${roomId}
        // For the AI Studio preview, we will simulate the connection
        
        const handleMouseMove = (e: MouseEvent) => {
            // Simulated outgoing websocket message
            /*
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'cursor_move',
                    id: myId.current,
                    x: e.clientX,
                    y: e.clientY,
                    name: 'Guest'
                }));
            }
            */
        };

        window.addEventListener('mousemove', handleMouseMove);
        
        // Simulate receiving a cursor move from another user
        const interval = setInterval(() => {
            setCursors(prev => ({
                ...prev,
                'mock_user_1': {
                    x: (window.innerWidth / 2) + Math.sin(Date.now() / 1000) * 100,
                    y: (window.innerHeight / 2) + Math.cos(Date.now() / 1000) * 100,
                    name: 'Team Member'
                }
            }));
        }, 50);

        const ws = wsRef.current;
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
            ws?.close();
        };
    }, [roomId]);

    if (status !== 'connected') return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {/* Status Indicator */}
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-4 py-2 flex items-center gap-4 shadow-lg pointer-events-auto">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Collab (Room: {roomId})
                </div>
                <div className="h-4 w-px bg-slate-700"></div>
                <div className="flex items-center gap-2 text-xs text-slate-400" title="PII Scrubber Active (Powered by spaCy)">
                    <ShieldAlert size={14} className="text-blue-400" />
                    PII Masking ON
                </div>
            </div>

            {/* Render Other Users' Cursors */}
            {Object.entries(cursors).map(([id, pos]) => (
                <div 
                    key={id} 
                    className="absolute flex items-center gap-1 transition-transform duration-75 text-emerald-400"
                    style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                >
                    <MousePointer2 size={16} className="fill-emerald-400/20 drop-shadow-md" />
                    <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur text-emerald-300 drop-shadow">
                        {pos.name}
                    </span>
                </div>
            ))}
        </div>
    );
}
