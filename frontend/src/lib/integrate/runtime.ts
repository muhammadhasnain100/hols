import { apiRequest } from "@/lib/integrate/client";

export type ApiRuntime = {
  status: string;
  message: string;
  environment: "development" | "production" | string;
  otp_required: boolean;
  payment_required: boolean;
  payment_gateway_bypass: boolean;
};

const DEFAULT_RUNTIME: ApiRuntime = {
  status: "ok",
  message: "",
  environment: "production",
  otp_required: true,
  payment_required: true,
  payment_gateway_bypass: false,
};

let runtimePromise: Promise<ApiRuntime> | null = null;
let runtimeCache: ApiRuntime | null = null;

export function getCachedApiRuntime() {
  return runtimeCache;
}

export function getApiRuntime() {
  if (runtimeCache) return Promise.resolve(runtimeCache);
  if (runtimePromise) return runtimePromise;

  runtimePromise = apiRequest<ApiRuntime>("/api/health")
    .then((value) => {
      runtimeCache = {
        ...DEFAULT_RUNTIME,
        ...value,
        otp_required: value.otp_required !== false,
        payment_required: value.payment_required !== false,
        payment_gateway_bypass: value.payment_gateway_bypass === true,
      };
      return runtimeCache;
    })
    .catch(() => DEFAULT_RUNTIME)
    .finally(() => {
      runtimePromise = null;
    });

  return runtimePromise;
}

export function isDevelopmentRuntime(runtime: ApiRuntime | null | undefined) {
  return runtime?.environment === "development";
}

export function isPaymentGatewayBypassed(runtime: ApiRuntime | null | undefined) {
  return runtime?.payment_gateway_bypass === true || isDevelopmentRuntime(runtime);
}
