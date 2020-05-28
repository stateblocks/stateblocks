/**
 * Simple Counter sample.
 */

import {Executor, ReducerHandler} from "../core";
import {sleep} from "./utils";

export type CounterState = number;

export type CounterContext = {
    onReset(arg: number): void,
}

export const Counter = {

    initialState: 0,

    actions: {

        increment: () => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            return state + 1;
        },

        decrement: () => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            return Math.max(state - 1, 0);
        },

        /**
         * Uses effect to randomly increment counter every second.
         */
        startRandomIncrement: () => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            executor((state, handler, ctx) => {
                setInterval(() => {
                    if (Math.random() > 0.9) {
                        handler(Counter.actions.increment())
                    }
                }, 1000)
            });
            return state;
        },

        /**
         * Example of listener pattern in context.
         * Sets value of counter and calls a function in context.
         * @param value
         */
        setValue: (value: number) => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            executor((state, handler, ctx) => {
                return ctx.onReset(state);
            });
            return value;
        },

        /**
         * Action with another action in side effect
         * @param timeout
         */
        incrementLater: (timeout: number) => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            let effect = async (state: CounterState, handler: ReducerHandler<CounterState, CounterContext>, ctx: CounterContext) => {
                await sleep(timeout);
                return handler(Counter.actions.increment());
            };
            executor(effect);
            return state;
        },

        /**
         * Example of actions composition.
         * @param timeout
         */
        incrementAndLater: (timeout: number) => (state: CounterState, executor: Executor<CounterState, CounterContext>) => {
            state = Counter.actions.increment()(state, executor);
            return Counter.actions.incrementLater(timeout)(state, executor)
        }

    }
};


export function createMockCounterContext(): CounterContext {
    return {
        onReset: jest.fn((arg) => console.log("reset", arg)),
    };
}
