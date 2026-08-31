import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'

const certDir = dirname(fileURLToPath(import.meta.url))
const keyPath = join(certDir, 'key.pem')
const certPath = join(certDir, 'cert.pem')
const configPath = join(certDir, 'openssl.cnf')

function findOpenSsl() {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
  ]

  for (const candidate of candidates) {
    if (candidate === 'openssl') {
      try {
        execFileSync(candidate, ['version'], { stdio: 'ignore' })
        return candidate
      } catch {
        continue
      }
    }

    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

function getLocalIPv4() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (
        entry.family === 'IPv4'
        && !entry.internal
        && !entry.address.startsWith('169.254.')
      ) {
        return entry.address
      }
    }
  }

  return '127.0.0.1'
}

const openssl = findOpenSsl()

if (!openssl) {
  console.error('')
  console.error('OpenSSL not found.')
  console.error('Install Git for Windows or OpenSSL, then run: npm run certs:generate')
  console.error('')
  process.exit(1)
}

const localIp = getLocalIPv4()

const config = `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${localIp}

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${localIp}
DNS.1 = localhost
`

writeFileSync(configPath, config, 'utf8')

execFileSync(
  openssl,
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:4096',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-days',
    '365',
    '-nodes',
    '-config',
    configPath,
    '-extensions',
    'v3_req',
  ],
  { stdio: 'inherit', cwd: certDir },
)

console.log('')
console.log('Certificates created:')
console.log(`  ${keyPath}`)
console.log(`  ${certPath}`)
console.log('')
console.log(`Local IP: ${localIp}`)
console.log('')
console.log('Next steps:')
console.log('  1. npm run dev:api')
console.log('  2. npm run dev:https')
console.log(`  3. On phone open: https://${localIp}:5173`)
console.log('')
