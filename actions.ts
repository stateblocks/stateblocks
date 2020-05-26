import {
    ActionMap,
    ActionMapToCtx, ActionMapToCtxIntersection,
    ActionMapToMethodMap,
    ActionMapToState,
    ActionMapWithCtx,
    ActionMapWithCtxBuilder,
    ActionMapWithReducer,
    ActionMapWithState,
    ContextToActionMap,
    Effect,
    Executor,
    FunctionsContext,
    IndexType,
    OmitPart,
    Reducer,
    ReducerCreator,
    ReducerHandler,
    StatePart,
} from "./core";
import {
    _reducerWithContext,
    _mapReducerEffect,
    reducerWithActionsContext,
    reducerWithActionsContextPart,
    _mapReducerContext,
    reducerWithContextBuilderPart,
    reducerWithContextPart,
    scopeReducer
} from "./reducers";
import {assertFunction, assertObject} from "./asserts";
import {handlerWithContext} from "./handlers";
import {mapValues as lodashMapValues} from "lodash-es";


function mapActionsReducers<T, U, A>(reducerTransformer: (reducer: T) => U, actions: A): ActionMapWithReducer<A, T, U> {
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


export function actionsWithListener<M, C, S>(listener: Reducer<S, C>, actions: M)
    : M {
    //TODO : les actions qui sont lancées depuis les effects ne sont pas écoutées. Ecouter le handler ?
    // @ts-ignore
    return mapActionsReducers((reducer: Reducer<S, C>) => {
        return (state: S, executor: Executor<S, C>) => {
            const listeningExecutor = (effect: Effect<S, C>) => {
                executor((state, handler, ctx: C) => {
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

export type ContextBuilder<C0, C1, S> = (ctxIn: C0, handler: ReducerHandler<S, C0>) => C1

export type CtxBuilderToCtxUnion<CB, MC> = CB extends (ctxIn: infer C0) => infer C ?
    (C0 & OmitPart<MC, C>)
    :
    CB extends ContextBuilder<infer C0, infer C, infer S> ?
        (C0 & OmitPart<MC, C>)
        :
        OmitPart<MC, CB>


export function provideContext<CB, M>(ctxOrFunction: CB, actions: M):
    ActionMapWithCtxBuilder<M, CB> {
    if (typeof ctxOrFunction == "function") {
        // @ts-ignore
        return mapActionsReducers(reducerWithContextBuilderPart(ctxOrFunction), actions)
    } else {
        // @ts-ignore
        return actionsWithContextPart(ctxOrFunction, actions)
    }
}


//TODO : on ne vérifie pas que les actions prennent le bon contexte
export function actionsWithContextValue<M>(ctx: ActionMapToCtxIntersection<M>, actions: M)
    : ActionMapWithCtx<M, {}> {
    // @ts-ignore
    return mapActionsReducers(_reducerWithContext(ctx), actions)
}

export function actionsWithContextBuilder<M, C, C0>(ctxBuilder: (ctxIn: C0) => C, actions: M)
    : ActionMapWithCtx<M, C0> {
    // @ts-ignore
    return mapActionsReducers(_mapReducerContext(ctxBuilder), actions)
}

export function actionsWithContextActions<M, C extends FunctionsContext>(ctxAction: ContextToActionMap<C>, actions: M)
    : ActionMapWithCtx<M, {}> {
    // @ts-ignore
    return mapActionsReducers(reducerWithActionsContext(ctxAction), actions)
}

export function actionsWithContextPart<M, C>(ctx: C, actions: M)
    : ActionMapWithCtx<M, OmitPart<ActionMapToCtx<M>, C>> {
    // @ts-ignore
    return mapActionsReducers(reducerWithContextPart(ctx), actions)
}

export function actionsWithContextBuilderPart<M, C, C0>(ctxBuilder: (ctxParent: C0) => C, actions: M)
    : ActionMapWithCtx<M, ActionMapToCtx<M> extends void ? C0 : (C0 & OmitPart<ActionMapToCtx<M>, C>)> {
    //TODO : si on implémente tout le context, le reducer n'est pas un Reducer<S, void>
    // @ts-ignore
    return mapActionsReducers(reducerWithContextBuilderPart(ctxBuilder), actions)
}

export function actionsWithActionsContextPart<CM, M>(ctxActions: CM, actions: M)
    : ActionMapWithCtx<M, OmitPart<ActionMapToCtx<M>, ActionMapToMethodMap<CM>>> {
    // @ts-ignore
    return mapActionsReducers(reducerWithActionsContextPart(ctxActions), actions);
}

/**
 * This function is curried to be provided with state type parameter without
 * requiring other types parameters
 */
//TODO : permettre de fournir un context builder qui renvoie le contexte correspondant au scope
// export function scopeActions<S>(): <M>(actions: M) => (key: IndexType<S>) => ActionMapWithState<M, S>
export function scopeActions<S>(): <M, C1, C2>(actions: M, ctxBuilder?: ScopedContextBuilder<S, C1, ActionMapToCtxIntersection<M>>)
    => (key: IndexType<S>) => typeof ctxBuilder extends void ? ActionMapWithState<M, S> : ActionMapWithCtx<ActionMapWithState<M, S>, C1>
export function scopeActions<S>(key: IndexType<S>): <M>(actions: M) => ActionMapWithState<M, S>
export function scopeActions<S>(key?: any): any {
    if (key != null) {
        let k = key as IndexType<S>;
        // @ts-ignore
        return <M>(actions: M) => mapActionsReducers(scopeReducer<S>(k), actions) as ActionMapWithState<M, S>;
    } else {
        // return createScopedActionMap<S>()
        return <M, C1>(actions: M, ctxBuilder?: ScopedContextBuilder<S, C1, ActionMapToCtxIntersection<M>>) =>
            (key: IndexType<S>) => {
                if (ctxBuilder) {
                    return scopeActionsWithCtxBuilder(ctxBuilder)(actions)(key)
                } else {
                    // @ts-ignore
                    return mapActionsReducers(scopeReducer<S>(key), actions) as ActionMapWithState<M, S>;
                }
            }
    }
}

type ComposeState<M> = { [P in keyof M]: ActionMapToState<M[P]> }
type Composed<M> = { [P in keyof M]: ActionMapWithState<M[P], ComposeState<M>> }

export function composeActions<M>(actions: M): Composed<M> {
    let output: any = {}
    for (let scope in actions) {
        output[scope] = scopeActions<any>(scope)(actions[scope])
    }
    return output;
}


const createScopedActionMap: <S>() => <M>(actions: M) => (key: IndexType<S>) => ActionMapWithState<M, S> =
    //We curry this function to benefit from type inference on actions argument
    <S>() =>
        <M>(actions: M) =>
            (key: IndexType<S>) =>
                // @ts-ignore
                mapActionsReducers(scopeReducer<S>(key), actions) as ActionMapWithState<M, S>;

type ScopedContextBuilder<S, C1, C2> = (key: IndexType<S>, state: S, handler: ReducerHandler<S, C1>, ctxIn: C1) => C2

//TODO on peut implémenter cette fonction avec scopeAction si on fournit un contexte builder avec l'actionMap
export function scopeActionsWithCtxBuilder<S, C1 extends {}, C2 extends {}>(ctxBuilder: ScopedContextBuilder<S, C1, C2>)
    : <M>(actions: M) => (key: IndexType<S>) => ActionMapWithCtx<ActionMapWithState<M, S>, C1> {
    let effectWrapper = (key: IndexType<S>) => (effect: Effect<S, C2>) => (state: S, handler: ReducerHandler<S, C1>, ctx: C1) => {
        assertObject(state);
        let ctxNew = ctxBuilder(key, state, handler, ctx);
        return effect(state, handlerWithContext(handler, ctxNew), ctxNew);
    };
    return scopeActionsWithEffectWrapper<S, C1, C2>(effectWrapper);
}

function scopeActionsWithEffectWrapper<S, C1, C2>(effectWrapper: (key: IndexType<S>) => (effect: Effect<S, C2>) => Effect<S, C1>)
    : <M>(actions: M) => (key: IndexType<S>) => ActionMapWithCtx<ActionMapWithState<M, S>, C1> {
    return <M>(actions: M) => {
        return (key: IndexType<S>) => {
            let reducerTransformer = (r: Reducer<StatePart<S, typeof key>, C2>) => {
                let reducer: Reducer<S, C2> = scopeReducer<S>(key)(r);
                return _mapReducerEffect(effectWrapper(key), reducer) as Reducer<S, C1>;
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

/**
 * Helper function to enforce actions map shape.
 * Allow writing of actions without explicit typing of state and executor arguments.
 * Raises compilation error if an action doesn't respect the required shape.
 * Without this check, a bad shaped actions map could raise error when used. With this check, errors happen on actions
 * definition.
 */
export function actionsOf<S, C>() {
    return <M extends ActionMap<S, C>>(actions: M): ActionMapWithState<ActionMapWithCtx<M, C>, S> => {
        return actions as any;
    }
}