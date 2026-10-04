import init, { initSync } from '../rust/pkg/rust.js';
export * from '../rust/pkg/rust.js';
const isNode = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
if (isNode) {
    const { readFileSync } = await import('node:fs');
    const wasmUrl = new URL('../rust/pkg/rust_bg.wasm', import.meta.url);
    initSync({ module: readFileSync(wasmUrl) });
}
else {
    await init();
}
