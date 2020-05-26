import {CtxBuilderToCtxUnion} from "./actions";

export type Reducer<S, C extends {} = {}> = ReducerWithContext<S, C>

export type ReducerSimple<S> = (state: S) => S

export type ReducerWithContext<S, C extends {} = {}> = (state: S, executor: Executor<S, C>) => S

/**
 * An executor is a function taking an effect to execute. The effect may require a part of the executor context,
 * or no context at all.
 * TODO : executor should accept effects that require less context than C, but should provide all context to effects without explicit typing.
 *
 */
export type Executor<S, C extends {} = {}> = (effect: Effect<S, C>) => void;

export type Effect<S, C extends {} = {}> = (state: S, handler: ReducerHandler<S, C>, ctx: C) => Promise<void> | void;
// export type Effect<S, C = void> = (state: S, handler: (reducer: ((state: S, executor: Executor<S, C>) => S) | ((state: S, executor: Executor<S, void>) => S) | ((state: S) => S)) => Promise<void>, ctx: C) => Promise<void> | void;

export type ReducerCreator<A extends any[], S, C extends {} = {}> = (...args: A) => Reducer<S, C>

export type ReducerCreatorWithCtx<A extends any[], S, C extends {} = {}> = (...args: A) => ReducerWithContext<S, C>

export type ReducerCreatorSimple<A extends any[], S> = (...args: A) => ReducerSimple<S>

export type ReducerHandler<S, C extends {} = {}> = (reducer: Reducer<S, C>) => Promise<void>

export type ReducerCreatorWithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S> : never

export type ContextEraser<R> = (action: R) => ReducerCreatorWithoutContext<R>

export type FunctionsContext = { [key: string]: (...args: any) => void | Promise<void> }

export type ContextToActionMap<C> = { [K in keyof C]: (...args: any) => any }


export type StatePart<S, K extends IndexType<S>> = S extends Array<infer T> ? T :
    K extends keyof S ? S[K] : never

export type IndexType<S> = S extends any[] ? number : keyof S;


type WithoutContext<R> = R extends ReducerCreator<infer A, infer S, infer C> ? ReducerCreator<A, S> : never;

export type ReducerMapWithoutContext<R> = { [P in keyof R]: WithoutContext<R[P]> }

// Type inference doesn't work well with type referencing itself so we use another type ActionMap2
export type ActionMap<S, C> = { [key: string]: (ReducerCreator<any[], S, C> | ((...args: any[]) => ActionMap2<S, C>)) | ActionMap2<S, C> }
type ActionMap2<S, C> = { [key: string]: (ReducerCreator<any[], S, C> | ((...args: any[]) => ActionMap<S, C>)) | ActionMap<S, C> }

export type ActionToMethod<A> =
    A extends (...args: any) => any ?
        ReturnType<A> extends (...args: any) => any ?
            (...args: Parameters<A>) => void
            : (...args: Parameters<A>) => ActionMapToMethodMap<ReturnType<A>>
        :
        A extends Object ?
            ActionMapToMethodMap<A>
            : never

export type ActionMapToMethodMap<M> = { [K in keyof M]: ActionToMethod<M[K]> }


type ValuesTypes<M> = M[keyof M]

type ActionsMapToCtxMap<M> = {
    [P in keyof M]:
    M[P] extends ReducerCreatorSimple<infer A, infer S> ? void :
        M[P] extends ReducerCreator<infer A, infer S, infer C> ? C :
            M[P] extends (...args: any) => infer M2 ? ValuesTypes<ActionsMapToCtxMap<M2>> :
                M[P] extends Object ? ValuesTypes<ActionsMapToCtxMap<M[P]>> :
                    never
}

export type ActionMapToCtxIntersection<M> = UnionToIntersection<ValuesTypes<ActionsMapToCtxMap<M>>>

export type ActionMapToCtx<M> = M extends ActionMap<infer S, infer C> ? C : never

export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type ActionMapToState<M> = M extends ActionMap<infer S, infer C> ? S : never

type ActionWithState<T, S> =
    T extends ReducerCreatorSimple<infer A, infer S1> ? ReducerCreatorSimple<A, S>
        : T extends ReducerCreatorWithCtx<infer A, infer S1, infer C> ? ReducerCreatorWithCtx<A, S, C>
        : T extends (...args: any[]) => Object ? (...args: any[]) => ActionMapWithState<ReturnType<T>, S>
            : { [K in keyof T]: ActionWithState<T[K], S> }

export type ActionMapWithState<M, S> = ActionWithState<M, S>

// type ActionWithState<T, S> = { [K in keyof T]: T[K] extends ReducerCreator<infer A, infer S1, infer C> ? ReducerCreator<A, S, C> : void }

type ActionWithCtx<T, C> = T extends ReducerCreator<infer A, infer S, infer C1> ?
    ReducerCreator<A, S, C>
    : T extends (...args: any[]) => Object ?
        (...args: any[]) => ActionMapWithCtx<ReturnType<T>, C>
        : { [K in keyof T]: ActionWithCtx<T[K], C> }

export type ActionMapWithCtx<M, C extends {}> = ActionWithCtx<M, C>


type ActionWithCtxBuilder<T, C> =
    T extends ReducerCreatorSimple<infer A, infer S> ? ReducerCreatorSimple<A, S>
        : T extends ReducerCreatorWithCtx<infer A, infer S, infer C1> ? ReducerCreator<A, S, CtxBuilderToCtxUnion<C, C1>>
        : T extends (...args: any[]) => Object ? (...args: any[]) => ActionMapWithCtxBuilder<ReturnType<T>, C>
            : { [K in keyof T]: ActionWithCtxBuilder<T[K], C> }

export type ActionMapWithCtxBuilder<M, C> = ActionWithCtxBuilder<M, C>


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

export type OmitPart<C1, C> = Exclude<keyof C1, keyof C> extends never ? {} : Omit<C1, keyof C>

export type UnionOrVoid<A, B> =
    B extends void ?
        A :
        A extends void ?
            B :
            A & B

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

