import {mapValues as lodashMapValues, memoize} from "lodash-es";
import {assertDefined, assertFunction, assertObject} from "./asserts";


export type Reducer<S, C = void> = (state: S, executor?: Executor<S, C>) => S

/**
 * An executor is a function taking an effect to execute. The effect may require a part of the executor context,
 * or no context at all
 */
export type Executor<S, C = void> = (effect: Effect<S, C>) => void;

export type Effect<S, C> = (state: S, handler: ReducerHandler<S, C>, ctx: C) => Promise<void> | void;

export type ReducerCreator<A extends any[], S, C = void> = (...args: A) => Reducer<S, C>

export type ReducerHandler<S, C = void> = (reducer: Reducer<S, C>) => Promise<void>

export type ReducerCreatorWithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S, void> : never

export type ContextEraser<R> = (action: R) => ReducerCreatorWithoutContext<R>

export type FunctionsContext = { [key: string]: (...args: any) => void | Promise<void> }

export type ContextToActionMap<C> = { [K in keyof C]: (...args: any) => any }


type StatePart<S, K extends IndexType<S>> = S extends Array<infer T> ? T :
    K extends keyof S ? S[K] : never

type IndexType<S> = S extends any[] ? number : keyof S;


type WithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S> : never;

export type ReducerMapWithoutContext<R> = { [P in keyof R]: WithoutContext<R[P]> }

export type ActionMap<S, C> = { [key: string]: (ReducerCreator<any[], S, C> | ((...args: any[]) => ActionMap<S, C>)) | ActionMap<S, C> }

export type ActionToMethod<A> =
    A extends (...args: any) => any ?
        ReturnType<A> extends (...args: any) => any ?
            (...args: Parameters<A>) => Promise<void>
            : (...args: Parameters<A>) => ActionMapToMethodMap<ReturnType<A>>
        : A extends Object ?
        ActionMapToMethodMap<A>
        : never

export type ActionMapToMethodMap<M> = { [K in keyof M]: ActionToMethod<M[K]> }

export type ActionMapToCtx<M> = M extends ActionMap<infer S, infer C> ? C : never

type ActionWithState<T, S> = T extends ReducerCreator<infer A, infer S1, infer C> ?
    ReducerCreator<A, S, C>
    :
    T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithState<ReturnType<T>, S>
        :
        { [K in keyof T]: ActionWithState<T[K], S> }

export type ActionMapWithState<M, S> = ActionWithState<M, S>

type ActionWithCtx<T, C> = T extends ReducerCreator<infer A, infer S, infer C1> ?
    ReducerCreator<A, S, C>
    : T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithCtx<ReturnType<T>, C>
        : { [K in keyof T]: ActionWithCtx<T[K], C> }

export type ActionMapWithCtx<M, C> = ActionWithCtx<M, C>

type ActionWithReducer<T, R1, R2> = T extends (...args: infer A) => R1 ?
    (...args: A) => R2
    :
    T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithReducer<ReturnType<T>, R1, R2>
        : { [K in keyof T]: ActionWithReducer<T, R1, R2> }

export type ActionMapWithReducer<M, R1, R2> = ActionWithReducer<M, R1, R2>

type AsActionMapItem<T> = T extends ReducerCreator<infer A, infer S, infer C> ?
    ReducerCreator<A, S, C>
    : T extends (...args: any[]) => Object ?
        AsActionMap<ReturnType<T>>
        : AsActionMap<T>

type AsActionMap<M> = { [K in keyof M]: AsActionMapItem<M[K]> }

export function mapActionsValues<T, U, A>(fn: (arg: T) => U, actions: A): { [key in keyof A]: U } {
    // console.warn("use mapActionsReducers instead of mapActionsValues");
    // @ts-ignore
    return lodashMapValues(actions, fn);
}


export function mapActionsReducers<T, U, A>(reducerTransformer: (reducer: T) => U, actions: A): ActionMapWithReducer<A, T, U> {
    if (typeof actions !== "function") {
        // @ts-ignore
        return lodashMapValues(actions as Object, item => mapActionsReducers(reducerTransformer, item));
    } else {
        // @ts-ignore
        return (...args: any) => {
            let mapItemOutput: any = actions(...args);
            if (typeof mapItemOutput === "function") {
                //it's a reducer
                return reducerTransformer(mapItemOutput)
            } else {
                // mapItemOutput is an action map
                // @ts-ignore
                return lodashMapValues(mapItemOutput, item => mapActionsReducers(reducerTransformer, item));
            }
        };
    }
}

//TODO : permettre de fournir un context builder qui renvoie le contexte correspondant au scope
export function scopeActions<S>(): <M>(actions: M) => (key: IndexType<S>) => ActionMapWithState<M, S>
export function scopeActions<S>(key: IndexType<S>): <M>(actions: M) => ActionMapWithState<M, S>
export function scopeActions<S>(key?: any): any {
    if (key != null) {
        let k = key as IndexType<S>;
        // @ts-ignore
        return <M>(actions: M) => mapActionsReducers(scopeReducer<S>(k), actions) as ActionMapWithState<M, S>;
    } else {
        return createScopedActionMap<S>()
    }
}

const createScopedActionMap: <S>() => <M>(actions: M) => (key: IndexType<S>) => ActionMapWithState<M, S> =
    //We curry this function to benefit from type inference on actions argument
    <S>() =>
        <M>(actions: M) =>
            (key: IndexType<S>) =>
                // @ts-ignore
                mapActionsReducers(scopeReducer<S>(key), actions) as ActionMapWithState<M, S>;


export function scopeActionsWithCtxBuilder<S, C1, C2>(ctxBuilder: (key: IndexType<S>, state: S, handler: ReducerHandler<S, C1>, ctxIn: C1) => C2)
    : <M>(actions: M) => (key: IndexType<S>) => ActionMapWithCtx<ActionMapWithState<M, S>, C1> {
    let effectWrapper = (key: IndexType<S>) => (effect: Effect<S, C2>) => (state: S, handler: ReducerHandler<S, C1>, ctx: C1) => {
        assertObject(state);
        let ctxNew = ctxBuilder(key, state, handler, ctx);
        return effect(state, handlerWithContext(handler, ctxNew), ctxNew);
    };
    return scopeActionsWithEffectWrapper<S, C1, C2>(effectWrapper);
}

export function scopeActionsWithEffectWrapper<S, C1, C2>(effectWrapper: (key: IndexType<S>) => (effect: Effect<S, C2>) => Effect<S, C1>)
    : <M>(actions: M) => (key: IndexType<S>) => ActionMapWithCtx<ActionMapWithState<M, S>, C1> {
    return <M>(actions: M) => {
        return (key: IndexType<S>) => {
            let reducerTransformer = (r: Reducer<StatePart<S, typeof key>, C2>) => {
                let reducer: Reducer<S, C2> = scopeReducer<S>(key)(r);
                return reducerWithWrappedEffect(effectWrapper(key), reducer) as Reducer<S, C1>;
            };
            // @ts-ignore
            return mapActionsReducers(reducerTransformer, actions) as ActionMapWithCtx<ActionMapWithState<M, S>, C1>;
        };
    }
}


type ActionUnion<A, B> =

    A extends (...args: infer ARG_A) => any ?
        B extends (...args: ARG_A) => any ?
            A extends ReducerCreator<infer ARG, infer S, infer C> ?
                B extends ReducerCreator<ARG, S, C> ?
                    A
                    :
                    never
                :
                (...args: ARG_A) => ActionMapUnion<ReturnType<A>, ReturnType<B>>
            :
            never
        :
        A extends Object ?
            B extends Object ?
                ActionMapUnion<A, B>
                :
                never
            :
            never


export type ActionMapUnion<A, B> =
    { [key in keyof A & keyof B]: ActionUnion<A[key], B[key]> }
    & Omit<A, keyof B>
    & Omit<B, keyof A>

//TODO autoriser les action map creator
export function chainActions<S, C, M1 extends ActionMap<S, C>, M2 extends ActionMap<S, C>>(actions1: M1, actions2: M2): ActionMapUnion<M1, M2> {
    let newVar = {
        ...actions2, ...lodashMapValues(actions1, (mapItem: M1[keyof M1], key: string) => {
            //TODO : gérer si c'est un objet et map une fonction
            if (typeof mapItem !== "function") {
                assertObject(mapItem);
                if (actions2[key]) {
                    assertObject(actions2[key]);
                    return chainActions(mapItem as any, actions2[key] as any);
                }
            } else {
                assertFunction(mapItem);
                return (...args: any[]) => {
                    let mapItemOutput = (mapItem as Function)(...args);
                    if (typeof mapItemOutput == "function") {
                        let reducer = mapItemOutput;
                        if (actions2[key]) {
                            assertFunction(actions2[key]);
                            return (state: any, executor: any) => {
                                state = reducer(state, executor);
                                return (actions2[key] as Function)(...args)(state, executor)
                            }
                        } else {
                            return reducer;
                        }
                    } else {
                        if (actions2[key]) {
                            assertFunction(actions2[key]);
                            let actions2Element = (actions2[key] as Function)(...args);
                            assertObject(actions2Element);
                            return chainActions(mapItemOutput, actions2Element);
                        } else {
                            return mapItemOutput;
                        }

                    }
                }
            }
        })
    };
    // @ts-ignore
    return newVar as ActionMapUnion<M1, M2>
}

//TODO curry
function reducerWithWrappedEffect<S, C0, C, A>(effectWrapper: (effect: Effect<S, C>) => Effect<S, C0>, reducer: Reducer<S, C>) {
    assertFunction(reducer);
    return (state: S, executor: Executor<S, C0>) => {
        const contextExecutor = (effect: Effect<S, C>) => {
            executor(effectWrapper(effect));
        };
        return reducer(state, contextExecutor)
    };
}

export function actionWithWrappedEffect<S, C, C0>(effectWrapper: (effect: Effect<S, C>) => Effect<S, C0>) {
    return function <A extends any[]>(reducerCreator: ReducerCreator<A, S, C>): ReducerCreator<A, S, C0> {
        return (...args: A) => {
            return reducerWithWrappedEffect(effectWrapper, reducerCreator(...args));
        }
    };
}

export function actionWithContextBuilder<C, C0>(ctxBuilder: (ctxIn: C0) => C) {
    const effectWrapper = <S>(effect: Effect<S, C>): Effect<S, C0> => (state: S, handler, ctx) => {
        const newCtx = ctxBuilder(ctx);
        return effect(state, handlerWithContext(handler, newCtx), newCtx);
    };
    return actionWithWrappedEffect(effectWrapper);
}

//TODO : on ne vérifie pas que les actions prennent le bon contexte
export function actionsWithContext<S, M extends ActionMap<S, C>, C>(ctx: C, actions: M)
    : ActionMapWithCtx<M, void> {
    // @ts-ignore
    return mapActionsReducers(reducerWithContext(ctx), actions)
}

export function actionsWithListener<M, C, S>(listener: Reducer<S, C>, actions: M)
    : M {
    //TODO : les actions qui sont lancées depuis les effects ne sont pas écoutées. Ecouter le handler ?
    // @ts-ignore
    return mapActionsReducers((reducer: Reducer<S, C>) => {
        return (state: S, executor: Executor<S, C>) => {
            const listeningExecutor = (effect: Effect<S, C>) => {
                executor((state, handler, ctx) => {
                    const listeningHandler = (reducer: Reducer<S, C>) => {
                        return handler((state, executor) => {
                            let s = reducer(state, listeningExecutor);
                            s = listener(s, executor);
                            return s
                        });
                    };
                    return effect(state, listeningHandler, ctx)
                })
            };
            state = reducer(state, listeningExecutor);
            state = listener(state, executor);
            return state
        }
    }, actions)
}


export function actionsWithContextBuilder<M, C, C0>(ctxBuilder: (ctxIn: C0) => C, actions: M)
    : ActionMapWithCtx<M, C0> {
    // @ts-ignore
    return mapActionsReducers(reducerWithContextBuilder(ctxBuilder), actions)
}


export function actionsWithContextActions<M, C extends FunctionsContext>(ctxAction: ContextToActionMap<C>, actions: M)
    : ActionMapWithCtx<M, void> {
    // @ts-ignore
    return mapActionsReducers(reducerWithActionsContext(ctxAction), actions)
}


export type WithoutOrVoid<C1, C> =
    C1 extends void ? void :
        C1 extends never ?
            void
            : keyof Omit<C1, keyof C> extends never ?
            void :
            Omit<C1, keyof C>

export function actionWithContextPart<C>(ctx1: C)
    : <A extends any[], S, C1>(action: ReducerCreator<A, S, C1>) => ReducerCreator<A, S, WithoutOrVoid<C1, C>> {
    let effectWrapper = <S, C1>(effect: Effect<S, C1>) => (state: S, handler: ReducerHandler<S, WithoutOrVoid<C1, C>>, ctx: WithoutOrVoid<C1, C>) => {
        let newCtx = {
            ...ctx1, ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    return actionWithWrappedEffect(effectWrapper);
}


export function actionWithActionsContextPart<M>(ctxActions: M)
    : <A extends any[], S, C1>(action: ReducerCreator<A, S, C1>) => ReducerCreator<A, S, WithoutOrVoid<C1, ActionMapToMethodMap<M>>> {
    let effectWrapper = <S, C1>(effect: Effect<S, C1>) => (state: S, handler: ReducerHandler<S>, ctx: WithoutOrVoid<C1, ActionMapToMethodMap<M>>) => {
        let ctxFromActions = handleActionMap(handler, ctxActions);
        let newCtx = {
            ...ctxFromActions, ...ctx
        };
        // @ts-ignore //TODO
        return effect(state, handlerWithContext(handler, newCtx), newCtx)
    };
    // @ts-ignore
    return actionWithWrappedEffect(effectWrapper);
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

export function actionsWithContextPart<M, C>(ctx: C, actions: M)
    : ActionMapWithCtx<M, WithoutOrVoid<ActionMapToCtx<M>, C>> {
    //TODO : si on implémente tout le context, le reducer n'est pas un Reducer<S, void>
    // @ts-ignore
    return mapActionsReducers(reducerWithContextPart(ctx), actions)
}

export function actionsWithContextBuilderPart<M, C, C0>(ctxBuilder: (ctxParent: C0) => C, actions: M)
    : ActionMapWithCtx<M, ActionMapToCtx<M> extends void ? C0 : C0 & Omit<ActionMapToCtx<M>, keyof C>> {
    //TODO : si on implémente tout le context, le reducer n'est pas un Reducer<S, void>
    // @ts-ignore
    return mapActionsReducers(reducerWithContextBuilderPart(ctxBuilder), actions)
}


export function actionsWithActionsContextPart<CM, M>(ctxActions: CM, actions: M)
    : ActionMapWithCtx<M, WithoutOrVoid<ActionMapToCtx<M>, ActionMapToMethodMap<CM>>> {
    // @ts-ignore
    return mapActionsReducers(reducerWithActionsContextPart(ctxActions), actions);
}

export function scopeAction<S>(key: IndexType<S>)
    : <A extends any[], C>(action: ReducerCreator<A, StatePart<S, IndexType<S>>, C>) => ReducerCreator<A, S, C> {
    return <A extends any[], C>(action: ReducerCreator<A, StatePart<S, IndexType<S>>, C>) => (...args: A) => {
        const reducerOrActionsMap = action(...args);
        if (typeof reducerOrActionsMap === "function") {
            //TODO : marche pas si reducerOrActionsMap est une fonction qui renvoie une action map
            return scopeReducer(key)(reducerOrActionsMap);
        } else {
            return scopeActions(key)(reducerOrActionsMap)
        }
    }
}

export function actionWithContext<C>(ctx: C) {
    return function <A extends any[], S>(reducerCreator: ReducerCreator<A, S, C>): ReducerCreator<A, S> {
        let reducerWithContext1 = reducerWithContext(ctx);
        return (...args: A) => {
            let reducer = reducerCreator(...args);
            return reducerWithContext1(reducer);
        }
    };
}

export function actionWithActionsContext<C extends FunctionsContext>(actions: ContextToActionMap<C>)
    : <A extends any[], S, C extends FunctionsContext>(reducer: ReducerCreator<A, S, C>) => ReducerCreatorWithoutContext<ReducerCreator<A, S, C>> {
    return <A extends any[], S, C extends FunctionsContext>(reducer: ReducerCreator<A, S, C>) => (...args: A) => (state: S, executor: Executor<S, any>) => {
        // @ts-ignore TODO
        const executorWithActionsContext1: Executor<S, C> = executorWithActionsContext(executor, actions);
        return reducer(...args)(state, executorWithActionsContext1);
    }
}


export function updateState<S, K extends IndexType<S>>(state: S, key: K, subState: StatePart<S, K>) {
    if (Array.isArray(state)) {
        if (subState !== state[key]) {
            let newState = [...state];
            newState[key as number] = subState;
            return newState as any as S;
        } else {
            return state;
        }
    } else {
        if ((state as any)[key] !== subState) {
            return {...state, [key]: subState};
        } else {
            return state;
        }
    }
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

function wrapEffectWithActionsMap<M>(actions: M) {
    return <S>(effect: Effect<S, ActionMapToMethodMap<M>>) => (state: S, handler: ReducerHandler<S>) => {
        const ctx1: ActionMapToMethodMap<M> = handleActionMap(handler, actions);
        const handlerWithContext1 = handlerWithContext(handler, ctx1);
        return effect(state, handlerWithContext1, ctx1);
    };
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

function memoize2(fn: (arg1: any, arg2: any) => any) {
    const curried = memoize((arg1: any) => {
        return memoize((arg2: any) => {
            return fn(arg1, arg2);
        });
    });
    return (arg1: any, arg2: any) => {
        return curried(arg1)(arg2)
    }

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


let metaMemo = memoize(memoize);

export function memoizeN<F extends (...args: any[]) => any>(fn: (...args: any[]) => any): F {
    let newVar2 = memoize((arg0: any) => {
        return memoizeN((...args: any[]) => {
            return fn(arg0, ...args)
        })
    });
    let newVar = (...args: Parameters<F>): ReturnType<F> => {
        if (args.length == 0) {
            return metaMemo(fn)()
        }
        if (args.length == 1) {
            return metaMemo(fn)(args[0])
        }
        if (args.length == 2) {
            return newVar2(args[0])(args[1])
        }

        if (args.length > 2) {
            let [first, ...rest] = args;
            return newVar2(first)(...rest)
        }
    };
    return newVar as F
}
