'use strict';

/**
 *
 * @name: ExtPlaneJs
 * @author: Wade Wildbore - Bluu Interactive
 * @description: ExtPlane TCP Connector for NodeJS
 * @see: https://github.com/vranki/ExtPlane - For more information
 */
var EventEmitter = require('events').EventEmitter;
var client = require('./client');
var util = require('util');
var async = require('async');
var base64 = require('base-64');

function ExtPlaneJs(config){

    // Ref to &this
    var self = this;

    // CTOR
    EventEmitter.call(this);

    // ExtPlaneJs Config
    this.config = config;

    if (this.config.debug) console.log("ExtPlaneJs initialized with config:", config);

    // ExtPlane TCP Client
    this.client = client(this.config);

    // Couple the TCP clients on data event to ExtPlaneJs
    this.client.on('data', function(data){
        if (self.config.debug) console.log("Received data:", data);
        self.emit('data', data);
    });

    /**
     *
     * Loaded
     *
     */
    this.on('loaded', function(){
        if(this.config.debug) console.log('ExtPlane Ready!');
    });

    /**
     *
     * Data
     *
     * @param {string} data
     */
    this.on('data', function(data){

        if (this.config.debug) console.log("Processing data:", data);

        if(data.toString().includes('EXTPLANE'))
        {
            if (this.config.debug) console.log("EXTPLANE detected, emitting 'loaded' event.");
            return this.emit('loaded');
        }

        if (this.config.debug) console.log("Emitting 'parse' event with data:", data.toString());
        return this.emit('parse', data.toString());

    });

    /**
     *
     * Parse
     *
     * Either emit single data-ref events, or broadcast all data-ref events on one handler
     *
     * @param {string} data
     */
    this.on('parse', function(data){

        if (self.config.debug) console.log("Parsing data:", data);

        var commands = data.trim().split('\n');

        async.each(commands, function(cmd, cb){

            if (self.config.debug) console.log("Parsing command:", cmd);
            self.parseDataRef(cmd, cb);

        }, function(err){
            if(err && self.config.debug) console.log("Error parsing commands:", err);
        });

    });

    /**
     *
     * Parse an Individual Data Ref
     *
     * @param {string} data_ref - The data_ref response
     * @param {function} cb - The done callback
     */
    this.parseDataRef = function(data_ref, cb){

        if (this.config.debug) console.log("Parsing individual data ref:", data_ref);

        var params = data_ref.split(' ');

        // if not data-ref output, break
        if(params[0][0] !== 'u') {
            if (this.config.debug) console.log("Invalid data ref, skipping:", data_ref);
            return false;
        }

        // data-ref
        data_ref = params[1];
        var type = params[0].substring(1);
        var value = this.parseValue(type, params[2]);

        if (this.config.debug) console.log("Emitting data ref:", data_ref, "with value:", value);

        // emit - data_ref, value or 'data-ref', data_ref, value
        !this.config.broadcast ? this.emit(data_ref, data_ref, value) : this.emit('data-ref', data_ref, value);

        // done
        return cb(null);
    };

    /**
     *
     * Parse ExtPlanes TCP Text Based Response
     *
     * Override type value conversions from ExtPlanes response
     *
     * @param {string} - type
     * @param {string} - value
     */
    this.parseValue = function(type, value){

        if (this.config.debug) console.log("Parsing value of type:", type, "with value:", value);

        switch(type)
        {
            // int
            case 'i':
                return parseInt(value);

            // float
            case 'f':
                return parseFloat(value);

            // int array
            case 'ia':
                return JSON.parse(value);

            // float array
            case 'fa':
                return JSON.parse(value);

            // base64 data
            case 'b':
                return base64.decode(value);

            default:
                return value;
        }
    };
};

util.inherits(ExtPlaneJs, EventEmitter);

module.exports = ExtPlaneJs;
