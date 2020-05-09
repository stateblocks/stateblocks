import {
    ActionMapToMethodMap,
    ContextToActionMap,
    Effect,
    Executor,
    FunctionsContext,
    IndexType,
    Reducer,
    ReducerHandler,
    StatePart,
    updateState,
    WithoutOrVoid
} from "./core";
import {executorWithActionsContext, executorWithContext} from "./executors";
import {assertDefined, assertFunction, assertObject} from "./asserts";
import {handleActionMap, handlerWithContext, scopeHandler} from "./handlers";

//TODO curry
export function reducerWithWrappedEffect<S, C0, C, A>(effectWrapper: (effect: Effect<S, C>) => Effect<S, C0>, reducer: Reducer<S, C>) {
    assertFunction(reducer);
    return (state: S, executor: Executor<S, C0>) => {
        const contextExecutor = (effect: Effect<S, C>) => {
            executor(effectWrapper(effect));
        };
        return reducer(state, contextExecutor)
    };
}

export function reducerWithActionsContextPart<M>(ctxActions: M)
    : <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, WithoutOrVoid<C1, ActionMapToMethodMap<M>>> {
    let effectWrapper = <S, C1>(effect: Effect<S, C1>) => (state: S, handler: ReducerHandler<S>, ctx: WithoutOrVoid<C1, ActionMapToMethodMap<M>>) => {
        let ctxFromActions = handleActionMap(handler, ctxActions);
        let newCtx = {
            ...ctxFromActions, ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    // @ts-ignore
    return <S, C1>(reducer: Reducer<S, C1>) => reducerWithWrappedEffect(effectWrapper, reducer);
}

/**
 * Creates a new reducer which updates a part of an object
 * @param key key of the object to update
 * @param reducer reducer of the object part
 */
//TODO : ne pas exporter. Utiliser scopeActions qui prend en charge les reducers directement
export function scopeReducer<S>(key: IndexType<S>) {
    return <C = void>(reducer: Reducer<StatePart<S, typeof key>, C>): Reducer<S, C> => {
        return (state: S, effects: Executor<S, C>) => {
            assertDefined(state);
            assertObject(state);
            let scopeExecutor: Executor<StatePart<S, typeof key>, C> = (effect: Effect<StatePart<S, typeof key>, C>) => {
                effects(async (state: S, handler, input: C) => {
                    assertObject(state);
                    assertDefined((state as any)[key]);
                    await effect((state as any)[key], scopeHandler(key, handler), input)
                })
            };
            let subState = reducer((state as any)[key], scopeExecutor);
            return updateState(state, key, subState);
        }
    }
}

export function reducerWithContextPart<M>(ctx1: M)
    : <S, C1>(reducer: Reducer<S, C1>) => Reducer<S, WithoutOrVoid<C1, ActionMapToMethodMap<M>>> {
    let effectWrapper = <S, C1>(effect: Effect<S, C1>) => (state: S, handler: ReducerHandler<S>, ctx: WithoutOrVoid<C1, ActionMapToMethodMap<M>>) => {
        let newCtx = {
            ...ctx1, ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };

    // @ts-ignore
    return <S, C1>(reducer: Reducer<S, C1>) => reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContextBuilderPart<M, C0, C>(ctxBuilder: (ctxIn: C0) => C)
    : <S>(reducer: Reducer<S, C>) => Reducer<S, WithoutOrVoid<C0, C>> {
    let effectWrapper = <S>(effect: Effect<S, C>) => (state: S, handler: ReducerHandler<S, C0>, ctx: C0) => {
        let newCtx = {
            ...ctxBuilder(ctx), ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    // @ts-ignore
    return <S>(reducer: Reducer<S, C>) => reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContextBuilder<C, C0>(ctxBuilder: (ctxIn: C0) => C): <S>(reducer: Reducer<S, C>) => Reducer<S, C0> {
    const effectWrapper = <S>(effect: Effect<S, C>): Effect<S, C0> => (state: S, handler, ctx) => {
        const newCtx = ctxBuilder(ctx);
        return effect(state, handlerWithContext(handler, newCtx), newCtx);
    };
    return <S>(reducer: Reducer<S, C>) => reducerWithWrappedEffect(effectWrapper, reducer);
}

export function reducerWithContext<C>(ctx: C) {
    return <S>(reducer: Reducer<S, C>) => {
        return (state: S, executor: Executor<S>) => {
            return reducer(state, executorWithContext(executor, ctx))
        }
    };
}

export function reducerWithActionsContext<S, C extends FunctionsContext>(actions: ContextToActionMap<C>) {
    return <S>(reducer: Reducer<S, C>) => {
        return (state: S, executor: Executor<S, any>) => {
            // @ts-ignore TODO
            const executorWithActionsContext1: Executor<S, C> = executorWithActionsContext(executor, actions);
            return reducer(state, executorWithActionsContext1);
        }
    }
}