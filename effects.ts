import {handleActionMap, handlerWithContext} from "./handlers";
import {ActionMapToMethodMap, Effect, ReducerHandler} from "./core";

export function wrapEffectWithActionsMap<M>(actions: M) {
    return <S>(effect: Effect<S, ActionMapToMethodMap<M>>) => (state: S, handler: ReducerHandler<S>) => {
        const ctx1: ActionMapToMethodMap<M> = handleActionMap(handler, actions);
        const handlerWithContext1 = handlerWithContext(handler, ctx1);
        return effect(state, handlerWithContext1, ctx1);
    };
}