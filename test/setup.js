import timeforce from 'timeforce';
import { mix } from '../src/format.js';

// setup
var sync = timeforce.sync;
var persist = timeforce.persist;
var env = {};

// Mix in each Formatter methods as a proxy to `Collection#models`.
mix(timeforce.Collection, timeforce.Model);

// Capture axios settings for comparison.
timeforce.persist = function (settings) {
    env.persistSettings = settings;
};

// Capture the arguments to timeforce.sync for comparison.
timeforce.sync = function (method, model, options) {
    env.syncArgs = {
        method: method,
        model: model,
        options: options
    };

    return sync.apply(this, arguments);
};



export { env, timeforce };