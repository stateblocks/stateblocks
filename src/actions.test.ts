import {provideContext} from "./actions";
import {
    ActionMapToCtxIntersection,
    ActionMapWithState,
    Executor,
    ReducerToCtx,
} from "./core";
import {excludeKey, hasKey} from "./typesChecks";


type A = { a: number }
type B = { b: string }
type C = { c: string }
type D = { d: string }



function getCtx<R>(r: R): ReducerToCtx<R> {
    return null;
}




test("action map to context", () => {

    let ctxMap: ActionMapToCtxIntersection<typeof map> = null;
    hasKey(ctxMap, "a")
    hasKey(ctxMap, "b")
    hasKey(ctxMap, "c")
    excludeKey(ctxMap, "other")
})

type State = { a: string }

let map = {
    ab: () => (state: State, executor: Executor<State, A & B>) => state,
    a: () => (state: State, executor: Executor<State, A>) => state,
    c: () => (state: State, executor: Executor<State, C>) => state,
    empty: () => (state: State, executor: Executor<State>) => state,
    noEffect: () => (state: State) => state,
    subFn: (arg: number) => ({
        ab: () => (state: State, executor: Executor<State, A & B>) => state,
        a: () => (state: State, executor: Executor<State, A>) => state,
        c: () => (state: State, executor: Executor<State, C>) => state,
        empty: () => (state: State, executor: Executor<State>) => state,
        noEffect: () => (state: State) => state,
    }),
    subObj: {
        ab: () => (state: State, executor: Executor<State, A & B>) => state,
        a: () => (state: State, executor: Executor<State, A>) => state,
        c: () => (state: State, executor: Executor<State, C>) => state,
        empty: () => (state: State, executor: Executor<State>) => state,
        noEffect: () => (state: State) => state,
    }
}

test("actionsWithContext types", () => {


    const state = {a: "test"};

    const ctxPart = {b: "test"};
    let mapWithContext = provideContext(ctxPart, map);

    mapWithContext.noEffect()(state)


    hasKey(getCtx(mapWithContext.a()), "a")
    excludeKey(getCtx(mapWithContext.a()), "b")
    excludeKey(getCtx(mapWithContext.a()), "c")

    hasKey(getCtx(mapWithContext.ab()), "a")
    excludeKey(getCtx(mapWithContext.ab()), "b")
    excludeKey(getCtx(mapWithContext.ab()), "c")

    excludeKey(getCtx(mapWithContext.c()), "a")
    excludeKey(getCtx(mapWithContext.c()), "b")
    hasKey(getCtx(mapWithContext.c()), "c")

    excludeKey(getCtx(mapWithContext.empty()), "a")
    excludeKey(getCtx(mapWithContext.empty()), "b")
    excludeKey(getCtx(mapWithContext.empty()), "c")

    excludeKey(getCtx(mapWithContext.noEffect()), "a")
    excludeKey(getCtx(mapWithContext.noEffect()), "b")
    excludeKey(getCtx(mapWithContext.noEffect()), "c")

    hasKey(getCtx(mapWithContext.subFn(0).a()), "a")
    excludeKey(getCtx(mapWithContext.subFn(0).a()), "b")
    excludeKey(getCtx(mapWithContext.subFn(0).a()), "c")

    hasKey(getCtx(mapWithContext.subFn(0).ab()), "a")
    excludeKey(getCtx(mapWithContext.subFn(0).ab()), "b")
    excludeKey(getCtx(mapWithContext.subFn(0).ab()), "c")

    excludeKey(getCtx(mapWithContext.subFn(0).c()), "a")
    excludeKey(getCtx(mapWithContext.subFn(0).c()), "b")
    hasKey(getCtx(mapWithContext.subFn(0).c()), "c")

    excludeKey(getCtx(mapWithContext.subFn(0).noEffect()), "a")
    excludeKey(getCtx(mapWithContext.subFn(0).noEffect()), "b")
    excludeKey(getCtx(mapWithContext.subFn(0).noEffect()), "c")

    hasKey(getCtx(mapWithContext.subObj.a()), "a")
    excludeKey(getCtx(mapWithContext.subObj.a()), "b")
    excludeKey(getCtx(mapWithContext.subObj.a()), "c")

    hasKey(getCtx(mapWithContext.subObj.ab()), "a")
    excludeKey(getCtx(mapWithContext.subObj.ab()), "b")
    excludeKey(getCtx(mapWithContext.subObj.ab()), "c")

    excludeKey(getCtx(mapWithContext.subObj.c()), "a")
    excludeKey(getCtx(mapWithContext.subObj.c()), "b")
    hasKey(getCtx(mapWithContext.subObj.c()), "c")

    excludeKey(getCtx(mapWithContext.subObj.noEffect()), "a")
    excludeKey(getCtx(mapWithContext.subObj.noEffect()), "b")
    excludeKey(getCtx(mapWithContext.subObj.noEffect()), "c")


})



test("actionsWithState types", () => {


    let mapWithState: ActionMapWithState<typeof map, string> = map as any;


    const noEffectReducer = mapWithState.noEffect()("test"); // effect doesn't need executor


    hasKey(getCtx(mapWithState.a()), "a")
    excludeKey(getCtx(mapWithState.a()), "b")
    excludeKey(getCtx(mapWithState.a()), "c")

    hasKey(getCtx(mapWithState.ab()), "a")
    hasKey(getCtx(mapWithState.ab()), "b")
    excludeKey(getCtx(mapWithState.ab()), "c")

    excludeKey(getCtx(mapWithState.c()), "a")
    excludeKey(getCtx(mapWithState.c()), "b")
    hasKey(getCtx(mapWithState.c()), "c")

    excludeKey(getCtx(mapWithState.empty()), "a")
    excludeKey(getCtx(mapWithState.empty()), "b")
    excludeKey(getCtx(mapWithState.empty()), "c")

    excludeKey(getCtx(mapWithState.noEffect()), "a")
    excludeKey(getCtx(mapWithState.noEffect()), "b")
    excludeKey(getCtx(mapWithState.noEffect()), "c")

    hasKey(getCtx(mapWithState.subFn(0).a()), "a")
    excludeKey(getCtx(mapWithState.subFn(0).a()), "b")
    excludeKey(getCtx(mapWithState.subFn(0).a()), "c")

    hasKey(getCtx(mapWithState.subFn(0).ab()), "a")
    hasKey(getCtx(mapWithState.subFn(0).ab()), "b")
    excludeKey(getCtx(mapWithState.subFn(0).ab()), "c")

    excludeKey(getCtx(mapWithState.subFn(0).c()), "a")
    excludeKey(getCtx(mapWithState.subFn(0).c()), "b")
    hasKey(getCtx(mapWithState.subFn(0).c()), "c")

    excludeKey(getCtx(mapWithState.subFn(0).noEffect()), "a")
    excludeKey(getCtx(mapWithState.subFn(0).noEffect()), "b")
    excludeKey(getCtx(mapWithState.subFn(0).noEffect()), "c")

    hasKey(getCtx(mapWithState.subObj.a()), "a")
    excludeKey(getCtx(mapWithState.subObj.a()), "b")
    excludeKey(getCtx(mapWithState.subObj.a()), "c")

    hasKey(getCtx(mapWithState.subObj.ab()), "a")
    hasKey(getCtx(mapWithState.subObj.ab()), "b")
    excludeKey(getCtx(mapWithState.subObj.ab()), "c")

    excludeKey(getCtx(mapWithState.subObj.c()), "a")
    excludeKey(getCtx(mapWithState.subObj.c()), "b")
    hasKey(getCtx(mapWithState.subObj.c()), "c")

    excludeKey(getCtx(mapWithState.subObj.noEffect()), "a")
    excludeKey(getCtx(mapWithState.subObj.noEffect()), "b")
    excludeKey(getCtx(mapWithState.subObj.noEffect()), "c")


})