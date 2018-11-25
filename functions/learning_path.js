const { firebaseAdmin, ref_has_child } = require('./utils');
const admin = firebaseAdmin;

const app = require('express')();

app.use(require('cors')({ origin: true }));

app.post('/:lp_id/class', async (request, response) => {
  const db = admin
    .database()
    .ref(`/Learning_Paths/${request.params.lp_id}/Class`);
  if (!db)
    return response.status(404).json({
      message: `learning path with id ${request.params.lp_id} not found`
    });

  // TODO: append to learningpath/:lp_id/class array without creating UID structure?
  const { class_id } = request.body;
  if (!class_id)
    return response.status(400).json({ message: 'class_id can not be empty' });
  try {
    await db
      .push({
        Class_Id: class_id
      })
      .once('value')
      .then(snapshot => {
        resp = {
          id: snapshot.key,
          class: { ...snapshot.val() }
        };
      });

    //TODO: Call the patch endpoint for any pre-reqs that have been entered?
  } catch (e) {
    return response.status(400).json({ message: 'malformed request' });
  }
  return response.status(200).json(resp);
});

app.patch('/:lp_id/recommended_pre_reqs', async (request, response) => {
  let temp = request.body.pre_reqs_list;
  let pre_reqs_array = temp.toString().split(',');
  let db = await ref_has_child(
    admin.database().ref(`/Learning_Paths/${lpid}`),
    'Pre-reqs'
  );
  if (!db) {
    return response.status(404).json('Unable to find pre-requisites');
  }
  //convert lp names to ids, in order to check if they exist
  //if they don't, return an error
  for (v in pre_reqs_array) {
    let temp2 = pre_reqs_array[v];
    let tempref = await ref_has_child(
      admin.database().ref(`/Users/Learning_Paths`),
      temp2
    );
    if (!tempref) {
      let out = 'Error: Learning Path' + temp2 + ' does not exist';
      return response.status(404).json({
        out
      });
    }
  }

  let lpid = request.params.lp_id;

  //For now, we will push to recommended pre-reqs
  //there will be a different endpoint that pushes to mandatory pre-reqs
  //something like /:lp_id/mandatory_pre_reqs
  let rec = await ref_has_child(
    admin.database().ref(`/Learning_Paths/${lpid}/Pre-reqs`),
    'Recommended'
  );
  if (!rec) {
    return response
      .status(404)
      .json('Unable to make recommended pre-requisite');
  }
  let rec_ref = admin
    .database()
    .ref(`/Learning_Paths/${lpid}/Pre-reqs/Recommended`);
  try {
    for (t in pre_reqs_array) {
      let preq = pre_reqs_array[t];
      // console.log(preq);
      await rec_ref.push({ Prereq: preq });
    }
  } catch (err) {
    // console.log(err);
    return response
      .status(404)
      .json('An error happened when setting the pre-requsisites');
  }
  return response.status(200).json('Successfully set pre-reqs');
  // console.log(temp.length)
  /*
    for(t in temp){
    console.log("Pre-reqs: " + temp[t])
    }
    */
});

// delete learning path with id lp_id
app.delete('/:lp_id', async (request, response) => {
  const lpRef = admin.database().ref(`/Learning_Paths/${request.params.lp_id}`);
  const found_user = await ref_has_child(
    admin.database().ref(`/Learning_Paths`),
    request.params.lp_id
  );
  if (!found_user)
    return response.status(404).json({
      message: `Learning path with id ${request.params.lp_id} not found`
    });

  //remove from db (no need to check if exists since if it doesn't then wont remove anything)
  lpRef
    .remove()
    .then(function() {
      return response.status(200).json({
        message: `Learning path with id ${request.params.lp_id} deleted.`
      });
    })
    .catch(function(error) {
      console.log('Error deleting learning path:', error);
      return response.status(400).json({
        message: `Error, Could not delete learning path with id ${
          request.params.lp_id
        }`
      });
    });
});

app.post('/', async (request, response) => {
  const db = admin.database().ref('/Learning_Paths');

  const { name, owner, topic } = request.body;

  if (!name) {
    return response.status(400).json({
      message: 'You may not have an empty name'
    });
  } else if (!owner) {
    return response.status(400).json({
      message: 'you may not have an empty owner'
    });
  } else if (!topic) {
    return response.status(400).json({
      message: 'you may not have an empty topic'
    });
  } else {
    let resp = {};
    await db
      .push({
        Name: name,
        Owner: owner,
        Topic: topic
      })
      .once('value')
      .then(snapshot => {
        resp = {
          id: snapshot.key,
          learning_path: { ...snapshot.val() }
        };
      });

    return response.status(200).json(resp);
  }
});

// body: name, owner, topic
app.patch('/:lp_id', async (request, response) => {
  const db = admin
    .database()
    .ref('/Learning_Paths')
    .child(request.params.lp_id);

  const { name, owner, topic } = request.body;
  const found_user = await ref_has_child(
    admin.database().ref(`/Learning_Paths`),
    request.params.lp_id
  );

  let resp;
  var updates = {};
  if (found_user) {
    if (name) {
      updates['Name'] = name;
    }
    if (owner) {
      updates['Owner'] = owner;
    }
    if (topic) {
      updates['Topic'] = topic;
    }
    db.update(updates);
    db.once('value', function(snapshot) {
      return response.status(200).json(snapshot.val());
    });
  } else {
    return response.status(404).json({
      message: `Learning Path with id ${request.params.lp_id} not found`
    });
  }
});

// START CODE FOR LP SEARCH
// GET learning paths for a teacher -> from owner attribute in lp
app.get('/teacher/:user_id', (request, response) => {
  const lpRef = admin.database().ref(`/Learning_Paths`);
  lpRef
    .orderByChild('Owner')
    .equalTo(request.params.user_id)
    .once('value', function(snapshot) {
      return response.status(200).json(snapshot.val());
    });
});

// This endpoint basically makes previous one invalid since you can just put the user_id of teacher as owner=user_id. (But made it as John specifically asked for it)
// GET all lps matching query vars: Name, Topic, Owner (to get all leave empty)
app.get('/search', async (request, response) => {
  const lpRef = admin.database().ref(`/Learning_Paths`);
  let name = request.query.name || '';
  let owner = request.query.owner || '';
  let topic = request.query.topic || '';
  let valsExist = false;
  let nameExists = true;
  let ownerExists = true;
  let topicExists = true;
  if (name.length == 0) {
    nameExists = false;
  }
  if (owner.length == 0) {
    ownerExists = false;
  }
  if (topic.length == 0) {
    topicExists = false;
  }
  if (nameExists || ownerExists || topicExists) {
    valsExist = true;
  }
  var resp = [];
  await lpRef.once('value', function(snapshot) {
    if (valsExist) {
      snapshot.forEach(function(childSnapshot) {
        let nflg = false;
        let oflg = false;
        let tflg = false;
        if (
          name &&
          childSnapshot
            .child('Name')
            .val()
            .toLowerCase()
            .indexOf(name.toLowerCase()) != -1
        ) {
          nflg = true;
        }
        if (
          topic &&
          childSnapshot
            .child('Topic')
            .val()
            .toLowerCase()
            .indexOf(topic.toLowerCase()) != -1
        ) {
          tflg = true;
        }
        if (
          owner &&
          childSnapshot
            .child('Owner')
            .val()
            .toLowerCase()
            .indexOf(owner.toLowerCase()) != -1
        ) {
          oflg = true;
        }
        // check if all arguments sent are matched
        let nameCheck = true;
        let ownerCheck = true;
        let topicCheck = true;
        if (nameExists && !nflg) {
          nameCheck = false;
        }
        if (ownerExists && !oflg) {
          ownerCheck = false;
        }
        if (topicExists && !tflg) {
          topicCheck = false;
        }
        if (nameCheck && ownerCheck && topicCheck) {
          resp.push([childSnapshot.key, childSnapshot.val()]);
        }
      });
    } else {
      resp = snapshot.val();
    }
  });
  return response.status(200).json(resp);
});

exports.route = app;
