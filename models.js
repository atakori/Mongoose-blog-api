const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
	title: String,
	content: String,
	author: {
		firstName: String, 
		lastName: String
	},
	created: Date
});

blogSchema.virtual('fullNameString').get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim()
});

blogSchema.methods.apiRepr = function() {

	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.fullNameString,
		created: this.created
	}
}

const blogPost = mongoose.model('blogPost', blogSchema);

module.exports = {blogPost};