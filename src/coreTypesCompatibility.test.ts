import {Effect, Executor, ReducerHandler, ReducerSimple, ReducerWithContext} from "./core";
import {excludeFuncParams} from "./typesChecks";

type A = { a: number }
type B = { b: string }
type C = { c: string }
type D = { d: string }

test("executor, effect, reducer, handler compatibility", () => {

    type State = {
        a:string,
        b:number
    }

    let state = {
        a:"test",
        b:1,
    }


    const executorA: Executor<State, A> = () => {};
    const executorAB: Executor<State, A & B> = () => {};
    const executorVoid: Executor<State> = () => {};

    executorA(null as Effect<State, A>)
    executorA(null as Effect<State, A & B>) // should not compile
    executorA(null as Effect<State>)

    executorAB(null as Effect<State, A>)
    executorAB(null as Effect<State, A & B>)
    executorAB(null as Effect<State>)

    executorVoid(null as Effect<State, A>) // should not compile
    executorVoid(null as Effect<State, A & B>) // should not compile
    executorVoid(null as Effect<State>)


    let handlerA: ReducerHandler<State, A> = () => Promise.resolve();
    let handlerAB: ReducerHandler<State, A & B> = () => Promise.resolve();


    handlerA(null as ReducerWithContext<State, A>)
    handlerA(null as ReducerWithContext<State, A & B>) // should not compile
    handlerA(null as ReducerWithContext<State>)
    handlerA(null as ReducerSimple<State>)

    handlerAB(null as ReducerWithContext<State, A>)
    handlerAB(null as ReducerWithContext<State, A & B>)
    handlerAB(null as ReducerWithContext<State>)
    handlerAB(null as ReducerSimple<State>)

    let reducerA: ReducerWithContext<State, A> = (s) => s;
    let reducerAB: ReducerWithContext<State, A & B> = (s) => s;
    let reducerVoid: ReducerWithContext<State> = (s) => s;

    reducerA(state, executorA)
    excludeFuncParams(reducerA, null, executorVoid)
    reducerA(state, executorAB)
    excludeFuncParams(reducerAB, null, executorA)
    reducerAB(state, executorAB)
    reducerVoid(state, executorA)
    reducerVoid(state, executorAB)


})




