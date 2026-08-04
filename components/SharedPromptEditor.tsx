'use client';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export default function SharedPromptEditor({ roomId }: { roomId: string }) {
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const [status, setStatus] = useState('disconnected');
    const ydocRef = useRef<Y.Doc>(null);
    const ytextRef = useRef<Y.Text>(null);
    const providerRef = useRef<WebsocketProvider>(null);

    useEffect(() => {
        // Initialize Yjs Document
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Create a shared text type
        const ytext = ydoc.getText('shared-prompt');
        ytextRef.current = ytext;

        // Connect to a public y-websocket server (for preview purposes)
        // In production, this would be your FastAPI backend with a custom Yjs connector
        const provider = new WebsocketProvider('wss://demos.yjs.dev', `ai-hub-${roomId}`, ydoc);
        providerRef.current = provider;

        provider.on('status', (event: { status: string }) => {
            setStatus(event.status);
        });

        // Sync Yjs text to local textarea (simple one-way for this example)
        ytext.observe(() => {
            if (editorRef.current) {
                // To do this perfectly requires cursor position management, 
                // but this is a simplified mock of CRDT syncing.
                editorRef.current.value = ytext.toString();
            }
        });

        return () => {
            provider.destroy();
            ydoc.destroy();
        };
    }, [roomId]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const ytext = ytextRef.current;
        const ydoc = ydocRef.current;
        
        if (ytext && ydoc) {
            // Simplified: delete all and insert new. 
            // In a real editor, you compute deltas to preserve cursor.
            ydoc.transact(() => {
                ytext.delete(0, ytext.length);
                ytext.insert(0, newValue);
            });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    CRDT Shared Prompt <span className="text-[10px] text-blue-400 ml-2">(Yjs)</span>
                </label>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {status}
                </div>
            </div>
            <textarea 
                ref={editorRef}
                onChange={handleChange}
                placeholder="Type a prompt collaboratively... (Try opening two tabs)"
                className="w-full h-24 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
            />
        </div>
    );
}
