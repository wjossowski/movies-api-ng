const express = require('express');
const comments = express.Router();

const { catchAsync, checkValid } = require('../middlewares/errors');

const CommentsController = require('../controllers/CommentsController');

comments.get('/', catchAsync(CommentsController.getAll));

comments.get('/:id', [
    CommentsController.validateId,
    checkValid,
    catchAsync(CommentsController.getOne)
]);

comments.post('/', [
    CommentsController.validateStore,
    checkValid,
    catchAsync(CommentsController.checkIfMovieExists),
    catchAsync(CommentsController.store)
])

comments.patch('/:id', [
    CommentsController.validateId,
    checkValid,
    catchAsync(CommentsController.checkIfMovieExists),
    catchAsync(CommentsController.update)
])

comments.delete('/:id', catchAsync(CommentsController.deleteOne))

module.exports = comments;