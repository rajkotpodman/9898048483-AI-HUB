import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
    {
        ignores: [".next/**", "dist/**", "python_server_app/**", "node_modules/**"]
    }
];
