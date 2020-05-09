/**
 * Composition of two Counters.
 */

import {Executor} from "../core";
import {Counter, CounterState, createMockCounterContext} from "./Counter";
import {actionsWithContextPart, scopeActions} from "../actions";


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
        top: scopeActions<Counters>("top")(actionsWithContextPart(counterContext, Counter.actions)),
        bottom: scopeActions<Counters>("bottom")(actionsWithContextPart(counterContext, Counter.actions)),
        reset: () => (state: Counters, executor: Executor<Counters>) => {
            state = actions.top.setValue(0)(state, executor);
            state = actions.bottom.setValue(0)(state, executor);
            return state;
        }
    };
    return {initialState, actions};
}