// One-time setup: backend virtualenv with pinned requirements, then frontend packages.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VENV_PYTHON } from './py.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MIN_PYTHON = [3, 11]
const isWindows = process.platform === 'win32'

function run(command, args, options = {}) {
  console.log(`\n> ${[command, ...args].join(' ')}`)
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: isWindows, ...options })
  if (result.status !== 0) {
    console.error(`\nSetup failed at: ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

function findPython() {
  const candidates = isWindows ? [['py', '-3'], ['python']] : [['python3'], ['python']]
  const check = `import sys; sys.exit(0 if sys.version_info[:2] >= (${MIN_PYTHON}) else 1)`
  for (const [command, ...args] of candidates) {
    const result = spawnSync(command, [...args, '-c', check], { shell: isWindows })
    if (result.status === 0) return [command, ...args]
  }
  console.error(`Python ${MIN_PYTHON.join('.')}+ was not found on PATH.`)
  process.exit(1)
}

if (existsSync(VENV_PYTHON)) {
  console.log('Using existing backend/.venv')
} else {
  const [python, ...args] = findPython()
  run(python, [...args, '-m', 'venv', join('backend', '.venv')])
}

run(VENV_PYTHON, ['-m', 'pip', 'install', '--upgrade', 'pip'], { shell: false })
run(
  VENV_PYTHON,
  ['-m', 'pip', 'install', '-r', join('backend', 'requirements.txt'), '-r', join('backend', 'requirements-dev.txt')],
  { shell: false },
)
run('npm', ['ci', '--prefix', 'frontend'])

console.log('\nSetup complete. Start both servers with `npm run dev`.')
