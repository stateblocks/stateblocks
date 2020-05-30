import {
    ActionMapToCtxIntersection,
    ActionMapToMethodMap,
    Merge,
    ReducerHandler
} from "./core";
import {handleActionMap} from "./handlers";
import {ContextBuilder} from "./actions";


export function contextWithActionsPart<M>(actions: M) {
    return <S, C extends ActionMapToCtxIntersection<M>>(ctx: C, handler: ReducerHandler<S, C>): Merge<ActionMapToMethodMap<M>, C> => ({
        ...(handleActionMap(handler, actions)), ...ctx as any
    } as any)
}

export function contextWithActions<M>(actions: M) {
    return <S, C extends ActionMapToCtxIntersection<M>>(ctx: C, handler: ReducerHandler<S, C>): ActionMapToMethodMap<M> => ({
        ...handleActionMap(handler, actions)
    })
}

export function extendContext<C0, C1, S>(ctxBuilder: ContextBuilder<C0, C1, S>):
    <C extends C0>(ctxIn: C, handler: ReducerHandler<S, C>) => Merge<C, C1> {
    return <C extends C0>(ctxIn: C, handler: ReducerHandler<S, C>) => ({
        ...ctxIn,
        ...ctxBuilder(ctxIn, handler),
    } as unknown as Merge<C, C1>)
}

export function extendContextValue<C>(ctx1: C): <C0 extends C>(ctxIn: C0) => Merge<C0, C> {
    return <C0 extends C>(ctxIn: C0) => ({
        ...ctxIn, ...ctx1
    } as unknown as Merge<C0, C>)
}
