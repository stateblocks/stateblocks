import {Executor, scopeActions} from "../core";
import {App, MultipleCountersState} from "./MultipleCounters";


export type DoubleState = {
    left: MultipleCountersState,
    right: MultipleCountersState
}

const leftActions = scopeActions<DoubleState>("left")({
    ...App.actions,
    top: () => ({
        ...App.actions.top(),
        increment: () => (state: MultipleCountersState, executor: Executor<MultipleCountersState>) => {
            console.log("intercepted increment on top");
            console.log(state);
            return App.actions.top().increment()(state, executor)
        }
    })
});

export const DoubleApp = {

    initialState: {
        left: App.initialState,
        right: App.initialState,
    },

    actions: {

        init: () => (state: DoubleState, executor: Executor<DoubleState>) => {
            state = DoubleApp.actions.left.init()(state, executor);
            state = DoubleApp.actions.right.init()(state, executor);
            return state
        },

        left: {
            ...leftActions,

        },
        right: scopeActions<DoubleState>("right")(App.actions),
    }
};
