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
			console.log(err);
			res.status(500).json({error: 'Something went wrong'});
		})
})


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