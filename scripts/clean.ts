import { rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
console.log('cleaned dist');
