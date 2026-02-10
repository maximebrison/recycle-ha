import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true,
        port: 5173
    },
    build: { 
        outDir: '../dist',
        emptyOutDir: true,
        lib: { 
            entry: "src/main.js", 
            formats: ["es"], 
            fileName: () => "recycle-ha.js", 
        }, 
            rollupOptions: { 
                output: { 
                    assetFileNames: "style.css", 
                }, 
            }, 
        },
});