export const ACCESS_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_ACCESS_ENABLED === "true",
  password: process.env.NEXT_PUBLIC_ACCESS_PASSWORD ?? "",
  version: process.env.NEXT_PUBLIC_ACCESS_VERSION ?? "1",
};
