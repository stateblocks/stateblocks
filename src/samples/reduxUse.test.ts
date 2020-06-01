import {
    Action,
    AnyAction,
    applyMiddleware,
    combineReducers,
    createStore,
    Dispatch,
    Middleware,
    MiddlewareAPI,
    Store
} from "redux";
import {createStore as createSBStore} from "../store";
import {sleep} from "./utils";
import {applyReducer, defaultActionCreator, stateblocksReducer, useStateBlocks} from "../stateblocksRedux";
import thunk, {ThunkAction, ThunkDispatch} from 'redux-thunk';
import {Reducer} from "../core";
import {scopeActions} from "../actions";

const counter = (state = 0, action: AnyAction) => {
    switch (action.type) {
        case 'INCREMENT':
            return state + 1
        case 'DECREMENT':
            return state - 1
        default:
            return state
    }
};

const actions = {
    increment: () => (state: number) => {
        return state + 1;
    },

    incrementLater: () => (state: number, executor: any) => {
        executor(async (state: any, dispatch: any) => {
            await sleep(10);
            dispatch(actions.increment())
        })
        return state;
    }
}
test("usage with redux", async () => {


    const store = createStore(stateblocksReducer(0), applyMiddleware(useStateBlocks()))


    store.subscribe(() => {
        console.log(store.getState());
    })

    store.dispatch(actions.increment())
    store.dispatch(actions.incrementLater())

    await sleep(20);

    expect(store.getState()).toBe(2)

})

test("use in sub-reducer", async () => {

    const rootReducer = combineReducers({
        top: counter,
        bottom: stateblocksReducer(0, "STATEBLOCKS_UPDATE")
    })

    const store: any = createStore(rootReducer, applyMiddleware(
        useStateBlocks(
            defaultActionCreator("STATEBLOCKS_UPDATE"),
            (action: any) => {
                if (action.type == "STATEBLOCKS_ACTION") {
                    return action.reducer
                }
            },
            state => state.bottom
        )));

    store.subscribe(() => {
        console.log(store.getState());
    })

    store.dispatch({type: "INCREMENT"})

    const rootActions = (actions);

    store.dispatch(applyReducer(rootActions.increment(), "STATEBLOCKS_ACTION"))

})

test("use with other middlewares", async () => {

    type State = number


    const rootReducer = combineReducers({
        top: counter
    })

    const store: any = createStore(rootReducer, applyMiddleware(thunk));

    store.subscribe(() => {
        console.log(store.getState());
    })

    store.dispatch({type: "INCREMENT"})

    store.dispatch((dispatch: any) => {
        setTimeout(() => {
            dispatch({type: "INCREMENT"})
        }, 10)
    })

    await sleep(15)
})