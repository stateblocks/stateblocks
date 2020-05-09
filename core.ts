export type Reducer<S, C = void> = (state: S, executor?: Executor<S, C>) => S

/**
 * An executor is a function taking an effect to execute. The effect may require a part of the executor context,
 * or no context at all
 */
export type Executor<S, C = void> = (effect: Effect<S, C>) => void;

export type Effect<S, C> = (state: S, handler: ReducerHandler<S, C>, ctx: C) => Promise<void> | void;

export type ReducerCreator<A extends any[], S, C = void> = (...args: A) => Reducer<S, C>

export type ReducerHandler<S, C = void> = (reducer: Reducer<S, C>) => Promise<void>

export type ReducerCreatorWithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S, void> : never

export type ContextEraser<R> = (action: R) => ReducerCreatorWithoutContext<R>

export type FunctionsContext = { [key: string]: (...args: any) => void | Promise<void> }

export type ContextToActionMap<C> = { [K in keyof C]: (...args: any) => any }


export type StatePart<S, K extends IndexType<S>> = S extends Array<infer T> ? T :
    K extends keyof S ? S[K] : never

export type IndexType<S> = S extends any[] ? number : keyof S;


type WithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S> : never;

export type ReducerMapWithoutContext<R> = { [P in keyof R]: WithoutContext<R[P]> }

export type ActionMap<S, C> = { [key: string]: (ReducerCreator<any[], S, C> | ((...args: any[]) => ActionMap<S, C>)) | ActionMap<S, C> }

export type ActionToMethod<A> =
    A extends (...args: any) => any ?
        ReturnType<A> extends (...args: any) => any ?
            (...args: Parameters<A>) => Promise<void>
            : (...args: Parameters<A>) => ActionMapToMethodMap<ReturnType<A>>
        : A extends Object ?
        ActionMapToMethodMap<A>
        : never

export type ActionMapToMethodMap<M> = { [K in keyof M]: ActionToMethod<M[K]> }

export type ActionMapToCtx<M> = M extends ActionMap<infer S, infer C> ? C : never

type ActionWithState<T, S> = T extends ReducerCreator<infer A, infer S1, infer C> ?
    ReducerCreator<A, S, C>
    :
    T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithState<ReturnType<T>, S>
        :
        { [K in keyof T]: ActionWithState<T[K], S> }

export type ActionMapWithState<M, S> = ActionWithState<M, S>

type ActionWithCtx<T, C> = T extends ReducerCreator<infer A, infer S, infer C1> ?
    ReducerCreator<A, S, C>
    : T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithCtx<ReturnType<T>, C>
        : { [K in keyof T]: ActionWithCtx<T[K], C> }

export type ActionMapWithCtx<M, C> = ActionWithCtx<M, C>

type ActionWithReducer<T, R1, R2> = T extends (...args: infer A) => R1 ?
    (...args: A) => R2
    :
    T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithReducer<ReturnType<T>, R1, R2>
        : { [K in keyof T]: ActionWithReducer<T, R1, R2> }

export type ActionMapWithReducer<M, R1, R2> = ActionWithReducer<M, R1, R2>

type AsActionMapItem<T> = T extends ReducerCreator<infer A, infer S, infer C> ?
    ReducerCreator<A, S, C>
    : T extends (...args: any[]) => Object ?
        AsActionMap<ReturnType<T>>
        : AsActionMap<T>

type AsActionMap<M> = { [K in keyof M]: AsActionMapItem<M[K]> }


export type WithoutOrVoid<C1, C> =
    C1 extends void ? void :
        C1 extends never ?
            void
            : keyof Omit<C1, keyof C> extends never ?
            void :
            Omit<C1, keyof C>


export function updateState<S, K extends IndexType<S>>(state: S, key: K, subState: StatePart<S, K>) {
    if (Array.isArray(state)) {
        if (subState !== state[key]) {
            let newState = [...state];
            newState[key as number] = subState;
            return newState as any as S;
        } else {
            return state;
        }
    } else {
        if ((state as any)[key] !== subState) {
            return {...state, [key]: subState};
        } else {
            return state;
        }
    }
}




