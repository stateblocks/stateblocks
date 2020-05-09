import {
    actionsWithContextActions, actionsWithListener,
    Executor,
    executorWithActionsContext,
    executorWithScope, handleActionMap,
    Reducer, ReducerHandler,
    reducerWithActionsContext, scopeActions,
    scopeReducer
} from "../core";
import {Counter, CounterContext, CounterState} from "./Counter";


export type MultipleCountersState = {
    counters: CounterState[],
    top: CounterState,
    bottom: CounterState,
    total: number,
    max: number
}


function executorWithCounterContext(executor: Executor<MultipleCountersState>, idx: number): Executor<MultipleCountersState, CounterContext> {
    return executorWithActionsContext(executor, {
        ...App.actions,
        onReset(count: number) {
            return App.actions.onCounterReset(idx, count);
        }
    });
}

function counterExecutor(executor: Executor<MultipleCountersState>, idx: number): Executor<CounterState, CounterContext> {
    const executor1 = executorWithScope(executorWithCounterContext(executor, idx), "counters");
    return executorWithScope(executor1, idx);
}

function getTotal(counters: CounterState[]) {
    let result = 0;
    for (let i = 0; i < counters.length; i++) {
        result += counters[i] * Math.pow(10, i);
    }
    return result;
}


function scopeCounterReducer(idx: number, reducer: Reducer<CounterState, CounterContext>): Reducer<MultipleCountersState> {
    return reducerWithActionsContext({
        onReset(count: number) {
            return App.actions.onCounterReset(idx, count);
        }
    })(scopeReducer<MultipleCountersState>("counters")(scopeReducer<CounterState[]>(idx)(reducer)));
}





export const App = {

    initialState: {
        counters: [Counter.initialState, Counter.initialState, Counter.initialState],
        top: Counter.initialState,
        bottom: Counter.initialState,
        total: Counter.initialState,
        max: 12,
    },


    /**
     * Returns actions bound to handler.
     * @param handler
     */
    updater(handler: ReducerHandler<MultipleCountersState>) {
        return handleActionMap(handler, App.actions)
    },

    actions: {

        counterActions(idx: number) {

            let counterActions = actionsWithContextActions({
                onReset: (count: number) => App.actions.onCounterReset(idx, count)
            }, scopeActions<MultipleCountersState>("counters")(scopeActions<CounterState[]>(idx)( Counter.actions)));
            // return counterActions;
            return actionsWithListener(App.actions.onCounterChange(idx), counterActions);

            // return mapActionsValues(
            //     (action: ReducerCreator<any[], CounterState, CounterContext>) => pipe(action, curry(scopeCounterReducer)(idx)),
            //     Counter.actions);

            // return {...Counter.actions(),
            //     increment: wrapAction((action) => App.actions().scopeCounterReducer(idx, action), Counter.actions().increment),
            //     decrement: pipe(Counter.actions().decrement, curry(App.actions().scopeCounterReducer)(idx))
            // }
        },

        top() {
            return actionsWithContextActions({
                onReset(count: number) {
                    return App.actions.onCounterReset(-1, count);
                }
            }, scopeActions<MultipleCountersState>("top")(Counter.actions));
        },

        //TODO : si on met pas ca sous forme de fonction le typage de App est circulaire
        bottom() {
            return actionsWithContextActions({
                onReset(count: number) {
                    return App.actions.onCounterReset(-1, count);
                }
            }, scopeActions<MultipleCountersState>("bottom")(Counter.actions));
        },

        init: () => (state: MultipleCountersState, executor: Executor<MultipleCountersState>) => {
            let counters = state.counters.map((counter, idx) => {
                state = App.actions.counterActions(idx).startRandomIncrement()(state, executor);
            });
            return state;
        },

        onCounterChange: (idx: number) => (state: MultipleCountersState, effects: Executor<MultipleCountersState>) => {
            const counter = state.counters[idx];
            if (counter == 10) {
                //TODO : déclenche des appels en boucle. App.actions.counterActions(idx) déclenche onCounterChange et son side effect aussi
                state = App.actions.counterActions(idx).setValue(0)(state, effects);
                if (idx + 1 < state.counters.length) {
                    //TODO : déclenche des appels en boucle. App.actions.counterActions(idx) déclenche onCounterChange et son side effect aussi
                    state = App.actions.counterActions(idx + 1).increment()(state, effects);
                }
                return {...state, total: getTotal(state.counters)};
            } else {
                return {...state, total: getTotal(state.counters)};
            }
        },


        onCounterReset(idx: number, count: number) {
            console.log("event received from counter " + idx, count);
            return (state: MultipleCountersState) => {
                return {...state, total: getTotal(state.counters)};
            };
        }

    }

};

