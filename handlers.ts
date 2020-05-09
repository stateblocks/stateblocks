import {scopeReducer} from "./reducers";
import {
    ActionMapToMethodMap,
    Executor,
    IndexType,
    Reducer,
    ReducerCreator,
    ReducerHandler,
    StatePart
} from "./core";
import {memoize2, memoizeN} from "./memo";
import {mapActionsValues} from "./actions";

export function scopeHandler<S, T, K extends IndexType<S>, C>(key: K, handler: ReducerHandler<S, C>): ReducerHandler<StatePart<S, K>, C> {
    return (action: Reducer<StatePart<S, K>, C>) => {
        return handler(scopeReducer<S>(key)(action))
    }
}

//TODO : ne devrait pas pouvoir etre appelé avec un handler qui ne correspond pas.
export function handleActionMapInt<M, S, C>(handler: ReducerHandler<S, C>, actionMap: M): ActionMapToMethodMap<M> {
    return mapActionsValues((action: any) => {
        let memoAction = memoizeN(action);
        if (typeof action === "function") {
            return ((...args: any[]) => {
                const reducerOrActionMap = memoAction(...args);
                if (typeof reducerOrActionMap === "function") {
                    memoAction = action; // we don't want to memoize reducer creators
                    return handler(reducerOrActionMap)
                } else {
                    return handleActionMap(handler, reducerOrActionMap)
                }
            })
        } else {
            return handleActionMap(handler, action)
        }
    }, actionMap) as ActionMapToMethodMap<M>;
}

export const handleActionMap: typeof handleActionMapInt = memoize2(handleActionMapInt);

export function handleAction<A extends any[], S, I>(handler: ReducerHandler<S, I>, reducerCreator: ReducerCreator<A, S, I>): (...args: A) => Promise<void> {
    return (...args: A) => {
        return handler(reducerCreator(...args));
    }
}

export function handle<S, C>(handler: ReducerHandler<S, C>): <A extends any[]>(reducerCreator: ReducerCreator<A, S, C>) => (...args: A) => Promise<void> {
    return <A extends any[]>(reducerCreator: ReducerCreator<A, S, C>) => {
        return handleAction(handler, reducerCreator);
    }
}

export function handlerWithContext<S, C>(actionHandler: ReducerHandler<S, any>, ctx: C): ReducerHandler<S, C> {
    return (reducer: Reducer<S, C>) => actionHandler((state: S, effects: Executor<S>) => {
        return reducer(state, (effect) => {
            effects((state, handler) => effect(state, handlerWithContext(handler, ctx), ctx))
        })
    });
}

export function handlerWithContextBuilder<S, C, CP>(actionHandler: ReducerHandler<S, CP>, ctxBuilder: (parentCtx: CP) => C): ReducerHandler<S, C> {
    return (reducer: Reducer<S, C>) => actionHandler((state: S, executor: Executor<S, CP>) => {
        return reducer(state, (effect) => {
            executor((state: S, handler: ReducerHandler<S, CP>, parentCtx: CP) =>
                effect(state, handlerWithContextBuilder(actionHandler, ctxBuilder), ctxBuilder(parentCtx)))
        })
    });
}