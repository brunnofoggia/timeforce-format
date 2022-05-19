import assert from 'assert';
import _ from 'lodash';
import CryptoJS from "crypto-js";

import { env, timeforce } from './setup.js';


describe('Format', function () {

    var ProxyModel = timeforce.Model.extend({
        urlRoot: '/movie/',
        format: {
            title: 'lowercase',
            classification: 'uppercase',
            pass: 'send-sha256',
            token: ['lowercase', 'send-md5'],
            duration: 'int',
            someData: 'json',
            release: 'date',
            budget: 'float',
            imdb: 'float',
            producers: { type: 'objectArray', index: 'position' },
            active: 'bool'
        }
    });

    var attrs = {
        id: 1,
        title: 'Pacific Rim',
        classification: 'Science Fiction',
        pass: 'string123',
        token: 'String123',
        duration: '131',
        someData: { n: 5 },
        release: '09/08/2013',
        budget: '180.000.000,00',
        imdb: '6,90',
        producers: {
            'director': { name: 'Guillermo del Toro', position: 'director' },
            'writer': { name: 'Travis Beacham', position: 'writer' },
        },
        active: '1'
    }, model;

    beforeEach(async (done) => {
        done();
    });

    it('format options when sending to remote source', function () {
        // assert.expect(4);
        model = new ProxyModel(attrs);
        model.save();
        var data = env.persistSettings.data;
        // console.log(env.persistSettings.data);
        assert.equal(data.title, 'pacific rim');
        assert.equal(data.classification, 'SCIENCE FICTION');
        assert.ok(data.pass.length > 50);
        assert.equal(data.token, CryptoJS.MD5(attrs.token.toLowerCase()).toString());
        assert.equal(data.duration, 131);
        assert.equal(data.someData, '{"n":5}');
        assert.equal(data.release, '2013-08-09');
        assert.equal(data.budget, 180000000);
        assert.equal(data.imdb, 6.9);
        assert.deepEqual(data.producers, _.toArray(attrs.producers));
        assert.equal(data.active, true);
    });

    it('format options when receiving to remote source', function () {
        // assert.expect(4);
        var remoteAttrs = _.cloneDeep(env.persistSettings.data);

        remoteAttrs.id = 1;
        model = new ProxyModel({ id: 1 });
        model.fetch();
        env.persistSettings.success(remoteAttrs);
        assert.equal(env.persistSettings.url, '/movie/1');
        assert.deepEqual(
            _.omit(attrs, 'title', 'classification', 'pass', 'token', 'duration'),
            _.omit(model.attributes, 'title', 'classification', 'pass', 'token', 'duration'));
    });


});
