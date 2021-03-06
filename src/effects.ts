import {mapHandlerContext, mapHandlerState} from "./handlers";
import {
    ActionMapToCtxIntersection,
    ActionMapToMethodMap,
    Effect,
    IndexType, OmitPart,
    ReducerHandler,
    StatePart,
    updateState,
} from "./core";
import {contextWithActions, contextWithActionsPart} from "./context";

export function wrapEffectWithActionsMap<S, M>(actions: M): (effect: Effect<S, ActionMapToMethodMap<M>>) => Effect<S, ActionMapToCtxIntersection<M>> {
    return mapEffectContext(contextWithActions(actions));
}


export function wrapEffectWithPartialActionMap<M>(actions: M):  <S, C>(effect: Effect<S, C>) => Effect<S, ActionMapToCtxIntersection<M> & OmitPart<C, ActionMapToMethodMap<M>>>  {
    return mapEffectContext(contextWithActionsPart(actions)) as any;
}


export function scopeEffect<S, K extends IndexType<S>>(key: K):<C>(effect: Effect<StatePart<S, K>, C>) => Effect<S, C> {
    let stateMapper = (state:S) => (state as any)[key] as StatePart<S, typeof key>
    let stateUpdater = (parentState:S, subState:StatePart<S, typeof key>) => updateState(parentState, key, subState);
    return mapEffectState(stateMapper, stateUpdater)
}

export function mapEffectContext<S, C0, C1>(ctxMapper: (parentCtx: C0, handler: ReducerHandler<S, C0>) => C1)
    : (effect: Effect<S, C1>) => Effect<S, C0> {
    return (effect: Effect<S, C1>) => {
        return (state: S, handler: ReducerHandler<S, C0>, ctx: C0) => {
            return effect(state, mapHandlerContext<S, C0, C1>(ctxMapper)(handler), ctxMapper(ctx, handler));
        }
    }
}

export function mapEffectState<S0, S1>(stateMapper: (state: S0) => S1, stateUpdater: (parentState: S0, state: S1) => S0)
    : <C>(effect: Effect<S1, C>) => Effect<S0, C> {
    return <C>(effect: Effect<S1, C>): Effect<S0, C> => {
        return (state: S0, handler: ReducerHandler<S0, C>, ctx: C) => {
            return effect(stateMapper(state), mapHandlerState(stateMapper, stateUpdater)(handler), ctx);
        }
    }
}