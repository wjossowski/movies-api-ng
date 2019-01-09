const chai = require('chai');
const expect = chai.expect;

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../app');
const { db } = require('../db');

describe('Comments', function () {

    before((done) => {
        db.seed.run().then(() => done() );
    })

    after((done) => {
        db.seed.run().then(() => done() );
    })

    describe('/GET comments', function () {

        it ('GET all comments', function(done) {
            chai.request(server)
                .get('/api/v1/comments')
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const comments = Array.from(res.body);
                    expect(comments).to.be.lengthOf(8);

                    comments.forEach((comment) => {
                        expect(comment).to.haveOwnProperty('movie_id');
                        expect(comment).to.haveOwnProperty('user');
                        expect(comment).to.haveOwnProperty('title');
                        expect(comment).to.haveOwnProperty('contents');
                    });

                    done();
                });
        });

    });

    describe('/GET comments :user', function () {

        it ('GET comments from existing user', function (done) {
            chai.request(server)
                .get('/api/v1/comments/boris')
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const comments = Array.from(res.body);

                    expect(comments).to.be.lengthOf(3);
                    comments.forEach((comment) => {
                        expect(comment).to.haveOwnProperty('movie_id');
                        expect(comment).to.haveOwnProperty('user');
                        expect(comment).to.haveOwnProperty('title');
                        expect(comment).to.haveOwnProperty('contents');
                    });

                    done();
                });
        });

        it ('GET 0 comments from not existing user', function (done) {
            chai.request(server)
                .get('/api/v1/comments/foo')
                .then((res) => {
                    expect(res).to.have.status(404);
                    expect(res).to.be.json;

                    done();
                });
        });

    });

    describe('/POST comments', function () {

        this.beforeEach((done) => {
            db.seed.run().then(() => done() )
        });

        this.afterEach((done) => {
            db.seed.run().then(() => done() )
        });

        it ('POST comment for existing movie', function (done) {
            Promise.all([
                // Fetch existing messages
                chai.request(server)
                    .get('/api/v1/comments')
                    .then((res) => Array.from(res.body).length),

                // Post new message
                chai.request(server)
                    .post('/api/v1/comments')
                    .set('content-type', 'application/x-www-form-urlencoded')
                    .send({
                        "movie_id": 1,
                        "user": "Foo",
                        "title": "Foo",
                        "contents": "lorem2137"
                    }),

            ]).then(([amount, res]) => {
                expect(res).to.have.status(201);

                // Fetch new amount
                chai.request(server)
                    .get('/api/v1/comments')
                    .then((res) => Array.from(res.body).length)
                    .then((newAmount) => {
                        // Check if new was added
                        expect(newAmount - amount).to.be.equal(1);
                        done();
                    });

            });
        });

        it ('POST comment fails with missing movie_id', function (done) {
            chai.request(server)
                .post('/api/v1/comments')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    "user": "Foo",
                    "title": "Foo",
                    "contents": "lorem2137"
                })
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;

                    done();
                });
        });

        it ('POST comment fails with missing user', function (done) {
            chai.request(server)
                .post('/api/v1/comments')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    "movie_id": 1,
                    "title": "Foo",
                    "contents": "lorem2137"
                })
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;

                    done();
                });
        });

        it ('POST comment fails with missing title', function (done) {
            chai.request(server)
                .post('/api/v1/comments')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    "movie_id": 1,
                    "user": "Foo",
                    "contents": "lorem2137"
                })
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;

                    done();
                });
        });

        it ('POST comment fails with missing contents', function (done) {
            chai.request(server)
                .post('/api/v1/comments')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    "movie_id": 1,
                    "user": "Foo",
                    "title": "Foo"
                })
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;

                    done();
                });
        });

        it ('POST comment fails on invalid movie', function (done) {
            chai.request(server)
                .post('/api/v1/comments')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    "movie_id": 200,
                    "user": "Foo",
                    "title": "Foo",
                    "contents": "lorem2137"
                }).then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;

                    done();
                });
        });

    });

    describe('/DELETE comments :id', function () {

        it ('DELETE removes existing comment', function (done) {
            Promise.all([
                // Count existing comments
                chai.request(server)
                    .get('/api/v1/comments')
                    .then((res) => Array.from(res.body).length),

                // Delete one comment
                chai.request(server)
                    .delete('/api/v1/comments/1')
            ]).then(([amount, res]) => {
                expect(res).to.have.status(200);

                chai.request(server)
                    .get('/api/v1/comments')
                    .then((res) => Array.from(res.body).length)
                    .then((newAmount) => {
                        expect(newAmount - amount).to.be.be.equal(-1);
                        done();
                    });

            });
        });

        it ('DELETE raises error on invalid comment id', function (done) {
            chai.request(server)
                .delete('/api/v1/comments/10')
                .then((res) => {
                    expect(res).to.have.status(404);

                    done();
                });
        });

    });

});