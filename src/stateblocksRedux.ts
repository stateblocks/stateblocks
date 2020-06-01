import {Action, AnyAction, Dispatch, Middleware} from "redux";
import {createStore as createSBStore} from "./store";
import {ThunkAction} from "redux-thunk";
import {Reducer} from "./core";


export function createTruc<T extends string>(actionType: string, argName: T) {
    let reducer = <S>(state: S, action: { [P in T]: S }) => {
        return action[argName]
    }
    return reducer
}

createTruc("test", "truc")(1, {truc: 1})


export const stateblocksReducer = <S>(initialState:S, actionType = "STATEBLOCKS_UPDATE") => (state: S = initialState, action: DefaultStateUpdateAction<S>) => {
    if (action.type == actionType) {
        return action.newState
    } else {
        return state
    }
}

export function applyReducer<S>(reducer:Reducer<S>, type = "STATEBLOCKS_ACTION"){
    return {
        type,
        reducer
    }
}

export interface DefaultStateUpdateAction<S> extends Action {
    type: "STATEBLOCKS_UPDATE",
    newState: S
}


export const defaultActionCreator = (actionType = "STATEBLOCKS_UPDATE") => <S>(newState: S) => ({
    type: "STATEBLOCKS_UPDATE",
    newState
});

export type StateBlockDispatch<S> = {
    (sbReducer: Reducer<S>): any;
}

export type StateUpdateActionCreator<S> = (newState: S) => any

export function useStateBlocks<S>(
    stateUpdateActionsCreator: StateUpdateActionCreator<S> = defaultActionCreator(),
    reduxActionMapper: (action: any) => Reducer<S> = reducer => reducer,
    selector:(state:any) => any = state => state
): Middleware<StateBlockDispatch<S>, S> {
    return ({dispatch, getState}) => {

        const sbStore = createSBStore(null)

        return (next: Dispatch) => {

            sbStore.listener = (state: S) => next(stateUpdateActionsCreator(state))

            return (action: any) => {
                let reducer = reduxActionMapper(action)
                if (reducer) {
                    sbStore.state = selector(getState());
                    sbStore.update(reducer);
                } else {
                    next(action as any)
                }
            };
        };
    }
}

