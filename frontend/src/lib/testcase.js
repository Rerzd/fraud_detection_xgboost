// Helpers for the single-transaction test bench: case ids and reproducible requests.

const pad = (n) => String(n).padStart(2, '0')

/** Client-side case id from the run time, e.g. TC-261018-153042. */
export function caseId(date = new Date()) {
  const day = `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `TC-${day}-${time}`
}

/** A cURL command that repeats the request. Single quotes in the body are escaped for the shell. */
export function buildCurl(url, payload) {
  const body = JSON.stringify(payload).replaceAll("'", "'\\''")
  return `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${body}'`
}
