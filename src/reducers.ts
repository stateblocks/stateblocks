import {
    ActionMapToCtxIntersection,
    ActionMapToMethodMap,
    Effect,
    Executor,
    IndexType, OmitPart,
    Reducer,
    StatePart,
    updateState,
} from "./core";
import {
    _executorWithContext,
    mapExecutorEffectContext,
    mapExecutorEffectState
} from "./executors";
import {assertFunction} from "./asserts";
import {
    mapEffectContext,
    mapEffectState,
    wrapEffectWithActionsMap,
    wrapEffectWithPartialActionMap
} from "./effects";
import {ContextBuilder} from "./actions";
import {extendContext, extendContextValue} from "./context";

//TODO curry
export function _mapReducerEffect<S, C0, C>(effectMapper: (effect: Effect<S, C>) => Effect<S, C0>, reducer: Reducer<S, C>) {
    assertFunction(reducer);
    return mapReducerExecutorContext(mapExecutorEffectContext(effectMapper))(reducer)
}

export function reducerWithActionsContextPart<M>(ctxActions: M)
    : <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, ActionMapToCtxIntersection<M> & OmitPart<C1, ActionMapToMethodMap<M>>> {
    return mapReducerExecutorContext(mapExecutorEffectContext(wrapEffectWithPartialActionMap(ctxActions)));
}

/**
 * Creates a new reducer which updates a part of an object
 * @param key key of the object to update
 * @param reducer reducer of the object part
 */
//TODO : ne pas exporter. Utiliser scopeActions qui prend en charge les reducers directement
export function scopeReducer<S>(key: IndexType<S>) {
    let stateMapper = (state: S) => (state as any)[key] as StatePart<S, typeof key>
    let stateUpdater = (parentState: S, subState: StatePart<S, typeof key>) => updateState(parentState, key, subState);
    return mapReducerState<S, StatePart<S, typeof key>>(stateMapper, stateUpdater)
}

export function reducerWithContextPart<C>(ctx1: C): <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, OmitPart<C1, C>> {
    // @ts-ignore
    return <S, C1>(reducer: Reducer<S, C1>) => _mapReducerContext(extendContextValue(ctx1))(reducer as any);
}

export function reducerWithContextBuilderPart<M, C0, C>(ctxBuilder: (ctxIn: C0) => C)
    : <S>(reducer: Reducer<S, C>) => Reducer<S, OmitPart<C0, C>>
export function reducerWithContextBuilderPart<M, C0, C1, S>(ctxBuilder: ContextBuilder<C0, C1, S>)
    : <C>(reducer: Reducer<S, C>) => Reducer<S, C0 & OmitPart<C, C1>> {

    return <C>(reducer: Reducer<S, C>) => _mapReducerEffect(mapEffectContext(extendContext(ctxBuilder)) as any, reducer);
}

export function _mapReducerContext<C, C0>(ctxMapper: (ctxIn: C0) => C): <S>(reducer: Reducer<S, C>) => Reducer<S, C0> {
    return <S>(reducer: Reducer<S, C>) => _mapReducerEffect(mapEffectContext(ctxMapper), reducer);
}

export function _reducerWithContext<C>(ctx: C) {
    return mapReducerExecutorContext(_executorWithContext(ctx))
}

export function reducerWithActionsContext<M>(actions: M): <S>(reducer: Reducer<S, ActionMapToMethodMap<M>>) => Reducer<S> {
    return mapReducerExecutorContext(mapExecutorEffectContext(wrapEffectWithActionsMap<any, M>(actions)))
}

export function mapReducerExecutorContext<S, C1, C2>(execMapper: (executor: Executor<S, C1>) => Executor<S, C2>) {
    return (reducer: Reducer<S, C2>) => {
        return (state: S, executor: Executor<S, C1>) => {
            return reducer(state, execMapper(executor))
        }
    }
}

export function mapReducerState<S0, S1>(stateMapper: (state: S0) => S1, stateUpdater: (parentState: S0, state: S1) => S0) {
    return <C>(reducer: Reducer<S1, C>): Reducer<S0, C> => {
        return (state: S0, executor: Executor<S0, C>) => {
            const newState: S1 = reducer(stateMapper(state), mapExecutorEffectState(mapEffectState(stateMapper, stateUpdater))(executor));
            return stateUpdater(state, newState)
        }
    }
}