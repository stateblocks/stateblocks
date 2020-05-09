import {ActionMapToMethodMap, Effect, Executor, IndexType, ReducerHandler, StatePart} from "./core";
import {handlerWithContext, handlerWithContextBuilder, scopeHandler} from "./handlers";
import {wrapEffectWithActionsMap} from "./effects";

export function executorWithScope<S, C, K extends IndexType<S>>(executor: Executor<S, C>, scope: K): Executor<StatePart<S, K>, C> {

    return (effect: Effect<StatePart<S, K>, C>) => {
        executor((state: S, handler: ReducerHandler<S, C>, ctx: C) => {
            return effect((state as any)[scope], scopeHandler(scope, handler), ctx);
        })
    }

}

export function executorWithContext<S, C = any>(executor: Executor<S, any>, ctx: C): Executor<S, C> {
    return (effect: Effect<S, C>) => {
        executor((state: S, handler: ReducerHandler<S>) => {
            return effect(state, handlerWithContext(handler, ctx), ctx);
        })
    }
}

export function executorWithContextBuilder<S, C = any, CP = any>(executor: Executor<S, CP>, ctxBuilder: (parentCtx: CP) => C): Executor<S, C> {
    return (effect: Effect<S, C>) => {
        //TODO : utiliser wrapEffect ?
        executor((state: S, handler: ReducerHandler<S, CP>, parentCtx: CP) => {
            return effect(state, handlerWithContextBuilder(handler, ctxBuilder), ctxBuilder(parentCtx));
        })
    }
}

export function executorWithActionsContext<S, M>(executor: Executor<S>, actions: M): Executor<S, ActionMapToMethodMap<M>> {
    let effectWrapper = wrapEffectWithActionsMap(actions);
    return (effect: Effect<S, ActionMapToMethodMap<M>>) => {
        //TODO : utiliser wrapEffect ?
        executor(effectWrapper(effect))
    }

}

// export function executorWithState<S, S2, C>(executor: Executor<S, C>, stateMapper: (state:S) => S2): Executor<S2, C> {
//
//     return (effect: Effect<S2, C>) => {
//         executor((state: S, handler: ReducerHandler<S>, ctx:C) => {
//             return effect(stateMapper(state), handler, ctx);
//         })
//     }
//
// }
