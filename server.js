const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {blogPost} = require('./models');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

app.get('/blogPosts', (req, res) => {
	blogPost.
		find()
		.then(blogPosts => {
			console.log(blogPosts);
			res.json({
        blogPosts: blogPosts.map( 
				blogPost => blogPost.apiRepr())
		});
	})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

app.get('/blogPosts/:id', (req,res) => {
	blogPost.
	findById(req.params.id)
		.then(blogPost => {
			res.json(blogPost.apiRepr());
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({error: 'Something went wrong'});
		})
})

app.post('/blogPosts', (req,res) => {
	const requiredFields = ['title', 'content', 'author'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \"${field}\" in request body`;
			console.error(message);
			res.status(400).send(message);
		}
	}

	blogPost.create({
		title: req.body.title,
		content: req.body.content,
		author: {
			firstName: req.body.author.firstName, 
			lastName: req.body.author.lastName
	},
		created: req.body.created
		})
	.then(blogPost => res.status(201).json(blogPost.apiRepr()))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal service error'})
	})
});

app.put('/blogPosts/:id', (req,res) => {
	if(req.body.id !== req.params.id) {
		const message = (`Request path id (${req.params.id}) does
			not match the request body id (${req.body.id})`);
		console.log(message);
		return res.status(400).json({message: message});
	}

	const toUpdate = {};
	const updatableFields = ['title', 'content', 'author'];

	updatableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	blogPost.findByIdAndUpdate( req.params.id, {$set: toUpdate})
	.then(blogPost => res.status(200).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
    	console.log('i was here');
    	mongoose.connection.db.listCollections(function (err, names) {
        console.log(names); // [{ name: 'dbname.myCollection' }]
        console.log(err);
    });
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}.`)
        console.log(`Your app is connected to ${databaseUrl}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}


// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};