const admin = require('./utils').firebaseAdmin;

const app = require('express')();
app.use(require('cors')({ origin: true }));

app.post('/', async (request, response) => {
  const db = admin.database().ref(`/Classes`);

  const { name, content_type, owner, tags } = request.body;
  try {
    await db
      .push({
        Name: name,
        Owner: owner,
        Content_type: content_type || [],
        Tags: tags || []
      })
      .once('value')
      .then(snapshot => {
        resp = {
          id: snapshot.key,
          class: { ...snapshot.val() }
        };
      });
  } catch (e) {
    return response.status(400).json({ message: 'malformed request' });
  }
  return response.status(200).json(resp);
});

app.patch('/:class_id', async (request, response) => {
  const db = admin.database().ref(`/classes/${request.params.class_id}`);
  if (!db)
    return response.status(404).json({
      message: `class with id ${request.params.class_id} not found`
    });

  const { name, rating, content_type, owner, tags, comments } = request.body;

  await db
    .push({
      Name: name,
      Owner: owner,
      Ratings: rating || [],
      Content_type: content_type || [],
      Tags: tags || [],
      Comments: comments || []
    })
    .once('value')
    .then(snapshot => {
      resp = {
        id: snapshot.key,
        class: { ...snapshot.val() }
      };
    });

  return response.status(200).json(resp);
});

app.delete('/:class_id', async (request, response) => {
  const db = admin.database().ref(`/Classes/${request.params.class_id}`);
  if (!db)
    return response.status(404).json({
      message: `class with id ${request.params.id} not found`
    });
  return db
    .remove()
    .then(() =>
      response
        .status(200)
        .json({ message: `class with id ${request.params.class_id} deleted` })
    )
    .catch(err =>
      response.status(400).json({
        message: `could not delete class with id ${request.params.class_id}`,
        err
      })
    );
});

// Class information API
app.get('/:class_id/info', async (request, response) => {
  //  console.log('Entered class info');
  // const db = admin
  // .database()
  // .ref(`/Classes/`)
  // .child(request.params.class_id);
  const db = admin.database().ref(`/Classes/ ${request.params.class_id}`);
  let cid = request.params.class_id;
  //console.log(request.params.class_id);
  // console.log(db.toString);
  if (!db)
    return response.status(404).json({
      message: `class with id ${request.params.id} not found`
    });
  const out = [];
  console.log(
    db
      .child('Classes')
      .child(cid)
      .child('Content-Type').key
  );
  db.child('Classes')
    .child(cid)
    .orderByKey()
    .on('value', function(snapshot) {
      snapshot.forEach(function(data) {
        out.push(console.log(data.val()));
      });

      try {
        return response.status(200).json({
          out
        });
      } catch (e) {
        return response.status(404).json({
          message: 'There was a fatal error getting the class data'
        });
      }
    });
  // console.log(db.child("Classes").child(cid).val)
  console.log(out);
});
exports.route = app;
