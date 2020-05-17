import {createContextBuilderFromActions, mapEffectContext, wrapEffectWithPartialActionMap} from "./effects";
import {Effect, Executor, Reducer, ReducerHandler, UnionOrVoid, Without} from "./core";
import {Store} from "./store";
import {mapReducerExecutorContext} from "./reducers";
import {mapExecutorEffect} from "./executors";

function createMockHandler<S, C>():ReducerHandler<S, C>{
    return () => {
        return Promise.resolve()
    }
}


test("wrap effect with action context", () => {

    type State = number;
    type Context = { increment: () => void, decrement: () => void };

    let increment = () => {
    }
    let decrement = () => {
    }
    let test = () => {
    }

    let effect: Effect<State, Context> = (state: State, handler: ReducerHandler<State, Context>, ctx: Context) => {
        ctx.increment();
    }


    let createTestHandler = <C>(ctx: C): ReducerHandler<State, C> => {
        let store = new Store(0)
        return (reducer: Reducer<State, C>) => {
            const reducerWithContent: Reducer<State> = mapReducerExecutorContext(mapExecutorEffect(mapEffectContext<State, void, C>(() => ctx)))(reducer);
            let promise = store.update(reducerWithContent)
            expect(store.state).toBe(1)
            return promise;
        }
    }

    // Provide partial context
    wrapEffectWithPartialActionMap({
        increment: () => (state: State, executor: Executor<State>) => {
            return state + 1;
        }
    })(effect)(0, createTestHandler({decrement}), {decrement})

    // Provide partial context. Context actions need another context
    wrapEffectWithPartialActionMap({
        increment: () => (state: State, executor: Executor<State, { test: () => void }>) => {
            return state + 1;
        }
    })(effect)(0, createTestHandler({decrement, test}), {decrement, test})

    // Provide full context
    wrapEffectWithPartialActionMap({
        increment: () => (state: State, executor: Executor<State>) => {
            return state + 1;
        },
        decrement: () => (state: State, executor: Executor<State>) => {
            return state + 1;
        }
    })(effect)(0, createTestHandler(null), null)

    // Provide full context. Context actions need another context
    wrapEffectWithPartialActionMap({
        increment: () => (state: State, executor: Executor<State, { test: () => void }>) => {
            return state + 1;
        },
        decrement: () => (state: State, executor: Executor<State, { test: () => void }>) => {
            return state + 1;
        }
    })(effect)(0, createTestHandler({test}), {test})


})

test("types : create context builder from actions", () => {

    type State = number;

    let test = () => {
    }

    let context = createContextBuilderFromActions({
        increment: () => (state: State, executor: Executor<State, { test: () => void }>) => {
            return state + 1;
        },
        decrement: () => (state: State, executor: Executor<State, { test: () => void }>) => {
            return state + 1;
        }
    })({test}, createMockHandler());

    context.test()
    context.increment();
    context.decrement();



})
