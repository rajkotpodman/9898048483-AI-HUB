// @ts-nocheck
import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are in browser
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
}

class PipelineSingleton {
    static task = 'text-generation';
    static model = 'Xenova/tiny-random-LlamaForCausalLM'; // Use tiny model for quick load
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    try {
        const { text, type } = event.data;
        
        if (type === 'generate') {
            const generator = await PipelineSingleton.getInstance(x => {
                self.postMessage({ status: 'progress', progress: x });
            });
            
            const result = await generator(text, { max_new_tokens: 50 });
            
            self.postMessage({
                status: 'complete',
                output: result,
            });
        }
    } catch (e: any) {
        self.postMessage({ status: 'error', error: e.message });
    }
});
