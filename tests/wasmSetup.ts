import { readFileSync } from 'node:fs';
import { initSync } from '../rust/pkg/rust.js';

initSync({ module: readFileSync(new URL('../rust/pkg/rust_bg.wasm', import.meta.url)) });