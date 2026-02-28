import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  coinsRouter,
  strategiesRouter,
  tradesRouter,
  aiRouter,
  alertsRouter,
  portfolioRouter,
  exchangesRouter,
  riskRouter,
  configRouter,
  alphaFactorsRouter,
  tradingRouter,
  autoOrderRouter,
  fullAutoRouter,
} from "./featureRouters";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  coins: coinsRouter,
  strategies: strategiesRouter,
  trades: tradesRouter,
  ai: aiRouter,
  alerts: alertsRouter,
  portfolio: portfolioRouter,
  exchanges: exchangesRouter,
  risk: riskRouter,
  config: configRouter,
  alphaFactors: alphaFactorsRouter,
  trading: tradingRouter,
  autoOrder: autoOrderRouter,
  fullAuto: fullAutoRouter,
});

export type AppRouter = typeof appRouter;
