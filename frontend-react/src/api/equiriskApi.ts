import axios, { AxiosError } from "axios";
import type {
  PriceTradeResponse,
  RunRiskRequest,
  RunRiskResponse,
  ScenarioRequest,
  ScenarioResponse,
  SingleTradeRequest,
  Trade
} from "@/types/equirisk";

export const API_BASE_URL =   import.meta.env.VITE_API_BASE_URL || "/api";

export const equiriskClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function deleteMyTradeByTradeId(tradeId: string): Promise<void> {
  try {
    await equiriskClient.delete(`/portfolio/my-trades/by-trade-id/${tradeId}`);
  } catch (e) {
    handleError(e);
  }
}

equiriskClient.interceptors.request.use((config) => {
   if (typeof window !== "undefined") {
    const token = localStorage.getItem("equirisk_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export class BackendUnreachableError extends Error {
  constructor() {
    super("FastAPI backend is not running on port 8000");
    this.name = "BackendUnreachableError";
  }
}

function handleError(err: unknown): never {
  const ax = err as AxiosError;
  if (ax?.code === "ERR_NETWORK" || ax?.message === "Network Error" || !ax?.response) {
    throw new BackendUnreachableError();
  }
  const detail =
    (ax.response?.data as { detail?: string } | undefined)?.detail ??
    ax.message ??
    "Unknown error";
  throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
}

export async function priceTrade(payload: SingleTradeRequest): Promise<PriceTradeResponse> {
  try {
    const { data } = await equiriskClient.post<PriceTradeResponse>(
      "/pricing/price-trade",
      payload,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function runRisk(payload: RunRiskRequest): Promise<RunRiskResponse> {
  try {
    const { data } = await equiriskClient.post<RunRiskResponse>("/pricing/run-risk", payload);
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function scenarioRisk(payload: ScenarioRequest): Promise<ScenarioResponse> {
  try {
    const { data } = await equiriskClient.post<ScenarioResponse>(
      "/pricing/scenario-risk",
      payload,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    await equiriskClient.get("/health", { timeout: 3000 });
    return true;
  } catch (e) {
    const ax = e as AxiosError;
    // Any HTTP response (even 404) means backend is up
    if (ax?.response) return true;
    return false;
  }
}

export async function getMarketQuote(symbol: string) {
  try {
    const { data } = await equiriskClient.get(`/market/quote/${symbol}`);
    return data;
  } catch (e) {
    handleError(e);
  }
}

export type AuthRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export async function registerUser(payload: AuthRequest): Promise<AuthResponse> {
  try {
    const { data } = await equiriskClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function loginUser(payload: AuthRequest): Promise<AuthResponse> {
  try {
    const { data } = await equiriskClient.post<AuthResponse>(
      "/auth/login",
      payload,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function getMyTrades(): Promise<Trade[]> {
  try {
    const { data } = await equiriskClient.get<Trade[]>("/portfolio/my-trades");
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function saveMyTrade(payload: Trade): Promise<Trade> {
  try {
    const { data } = await equiriskClient.post<Trade>(
      "/portfolio/my-trades",
      payload,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}