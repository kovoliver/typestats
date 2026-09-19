import { execSync } from 'child_process';

export function setup() {
    try {
        execSync('npx tsc core/io/ioutils.ts --noEmitOnError false --skipLibCheck --target esnext', {
            stdio: 'ignore'
        });
    } catch {}
}