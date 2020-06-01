/**
 * Experiments on fluent actions api
 */

import {
    ActionMap, ActionMapToCtx, ActionMapWithCtx,
    Executor, OmitPart,
    ReducerCreator
} from "./core";
import {actionsWithContextPart, actionsWithContextValue} from "./actions";


class ActionsModifier<S, C extends {}, M extends ActionMap<S, C>> {

    actionsMap: M

    constructor(actionsMap: M) {
        this.actionsMap = actionsMap;
    }

    withContext(ctx: C):ActionMapWithCtx<M, {}> {
        // @ts-ignore
        return actionsWithContextValue(ctx, this.actionsMap)
    }

    withContextPart<C1>(ctx: C1):ActionMapWithCtx<M, OmitPart<ActionMapToCtx<M>, C1>> {
        return actionsWithContextPart(ctx, this.actionsMap)
    }
}

type ActionMap2<S, C> = { [key: string]: ReducerCreator<any[], S, C> }


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