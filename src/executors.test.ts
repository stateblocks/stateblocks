import {Effect, Executor, ReducerHandler} from "./core";


test("types", () => {
    let executor: Executor<number, { a: number, b: string }> = () => {};
    let effectSmall: Effect<number, { a: number }> = null;
    let effectBig: Effect<number, { a: number, b: string, c: string }> = null;
    // TODO : this should be accepted
    // executor(effectSmall);
    // TODO : this should not be accepted
    executor(effectBig);
})