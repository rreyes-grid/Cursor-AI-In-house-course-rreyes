/**
 * Vite 7 requires: ^20.19.0 || >=22.12.0
 * Mirrors node_modules/vite/package.json engines field.
 */

function satisfiesVite7(versionString) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(versionString)
  if (!m) return false
  const major = Number(m[1])
  const minor = Number(m[2])
  const patch = Number(m[3])

  /** Current Node >= (maj, mn, pt) inclusive. */
  function ge(ma, mn, pt) {
    return (
      major > ma ||
      (major === ma && minor > mn) ||
      (major === ma && minor === mn && patch >= pt)
    )
  }

  if (major >= 23) return true
  if (major === 22 && ge(22, 12, 0)) return true
  if (major === 20 && ge(20, 19, 0)) return true
  return false
}

const v = process.version
if (!satisfiesVite7(v)) {
  console.error(
    [
      '',
      `  Node.js mismatch: This project targets Vite 7 (needs ^20.19.0 or >=22.12.0).`,
      `  You are running: ${v}`,
      `  Fix: install Node 22 LTS or run \`nvm use\` (see .nvmrc), then retry \`npm run build\`.`,
      '',
    ].join('\n'),
  )
  process.exit(1)
}
