import * as React from "react";
import * as ReactDOM from "react-dom";
import {Store} from "../store";
import {App, MultipleCountersState} from "./MultipleCounters";
import {handle, handleActionMap} from "../handlers";



// App.updater(null).counterActions(42).increment();

type CounterProps = { counter: number, increment: () => void, decrement: () => void }

class CounterView extends React.Component<CounterProps> {
    render() {
        return <li>{this.props.counter}
            <button onClick={this.props.decrement}>-</button>
            <button onClick={this.props.increment}>+</button>
        </li>
    }
}



class AppView extends React.Component<{ store: Store<MultipleCountersState> }> {


    render() {
        const store = this.props.store;
        const rootHandler = store.update;
        const rootActions = App.actions;
        const updater = App.updater(store.update);
        return <div>
            top :
            <CounterView counter={store.state.top}
                         increment={updater.top().increment}
                         decrement={updater.top().decrement}
                // decrement={handleReducer(handler, App.actions().counterActions(idx).decrement)}
            />
            bottom :
            <CounterView counter={store.state.bottom}
                         increment={updater.bottom().increment}
                         decrement={updater.bottom().decrement}
                // decrement={handleReducer(handler, App.actions().counterActions(idx).decrement)}
            />
            <ul style={{display:"flex", flexDirection:"row-reverse"}}>
                {this.props.store.state.counters.map((counter, idx) => {
                    let actions = handleActionMap(rootHandler, rootActions.counterActions(idx));
                    // let actions = handler(store.update) App.actions().counterActions(idx);
                    return <CounterView counter={counter}
                                        increment={handle(rootHandler)(rootActions.counterActions(idx).increment)}
                                        decrement={actions.decrement}
                        // decrement={handleReducer(handler, App.actions().counterActions(idx).decrement)}
                                        key={idx}/>
                })}
            </ul>
            <div>{this.props.store.state.total}</div>
        </div>;
    }

    componentDidMount(): void {
        this.props.store.onChange(() => this.forceUpdate());
    }


}


// var store = new NStore(DoubleApp.initialState);
//
// store.update(DoubleApp.actions.init());
// // @ts-ignore
// store.update(DoubleApp.actions.right.counterActions(1).increment());

var store = new Store(App.initialState);
store.update(App.actions.init());

ReactDOM.render(<AppView store={store}/>, document.getElementById("root"));