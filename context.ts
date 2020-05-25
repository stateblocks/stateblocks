import {ActionMapToMethodMap, ReducerHandler} from "./core";
import {handleActionMap} from "./handlers";
import {ContextBuilder} from "./actions";


export function contextWithActions<M>(actions: M) {
    return <S, C>(ctx: C, handler: ReducerHandler<S, C>): ActionMapToMethodMap<M> & C => ({
        // @ts-ignore
        ...(handleActionMap(handler, actions)), ...ctx
    })
}