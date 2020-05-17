import {actionsOf, useActions} from "./actions";
import {Counter, createMockCounterContext} from "./samples/Counter";
import {
    ActionMap,
    ActionMapToCtx,
    ActionMapWithCtx,
    ActionMapWithState,
    Effect,
    Executor, Reducer,
    ReducerCreator
} from "./core";


test("Context and effects typing experiments", () => {

    type UnionToIntersection<U> =
        (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never


    type ActionsMapToReducerCreator<M> = M extends Object ?
        M[keyof M]
        : M extends (...args: any) => infer M2 ?
            M2[keyof M2]
            : never

    type ReducerCreatorToCtx<R> = R extends ReducerCreator<infer A, infer S, infer C> ? C : never

    type ActionsMapToContextIntersection<M> = UnionToIntersection<ReducerCreatorToCtx<ActionsMapToReducerCreator<M>>>

    let truc = {
        test: () => (state: number, exec: Executor<number, A>) => state,
        test2: () => (state: number, exec: Executor<number, B>) => state,
    }

    let chose: ActionsMapToContextIntersection<typeof truc> = null;
    chose.a;
    chose.b;

    type A = { a: number }
    type B = { b: string }

    let sub = actionsOf<number, void>()({
        decrement: () => state => state - 1
    })

    let actions = ({
        increment: () => (state: number, exe: Executor<number, A>) => {
            return state + 1
        },

        test: () => (state: number, exe: Executor<number, A & B>) => {
            // actions.increment()(state, exe)
            return state + 1
        },
    })


    let ctx: ActionMapToCtx<typeof actions> = null;
    ctx.a

    //Should compile. ctx should contain the intersection of all context, but contains only the union
    // ctx.b

    let ctxUnion:ActionsMapToContextIntersection<typeof actions> = null;
    ctxUnion.a;
    ctxUnion.b;


    let executorAB: Executor<number, A & B> = null;

    let effect: Effect<number, A> = null;

    // should compile
    // executorAB(effect)

    let reducerA: Reducer<number, A> = null;
    reducerA(0, executorAB)


})