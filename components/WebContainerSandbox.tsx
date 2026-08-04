'use client';

import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { Loader2, Play, TerminalSquare, AlertTriangle } from 'lucide-react';

let webcontainerPromise: Promise<WebContainer> | null = null;

export default function WebContainerSandbox({ code }: { code: string }) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
    const [iframeUrl, setIframeUrl] = useState<string>('');
    const [booting, setBooting] = useState(false);
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const termRef = useRef<Terminal | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
            setIsSupported(false);
            return;
        }

        let fitAddon: FitAddon;
        let term: Terminal;
        
        const initContainer = async () => {
            if (!terminalRef.current) return;
            
            try {
                setBooting(true);
                
                term = new Terminal({ convertEol: true, theme: { background: '#0f172a' } });
                termRef.current = term;
                fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.open(terminalRef.current);
                
                // Avoid "reading 'dimensions'" error by checking dimensions and using requestAnimationFrame / setTimeout
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
                            try {
                                fitAddon.fit();
                            } catch (e) {
                                console.warn("Could not fit terminal", e);
                            }
                        }
                    }, 100);
                });
                
                term.write('Booting WebContainer...\r\n');
                
                if (!webcontainerPromise) {
                    webcontainerPromise = WebContainer.boot();
                }
                const instance = await webcontainerPromise;
                
                setWebcontainerInstance(instance);
                
                instance.on('server-ready', (port, url) => {
                    setIframeUrl(url);
                    term.write(`\r\nServer ready at ${url}\r\n`);
                });
                
                term.write('WebContainer booted successfully.\r\n');
                
                // Mount files
                await instance.mount({
                    'index.js': {
                        file: {
                            contents: code || 'console.log("Hello WebContainer!");'
                        }
                    },
                    'package.json': {
                        file: {
                            contents: JSON.stringify({
                                name: "ai-generated-app",
                                type: "module",
                                dependencies: {
                                    "express": "latest"
                                },
                                scripts: {
                                    "start": "node index.js"
                                }
                            })
                        }
                    }
                });
                
                term.write('Installing dependencies...\r\n');
                const installProcess = await instance.spawn('npm', ['install']);
                
                installProcess.output.pipeTo(new WritableStream({
                    write(data) {
                        term.write(data);
                    }
                }));
                
                await installProcess.exit;
                term.write('\r\nDependencies installed. You can now run the app.\r\n');
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to boot WebContainer');
                term?.write(`\r\nError: ${err.message}\r\n`);
            } finally {
                setBooting(false);
            }
        };

        initContainer();

        return () => {
            term?.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const runScript = async () => {
        if (!webcontainerInstance) return;
        
        // Update code file before running
        await webcontainerInstance.fs.writeFile('/index.js', code);
        
        const process = await webcontainerInstance.spawn('npm', ['start']);
        process.output.pipeTo(new WritableStream({
            write(data) {
                termRef.current?.write(data);
            }
        }));
    };

    if (!isSupported) {
        return (
            <div className="flex flex-col h-[300px] border border-amber-500/30 rounded-xl overflow-hidden bg-slate-900 p-6 items-center justify-center text-center shadow-2xl">
                <div className="bg-amber-500/20 text-amber-400 p-4 rounded-2xl mb-4 border border-amber-500/30">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cross-Origin Isolation Required</h3>
                <p className="text-sm text-slate-300 max-w-md">
                    WebContainers CI/CD requires Cross-Origin Isolation headers. Preview mode is disabled in this frame, but code can still be edited and exported.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
            <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                    <TerminalSquare size={16} /> WebAssembly Sandbox
                </div>
                <button 
                    onClick={runScript}
                    disabled={!webcontainerInstance || booting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
                >
                    {booting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {booting ? 'Booting Node.js...' : 'Run Code'}
                </button>
            </div>
            
            <div className="flex-1 flex min-h-0">
                <div className="w-1/2 h-full p-2 bg-[#0f172a]">
                    <div ref={terminalRef} className="h-full w-full" />
                </div>
                <div className="w-1/2 h-full bg-white border-l border-slate-700">
                    {iframeUrl ? (
                        <iframe src={iframeUrl} className="w-full h-full border-0" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                            Preview will appear here when server starts
                        </div>
                    )}
                </div>
            </div>
            {error && <div className="p-2 bg-red-900/50 text-red-400 text-xs">{error}</div>}
        </div>
    );
}
