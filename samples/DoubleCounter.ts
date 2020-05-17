/**
 * Composition of two Counters.
 */

import {Executor} from "../core";
import {Counter, CounterState, createMockCounterContext} from "./Counter";
import {actionsWithContext, scopeActions} from "../actions";


type Counters = {
    top: CounterState,
    bottom: CounterState,
}


export function createTwoCounters() {
    let initialState = {
        top: Counter.initialState,
        bottom: Counter.initialState,
    };

    const counterContext = createMockCounterContext();

    let actions = {
        top: scopeActions<Counters>("top")(actionsWithContext(counterContext, Counter.actions)),
        bottom: scopeActions<Counters>("bottom")(actionsWithContext(counterContext, Counter.actions)),
        reset: () => (state: Counters, executor: Executor<Counters>) => {
            state = actions.top.setValue(0)(state, executor);
            state = actions.bottom.setValue(0)(state, executor);
            return state;
        }
    };
    return {initialState, actions};
}