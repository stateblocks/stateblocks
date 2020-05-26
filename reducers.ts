import {
    ActionMapToCtx,
    ActionMapToMethodMap,
    Effect,
    Executor,
    IndexType,
    OmitPart,
    Reducer,
    ReducerHandler,
    StatePart,
    updateState,
} from "./core";
import {
    _executorWithContext,
    mapExecutorEffectContext,
    mapExecutorEffectState
} from "./executors";
import {assertFunction} from "./asserts";
import {handlerWithContext} from "./handlers";
import {
    mapEffectState,
    wrapEffectWithActionsMap,
    wrapEffectWithPartialActionMap
} from "./effects";
import {ContextBuilder} from "./actions";

//TODO curry
export function _reducerWithWrappedEffect<S, C0, C>(effectWrapper: (effect: Effect<S, C>) => Effect<S, C0>, reducer: Reducer<S, C>) {
    assertFunction(reducer);
    return mapReducerExecutorContext(mapExecutorEffectContext(effectWrapper))(reducer)
}

export function reducerWithActionsContextPart<M>(ctxActions: M)
    : <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, ActionMapToCtx<M> & OmitPart<C1, ActionMapToMethodMap<M>>> {
    return mapReducerExecutorContext(mapExecutorEffectContext(wrapEffectWithPartialActionMap(ctxActions)));
}

/**
 * Creates a new reducer which updates a part of an object
 * @param key key of the object to update
 * @param reducer reducer of the object part
 */
//TODO : ne pas exporter. Utiliser scopeActions qui prend en charge les reducers directement
export function scopeReducer<S>(key: IndexType<S>) {
    let stateMapper = (state:S) => (state as any)[key] as StatePart<S, typeof key>
    let stateUpdater = (parentState:S, subState:StatePart<S, typeof key>) => updateState(parentState, key, subState);

    return mapReducerState<S, StatePart<S, typeof key>>(stateMapper, stateUpdater)

    // return <C = void>(reducer: Reducer<StatePart<S, typeof key>, C>): Reducer<S, C> => {
    //     return (state: S, effects: Executor<S, C>) => {
    //         assertDefined(state);
    //         assertObject(state);
    //         let scopeExecutor: Executor<StatePart<S, typeof key>, C> = (effect: Effect<StatePart<S, typeof key>, C>) => {
    //             effects(async (state: S, handler, input: C) => {
    //                 assertObject(state);
    //                 assertDefined((state as any)[key]);
    //                 await effect((state as any)[key], scopeHandler(key, handler), input)
    //             })
    //         };
    //         let subState = reducer((state as any)[key], scopeExecutor);
    //         return updateState(state, key, subState);
    //     }
    // }
}

export function reducerWithContextPart<M>(ctx1: M)
    : <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, OmitPart<C1, ActionMapToMethodMap<M>>> {
    let effectWrapper = <S, C1>(effect: Effect<S, C1>) => (state: S, handler: ReducerHandler<S>, ctx: OmitPart<C1, ActionMapToMethodMap<M>>) => {
        let newCtx = {
            ...ctx1, ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };

    // @ts-ignore
    return <S, C1>(reducer: Reducer<S, C1>) => _reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContextBuilderPart<M, C0, C>(ctxBuilder: (ctxIn: C0) => C)
    : <S>(reducer: Reducer<S, C>) => Reducer<S, OmitPart<C0, C>> {
    let effectWrapper = <S>(effect: Effect<S, C>) => (state: S, handler: ReducerHandler<S, C0>, ctx: C0) => {
        let newCtx = {
            ...ctxBuilder(ctx), ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    // @ts-ignore
    return <S>(reducer: Reducer<S, C>) => _reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContextBuilder<C, C0>(ctxBuilder: (ctxIn: C0) => C): <S>(reducer: Reducer<S, C>) => Reducer<S, C0> {
    const effectWrapper = <S>(effect: Effect<S, C>): Effect<S, C0> => (state: S, handler, ctx) => {
        const newCtx = ctxBuilder(ctx);
        return effect(state, handlerWithContext(handler, newCtx), newCtx);
    };
    return <S>(reducer: Reducer<S, C>) => _reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContextBuilderPart2<M, C0, C, S>(ctxBuilder: ContextBuilder<C0, C, S>)
    : (reducer: Reducer<S, C>) => Reducer<S, OmitPart<C0, C>> {
    let effectWrapper = (effect: Effect<S, C>) => (state: S, handler: ReducerHandler<S, C0>, ctx: C0) => {
        let newCtx = {
            ...ctxBuilder(ctx, handler), ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    // @ts-ignore
    return <S>(reducer: Reducer<S, C>) => _reducerWithWrappedEffect(effectWrapper, reducer);
}


export function _reducerWithContext<C>(ctx: C) {
    return mapReducerExecutorContext(_executorWithContext(ctx))
}

export function reducerWithActionsContext<M>(actions: M): <S>(reducer: Reducer<S, ActionMapToMethodMap<M>>) => Reducer<S> {
    return mapReducerExecutorContext(mapExecutorEffectContext(wrapEffectWithActionsMap<any, M>(actions)))
    // return <S>(reducer: Reducer<S, C>) => {
    //     return (state: S, executor: Executor<S, any>) => {
    //         @ts-ignore TODO
            // const executorWithActionsContext1: Executor<S, C> = _executorWithActionsContext(executor, actions);
            // return reducer(state, executorWithActionsContext1);
        // }
    // }
}

export function mapReducerExecutorContext<S, C1, C2>(execMapper:(executor:Executor<S, C1>) => Executor<S, C2>){
    return (reducer:Reducer<S, C2>) => {
        return (state: S, executor:Executor<S, C1>) => {
            return reducer(state, execMapper(executor))
        }
    }
}

export function mapReducerState<S0, S1>(stateMapper:(state:S0) => S1, stateUpdater:(parentState:S0, state:S1) => S0){
    return <C>(reducer:Reducer<S1, C>):Reducer<S0, C> => {
        return (state: S0, executor:Executor<S0, C>) => {
            const newState:S1 = reducer(stateMapper(state), mapExecutorEffectState(mapEffectState(stateMapper, stateUpdater))(executor));
            return stateUpdater(state, newState)
        }
    }
}