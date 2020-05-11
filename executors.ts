import {ActionMapToMethodMap, Effect, Executor, IndexType, ReducerHandler, StatePart} from "./core";
import {mapEffectContext, scopeEffect, wrapEffectWithActionsMap} from "./effects";

export function _executorWithScope<S, C, K extends IndexType<S>>(executor: Executor<S, C>, scope: K): Executor<StatePart<S, K>, C> {
    return mapExecutorEffect(scopeEffect<S, K>(scope))(executor)
}

export function _executorWithContext<C = any>(ctx: C) {
    return mapExecutorEffect(mapEffectContext(() => ctx))
}

export function _executorWithContextBuilder<S, C, CP>(executor: Executor<S, CP>, ctxBuilder: (parentCtx: CP, handler: ReducerHandler<S, CP>) => C): Executor<S, C> {
    return mapExecutorEffect(mapEffectContext(ctxBuilder))(executor)
}


export function _executorWithActionsContext<S, M>(executor: Executor<S>, actions: M): Executor<S, ActionMapToMethodMap<M>> {
    return mapExecutorEffect(wrapEffectWithActionsMap<S, M>(actions))(executor)
}

export function mapExecutorEffect<S0, S1, C0, C1>(effectMapper: (effect: Effect<S0, C0>) => Effect<S1, C1>) {
    return (executor: Executor<S1, C1>) => {
        return (effect: Effect<S0, C0>) => {
            return executor(effectMapper(effect))
        }
    }
}


export function mapExecutorEffectContext<S, C0, C1>(effectMapper: (effect: Effect<S, C0>) => Effect<S, C1>) {
    return (executor: Executor<S, C1>): Executor<S, C0> => {
        return (effect: Effect<S, C0>) => {
            return executor(effectMapper(effect))
        }
    }
}

export function mapExecutorEffectState<S0, S1, C>(effectMapper: (effect: Effect<S0, C>) => Effect<S1, C>) {
    return (executor: Executor<S1, C>): Executor<S0, C> => {
        return (effect: Effect<S0, C>) => {
            return executor(effectMapper(effect))
        }
    }
}

