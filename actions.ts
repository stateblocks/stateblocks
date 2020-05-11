import {
    ActionMap,
    ActionMapToCtx,
    ActionMapToMethodMap,
    ActionMapWithCtx,
    ActionMapWithReducer,
    ActionMapWithState,
    ContextToActionMap,
    Effect,
    Executor,
    FunctionsContext,
    IndexType,
    Reducer,
    ReducerCreator,
    ReducerCreatorWithoutContext,
    ReducerHandler,
    StatePart,
    UnionOrVoid,
    Without,
} from "./core";
import {
    _reducerWithContext,
    _reducerWithWrappedEffect,
    reducerWithActionsContext,
    reducerWithActionsContextPart,
    reducerWithContextBuilder,
    reducerWithContextBuilderPart,
    reducerWithContextPart,
    scopeReducer
} from "./reducers";
import {assertFunction, assertObject} from "./asserts";
import {handleActionMap, handlerWithContext} from "./handlers";
import {_executorWithActionsContext, mapExecutorEffect} from "./executors";
import {mapValues as lodashMapValues} from "lodash-es";
import {mapEffectContext} from "./effects";


class ActionsModifier<S, C, M extends ActionMap<S, C>> {

    actionsMap: M

    constructor(actionsMap: M) {
        this.actionsMap = actionsMap;
    }

    withContext(ctx: ActionMapToCtx<M>) {
        return actionsWithContext(ctx, this.actionsMap)
    }

    withContextPart<C1>(ctx: C1) {
        return actionsWithContextPart(ctx, this.actionsMap)
    }
}

type ActionMap2<S, C> = { [key: string]: ReducerCreator<any[], S, C> }

type InferActionMap<M> = M extends ActionMap<infer S, infer C> ? ActionMap<S, C> : never

export function useActions<S, C, M extends ActionMap2<S, C>>(actionMap: M) {
    return new ActionsModifier(actionMap)
}

function test() {
    type Context = {
        a: string,
        b: number,
    }
    const increment = () => (state: number, exec: Executor<number, Context>) => state + 1;
    const actionMap = {increment: increment};
    useActions(actionMap).withContext({a: "test", b: 42})
    useActions(actionMap).withContextPart({a: 42})
}


export function mapActionsValues<T, U, A>(fn: (arg: T) => U, actions: A): { [key in keyof A]: U } {
    // console.warn("use mapActionsReducers instead of mapActionsValues");
    // @ts-ignore
    return lodashMapValues(actions, fn);
}

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


function actionsWithFull<CP, M>(ctxOrFunction: CP, actions: M):
    CP extends (ctxIn: infer C0) => infer C ?
        ActionMapWithCtx<M, UnionOrVoid<C0, Without<ActionMapToCtx<M>, C>>>
        :
        ActionMapWithCtx<M, Without<ActionMapToCtx<M>, CP>> {
    return null
}

function testFullContext() {

    type Context = {
        a: string,
        b: number,
    }

    const actions = {
        increment: () => (state: number, executor: Executor<number, Context>) => state + 1
    }

    /**
     * Provide context part builder with input arg
     */
    let newActions1 = actionsWithFull((arg: { input: string }) => ({
        a: "test",
    }), actions)

    let action1: Reducer<number, { input: string, b: number }> = newActions1.increment()

    /**
     * Provide full context builder without arg
     */
    let newActions2 = actionsWithFull(() => ({
        a: "test",
        b: 1,
    }), actions)


    let action2: Reducer<number> = newActions2.increment()

    /**
     * Provide full context builder with arg
     */
    let newActions3 = actionsWithFull((arg: string) => ({
        a: "test",
        b: 1,
    }), actions)
    let action3: Reducer<number, string> = newActions3.increment()

    /**
     * Provide full context object
     */
    let newActions4 = actionsWithFull({
        a: "test",
        b: 1,
    }, actions)
    let action4: Reducer<number> = newActions4.increment()

    /**
     * Provide part context object
     */
    let newActions5 = actionsWithFull({
        a: "test",
    }, actions)
    let action5: Reducer<number, { b: number }> = newActions5.increment()
}


//TODO : on ne vérifie pas que les actions prennent le bon contexte
export function actionsWithContext<M>(ctx: ActionMapToCtx<M>, actions: M)
    : ActionMapWithCtx<M, void> {
    // @ts-ignore
    return mapActionsReducers(_reducerWithContext(ctx), actions)
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


export function actionsWithContextPart<M, C>(ctx: C, actions: M)
    : ActionMapWithCtx<M, Without<ActionMapToCtx<M>, C>> {
    //TODO : si on implémente tout le context, le reducer n'est pas un Reducer<S, void>
    // @ts-ignore
    return mapActionsReducers(reducerWithContextPart(ctx), actions)
}

export function actionsWithContextBuilderPart<M, C, C0>(ctxBuilder: (ctxParent: C0) => C, actions: M)
    : ActionMapWithCtx<M, ActionMapToCtx<M> extends void ? C0 : UnionOrVoid<C0, Without<ActionMapToCtx<M>, C>>> {
    //TODO : si on implémente tout le context, le reducer n'est pas un Reducer<S, void>
    // @ts-ignore
    return mapActionsReducers(reducerWithContextBuilderPart(ctxBuilder), actions)
}

export function actionsWithActionsContextPart<CM, M>(ctxActions: CM, actions: M)
    : ActionMapWithCtx<M, Without<ActionMapToCtx<M>, ActionMapToMethodMap<CM>>> {
    // @ts-ignore
    return mapActionsReducers(reducerWithActionsContextPart(ctxActions), actions);
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

function scopeActionsWithEffectWrapper<S, C1, C2>(effectWrapper: (key: IndexType<S>) => (effect: Effect<S, C2>) => Effect<S, C1>)
    : <M>(actions: M) => (key: IndexType<S>) => ActionMapWithCtx<ActionMapWithState<M, S>, C1> {
    return <M>(actions: M) => {
        return (key: IndexType<S>) => {
            let reducerTransformer = (r: Reducer<StatePart<S, typeof key>, C2>) => {
                let reducer: Reducer<S, C2> = scopeReducer<S>(key)(r);
                return _reducerWithWrappedEffect(effectWrapper(key), reducer) as Reducer<S, C1>;
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
