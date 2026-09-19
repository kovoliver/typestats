import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        silent: false,
        globalSetup: ['./tests/globalSetup.ts'],
        onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
            return true;
        },
    },
});