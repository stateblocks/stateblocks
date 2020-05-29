import {Action, applyMiddleware, createStore, Dispatch, Middleware, MiddlewareAPI, Store} from "redux";
import {createStore as createSBStore} from "../store";
import {sleep} from "./utils";
import {defaultActionCreator, useStateBlocks} from "../stateblocksRedux";

test("usage with redux", async () => {


    const reducer = (state: any, action: any) => {
        return action.newState;
    }

    const store = createStore(reducer, applyMiddleware(useStateBlocks(0, defaultActionCreator)))

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

    store.subscribe(() => {
        console.log(store.getState());
    })

    store.dispatch(actions.increment())
    store.dispatch(actions.incrementLater())

    await sleep(20);

})