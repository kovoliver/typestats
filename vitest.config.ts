import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        disableConsoleIntercept: true,
        onConsoleLog(log, type) {
            return true;
        },
    },
});