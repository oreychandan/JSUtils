// explore the usage of Signals

import * as _ from '../lib/core.js';
import { E } from '../lib/core.js';
import { MapMutable } from '../lib/core.js';
import * as D from '../lib/dom.js';

const Demos = {
  demo1: () => {
    // Create a mutable signal with an initial value
    const signal = _.Signal(0, value => {
      // This function will be called whenever the signal is updated
      _.Log(`Signal updated to: ${value}`);
    });

    // Emit a new value to the signal
    signal.set(1); // This will trigger the log in the event callback

    // Emit another value to demonstrate multiple updates
    signal.set(2); // This will also trigger the log in the event callback
  },
  // New demo with two dependent signals
  demo2: () => {
    // Create the first signal with an initial value
    const baseSignal = _.Signal(5, {
      log: value => {
        _.Log(`Base signal updated to: ${value}`);
      },
    });
    const EmitCurrent = signal => _.Emit(signal.event.get(), signal.get());
    EmitCurrent(baseSignal);

    // Create the second signal that depends on the first signal
    const double = n => n * 2;
    const dependentSignal = _.Signal(double(baseSignal.get()), value => {
      _.Log(`Dependent signal updated to: ${value}`);
    });
    EmitCurrent(dependentSignal);
    baseSignal.event.get().toDependentSignal = n => {
      _.Log(`Mapping from base signal to dependent signal`);
      dependentSignal.set(double(n));
    };

    // Update the base signal, which will also update the dependent signal
    baseSignal.set(9); // This will trigger the log for the base signal
    dependentSignal.set(11); // Manually update dependent signal
  },
  demo3: () => {
    // test array signal
    const arr = _.Signal(
      {
        data: ['a', 'b', 'c'],
        mode: 'init',
      },
      value => {
        _.Log(value);
      }
    );
  },
};
const $arr = _.Signal({ data: ['a', 'b', 'd'], mode: 'init' });
$arr.set(
  (() => {
    const o = [...$arr.get()];
    o.prev = o.data[2];
    o.data[2] = 'c';
    o.mode = 'update';
    o.key = 2;
    return o;
  })()
);


const RunDemo = demoName => {
  // Log a message to indicate the start of the demo
  _.LogGroup(`Running ${demoName}...`);
  Demos[demoName](); // Call the demo function by name
  // Log a message to indicate the end of the demo
  _.LogGroupEnd();
};

// Run the demo by name
RunDemo('demo2');
