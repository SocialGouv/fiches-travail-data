//

export function unwrapEmail(data = ""): string {
  const [k, ...tokens] = Array.from(
    { length: data.length / 2 },
    (_, i) => i * 2
  ).map((val) => parseInt(data.slice(val, val + 2), 16));
  const rawValue = tokens.map((v) => String.fromCharCode(v ^ k)).join("");
  return decodeURIComponent(escape(rawValue));
}
