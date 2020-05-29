import {Dispatch, Middleware} from "redux";
import {createStore as createSBStore} from "./store";


export const defaultActionCreator = <S>(newState: S) => ({
    type: "STATEBLOCKS_UPDATE",
    newState
});

export type ReduxActionCreator<S, A> = (newState: S) => A

export function useStateBlocks<S, A>(initialState: S, actionType: ReduxActionCreator<S, A>): Middleware {
    return (store) => {

        const sbStore = createSBStore(0)

        return (next: Dispatch) => {

            sbStore.listener = (state: any) => next({
                type: actionType,
                newState: state
            })

            return (action: any) => {
                sbStore.state = store.getState() ?? initialState;
                sbStore.update(action);
            };
        };
    }
}

