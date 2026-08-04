import { useState, useEffect, useRef, useCallback } from 'react';

export function useLocalAI() {
    const [result, setResult] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'generating' | 'complete' | 'error'>('idle');
    const [progress, setProgress] = useState<any>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.crossOriginIsolated) {
            try {
                workerRef.current = new Worker(new URL('./localAIWorker.ts', import.meta.url), {
                    type: 'module'
                });
            } catch (e) {
                console.warn("Failed to initialize local AI worker:", e);
            }
        }
        
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const generateText = useCallback((text: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error("Local AI Worker requires cross-origin isolation (crossOriginIsolated)."));
                return;
            }
            
            setStatus('generating');
            
            const messageHandler = (e: MessageEvent) => {
                const { status, output, error, progress } = e.data;
                
                if (status === 'progress') {
                    setStatus('loading');
                    setProgress(progress);
                } else if (status === 'complete') {
                    setStatus('complete');
                    const resText = output[0].generated_text;
                    setResult(resText);
                    workerRef.current?.removeEventListener('message', messageHandler);
                    resolve(resText);
                } else if (status === 'error') {
                    setStatus('error');
                    console.error("Local AI Error:", error);
                    workerRef.current?.removeEventListener('message', messageHandler);
                    reject(error);
                }
            };

            workerRef.current.addEventListener('message', messageHandler);
            workerRef.current.postMessage({ type: 'generate', text });
        });
    }, []);

    return { generateText, result, status, progress };
}
