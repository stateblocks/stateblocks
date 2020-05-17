import {actionsOf} from "./actions";
import {
    ActionMapToCtx,
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

    let ctxIntersection: ActionsMapToContextIntersection<typeof truc> = {a: 1, b: "test"};
    ctxIntersection.a;
    ctxIntersection.b;

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


    let ctx: ActionMapToCtx<typeof actions> = {a:1};
    ctx.a

    //Should compile. ctx should contain the intersection of all context, but contains only the union
    // ctx.b

    let ctxUnion: ActionsMapToContextIntersection<typeof actions> = {a: 1, b: "test"};
    ctxUnion.a;
    ctxUnion.b;


    let executorAB: Executor<number, A & B> = null;

    let effect: Effect<number, A> = null;

    // should compile
    // executorAB(effect)

    let reducerA: Reducer<number, A> = (() => {}) as any;
    reducerA(0, executorAB)


})