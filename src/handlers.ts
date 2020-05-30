import {mapReducerExecutorContext, mapReducerState, scopeReducer} from "./reducers";
import {ActionMapToMethodMap, Executor, IndexType, Reducer, ReducerCreator, ReducerHandler, StatePart} from "./core";
import {memoize2, memoizeN} from "./memo";
import {mapExecutorEffectContext} from "./executors";
import {mapEffectContext} from "./effects";
import {mapValues} from "./utils";


function mapActionsValues<T, U, A>(fn: (arg: T) => U, actions: A): { [key in keyof A]: U } {
    // @ts-ignore
    return mapValues(actions, fn);
}


export function scopeHandler<S, T, K extends IndexType<S>, C>(key: K, handler: ReducerHandler<S, C>): ReducerHandler<StatePart<S, K>, C> {
    return (action: Reducer<StatePart<S, K>, C>) => {
        return handler(scopeReducer<S>(key)(action))
    }
}

//TODO : ne devrait pas pouvoir etre appelé avec un handler qui ne correspond pas.
export function handleActionMapInt<M, S, C>(handler: ReducerHandler<S, C>, actionMap: M): ActionMapToMethodMap<M> {
    return mapActionsValues((action: any) => {
        if (typeof action === "function") {
            let memoAction = memoizeN(action);
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
            effects((state, handler, ctx1) => effect(state, handlerWithContext(handler, ctx), ctx))
        })
    });
}


export function _handlerWithContextBuilder<S, C, CP>(handler: ReducerHandler<S, CP>, ctxBuilder: (parentCtx: CP) => C): ReducerHandler<S, C> {
    return mapHandlerContext<S, CP, C>(ctxBuilder)(handler)
}

export function mapHandlerContext<S, C0, C1>(contextMapper: (ctx: C0, handler:ReducerHandler<S, C0>) => C1) {
    return (handler: ReducerHandler<S, C0>): ReducerHandler<S, C1> => {
        return (reducer: Reducer<S, C1>) => {
            return handler(mapReducerExecutorContext(mapExecutorEffectContext(mapEffectContext<S, C0, C1>(contextMapper)))(reducer))
        }
    }
}


export function mapHandlerState<S0, S1>(stateMapper: (state: S0) => S1, stateUpdater: (parentState: S0, state: S1) => S0) {
    return <C>(handler: ReducerHandler<S0, C>): ReducerHandler<S1, C> => {
        return (reducer: Reducer<S1, C>) => {
            return handler(mapReducerState<S0, S1>(stateMapper, stateUpdater)(reducer))
        }
    }
}
