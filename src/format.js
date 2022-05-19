import _ from "lodash";
import { format as formatFn, formatMoment } from "format-99xp";

// timeforce-format
// ---------------
var format = { Model: {}, Collection: {} };

// Expose format function
format.Model._format = formatFn;
format.Collection._format = formatFn;


// List of formatting options
format.Model.format = {};

// Apply formatting options to itself data
format.Model.formatMe = function (moment = formatMoment.FROMREMOTE) {
    this.attributes = this.formatData(this.attributes, {}, moment);
};

// Apply formatting options to data clone
format.Model.formatCopy = function (attrs, moment = formatMoment.FROMREMOTE) {
    return this.formatData(_.cloneDeep(attrs || this.attributes), {}, moment);
};

format.Model.formatData = function (data, options, moment = formatMoment.FROMREMOTE) {
    var formatList = _.result(this, "format");

    if (
        data &&
        "format" in this &&
        typeof formatList === "object" &&
        _.size(formatList) > 0
    ) {
        var field;

        for (field in formatList) {
            let fieldFormatName = /\w+\[/.test(field)
                ? field.replace(/^(\w+\.)\d+/, "$1.")
                : field;
            let fieldList;

            if (!/\.\d*\./.test(fieldFormatName)) {
                fieldFormatName = /\.\w+\.\d+/.test(fieldFormatName)
                    ? fieldFormatName.replace(/\.(\w+\.)\d+/, ".$1.")
                    : fieldFormatName;

                fieldList = [fieldFormatName];
            } else {
                // format for inside list fields
            }

            for (let x in fieldList) {
                let fieldItem = fieldList[x];
                data = this.formatDataItem(
                    fieldItem,
                    moment,
                    fieldFormatName,
                    data,
                    options
                );
            }
        }
    }

    return data;
};

// Return formatted data of a field without changing it
format.Model.formatDataItem = function (
    field,
    m = formatMoment.FROMREMOTE,
    fieldFormatName,
    data
) {
    var formatFieldList = _.result(this, "format");

    typeof data === "undefined" && (data = _.cloneDeep(this.attributes));
    !fieldFormatName && (fieldFormatName = field);
    var formatList = formatFieldList[fieldFormatName];

    !_.isArray(formatList) && (formatList = [formatList]);
    for (let _format of formatList) {
        var value = this.formatItem(field, m, data, _format);

        if (typeof value !== "undefined") {
            data = this.formSetTreeVal(field, value, data);
        }
    }

    return data;
};

// Apply format option to data of a field without changing it
format.Model.formatItem = function (field, moment, data, _format) {
    var formatList = _.result(this, "format");
    typeof data === "undefined" && (data = _.cloneDeep(this.attributes));
    typeof _format === "undefined" && (_format = formatList[field]);

    typeof _format === "function" && (_format = _.bind(_format, this));
    var value = this.getDataByPath(field, data);// = _.deepValueSearch(field, data);
    if (typeof value !== "undefined") {
        value = formatFn(value, _format, moment);
    }
    return value;
};

// Format json received from remote source
format.Model.parse = function (response, options) {
    typeof this.formatData === "function" &&
        (response = this.formatData(response, options, formatMoment.FROMREMOTE));
    return response;
};

// Get formatted json to send to a remote source
format.Model.toJSON = function (options = {}) {
    var json = this.getJSONtoFormat(options);
    typeof this.formatData === "function" &&
        (json = this.formatData(json, options, formatMoment.TOREMOTE));
    return json;
};

// Get a deep copy of data
format.Model.getJSONtoFormat = function (options = {}) {
    return _.cloneDeep(options?.data || this.attributes);
};

// Retrieve field value
format.Model.getDataByPath = function (path, attrs, defaultVal) {
    var val = defaultVal;
    eval(`try { val = attrs.${path}; } catch(e) { }`);

    return val;
};

// Set tree location of a field avoiding error when tree is not yet set
format.Model.formSetTree = function (path, attrs) {
    var splitPath = path.split('.'),
        composedPath = [];
    for (var x in splitPath) {
        composedPath.push(splitPath[x]);
        this.formSetTreeObj(composedPath.join('.'), attrs);
    }
    return attrs;
};

//
format.Model.formSetTreeObj = function (path, attrs) {
    var value = this.getDataByPath(path, attrs);
    if (typeof value === 'undefined')
        eval(`attrs.${path} = {};`);
    return attrs;
};

// Set field value even if its under a tree
format.Model.formSetTreeVal = function (path, val = "", attrs) {
    attrs = this.formSetTree(path, attrs);

    typeof val === 'string' && (val = `'${val}'`);
    typeof val === 'object' && (val = JSON.stringify(val));

    eval(`attrs.${path} = ${val}`);
    return attrs;
};

// Format all models with data received from remote source
format.Collection.formatModels = function () {
    if (!this.models) return;
    for (let model of this.models) {
        model.formatMe();
    }
};

// Format all models to send to a remote source
format.Collection.unformatModels = function () {
    if (!this.models) return;
    for (let model of this.models) {
        model.unformatMe(formatMoment.TOREMOTE);
    }
};

// Mix in each Formatter methods as a proxy to `Collection#models`.
var mix = function (Collection, Model) {
    _.each([
        [Collection, format.Collection],
        [Model, format.Model]
    ], function (config) {
        var Class = config[0];
        var methods = config[1];

        _.each(methods, function (fn, method) {
            Class.prototype[method] = fn;
        });
    });
    // return [Collection, Model];
}

export { mix };
