import {
    Executor,
    ReducerHandler,
} from "../core";
import {Counter, CounterState} from "./Counter";
import {actionsWithListener, provideContext, scopeActions} from "../actions";
import {handleActionMap} from "../handlers";
import {contextWithActions} from "../context";


export type MultipleCountersState = {
    counters: CounterState[],
    top: CounterState,
    bottom: CounterState,
    total: number,
    max: number
}


function getTotal(counters: CounterState[]) {
    let result = 0;
    for (let i = 0; i < counters.length; i++) {
        result += counters[i] * Math.pow(10, i);
    }
    return result;
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

            let counterActions = provideContext(contextWithActions({
                onReset: (count: number) => App.actions.onCounterReset(idx, count)
            }), scopeActions<MultipleCountersState>("counters")(scopeActions<CounterState[]>(idx)( Counter.actions)));
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
            return provideContext(contextWithActions({
                onReset(count: number) {
                    return App.actions.onCounterReset(-1, count);
                }
            }), scopeActions<MultipleCountersState>("top")(Counter.actions));
        },

        //TODO : si on met pas ca sous forme de fonction le typage de App est circulaire
        bottom() {
            return provideContext(contextWithActions({
                onReset(count: number) {
                    return App.actions.onCounterReset(-1, count);
                }
            }), scopeActions<MultipleCountersState>("bottom")(Counter.actions));
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

