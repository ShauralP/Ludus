const admin = require('./utils').firebaseAdmin;

const app = require('express')();

app.use(require('cors')({ origin: true }));

app.post('/', async (request, response) => {
  const db = admin.database().ref('/Users');

  const { name, password, email, dob } = request.body;

  //basic validation tests
  if (!email.toString().includes('@')) {
    return response.status(400).json({
      message: 'Invalid email, please try again'
    });
  } else if (!password.toString().length) {
    return response.status(400).json({
      message: 'Empty passwords are not allowed, please try again'
    });
  } else if (password.toString().length < 10) {
    return response.status(400).json({
      message: 'Minimum password length: 10 characters, please try again'
    });
  } else if (!name.toString().length) {
    return response.status(400).json({
      message: 'You may not have an empty name'
    });
  }
  //this will be obselete with HTML forms
  // placeholder for testing purposes
  else if (!dob.toString().length) {
    return response.status(400).json({
      message: 'Please enter your age'
    });
  } else {
    let resp = {};
    await db
      .push({
        Name: name,
        Password: password,
        Email: email,
        DoB: dob
      })
      .once('value')
      .then(snapshot => {
        resp = {
          id: snapshot.key,
          user: { ...snapshot.val() }
        };
      });

    return response.status(200).json(resp);
  }
});

// https://example.com/api/accounts/12345/teacher
app.post('/:user_id/teacher', async (request, response) => {
  const db = admin.database().ref(`/Users/${request.params.user_id}/Teacher`);
  if (!db)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const { bio } = request.body;

  let resp = {};
  await db
    .push({
      Bio: bio || ''
    })
    .once('value')
    .then(snapshot => {
      resp = {
        id: request.params.user_id,
        teacher: { ...snapshot.val() }
      };
    });
  return response.status(200).json(resp);
});

  // GET method (for all records)
app.get('/', (request, response) => {
  const userRef = admin.database().ref("/Users");
  userRef.once("value", function(snapshot) {
    return response.status(200).json(snapshot.val());
  });
});
// GET method (for user with user_id)
app.get('/:user_id', (request, response) => {
  const userRef = admin.database().ref(`/Users/${request.params.user_id}`);
  userRef.once("value", function(snapshot) {
    return response.status(200).json(snapshot.val());
  });
});

// Update user
app.patch('/:user_id', async (request, response) => {
  const uid = request.params.user_id;
  const { name, password, email, dob } = request.body;
  const userRef = admin.database().ref(`/Users`).child(uid);
  let resp;
  var updates = {};
  if(userRef) {
      if(name != undefined) {
        updates['Name'] = name;
      }
      if(password != undefined) {
        updates['/Password'] = password;
      }
      if(email != undefined) {
        updates['/Email'] = email;
      }
      if(dob != undefined) {
        updates['/DoB'] = dob;
      }
      userRef.update(updates);
      userRef.once("value", function(snapshot) {
        return response.status(200).json(snapshot.val());
      });
    } else {
      return response.status(404).json({ message: `user with id ${request.params.user_id} not found` });
    }
  
});

//delete user
app.delete('/:user_id', async (request, response) => {
  const userref = admin.database().ref(`/Users/${request.params.user_id}`);
  if (!userref)
  return response
    .status(404)
    .json({ message: `user with id ${request.params.user_id} not found` });
  
  //remove from db
  userref.remove().then(function() {
    return response.status(200).json(resp);
  }).catch(function(error) {
    console.log('Error deleting user:', error);
    return response.status(400).json({
      message: 'Error, could not delete user: ${request.params.user_id}'
    });
  })
  
});

exports.route = app;
