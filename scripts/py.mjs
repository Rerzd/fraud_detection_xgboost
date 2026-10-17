// Run the backend virtualenv's Python with the given arguments, on any OS.
// Usage: node scripts/py.mjs -m pytest backend/tests
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export const VENV_PYTHON = join(
  ROOT,
  'backend',
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
)

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(VENV_PYTHON)) {
    console.error('backend/.venv not found. Run `npm run setup` first.')
    process.exit(1)
  }
  const child = spawn(VENV_PYTHON, process.argv.slice(2), { cwd: ROOT, stdio: 'inherit' })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
}
