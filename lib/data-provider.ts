export function usesFirebaseData() {
  return process.env.DATA_PROVIDER !== "sqlite";
}
