export function match(params : string) {
  return /^[a-fA-F0-9]{64}$/.test(params);
}
