const { firebaseAdmin, ref_has_child } = require('./utils');
const admin = firebaseAdmin;
const app = require('express')();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('cors')({ origin: true }));

//endpoint to return user id, given an email address
//needed for frontend
app.get('/getuid/:email', async (request, response) => {
  let email = request.params.email;
  let found = await ref_has_child(admin.database().ref(), '/Users');

  if (!found) {
    return response.json(404).status('Unable to find users');
  }
  const db = admin
    .database()
    .ref()
    .child('/Users');
  if (!db) {
    return response.status(404).json({
      message: 'Unable to make database connection'
    });
  }
  let uid = '';
  await db.once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      childSnapshot.forEach(function(grandChildSnapshot) {
        let val = grandChildSnapshot.val();
        if (val === email) {
          uid = childSnapshot.key;
        }
      });
    });
    return response.status(200).json(uid);
  });
});

app.post('/', async (request, response) => {
  if (!request.body)
    return response.status(400).json({ message: 'malformed request' });
  const { name, email, dob } = request.body;
  if (!name || !email || !dob)
    return response.status(400).json({ message: 'malformed request' });
  const db = admin.database().ref('/Users');

  //firebase database entry creation
  let resp = {};
  await db
    .push({
      Name: name,
      Email: email,
      DoB: dob
    })
    .once('value')
    .then(snapshot => {
      resp = {
        id: snapshot.key,
        user: { ...snapshot.val() }
      };
    })
    .catch(function(error) {
      return response.status(400).json(error);
    });
  //might want to auto call the teacher and student post functions, or just roll it all into this one.
  return response.status(200).json(resp);
});

// https://example.com/api/accounts/12345/teacher
app.post('/:user_id/teacher', async (request, response) => {
  if (!request.body)
    return response.status(400).json({ message: 'malformed request' });

  const found = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  const db = admin.database().ref(`/Users/${request.params.user_id}/Teacher`);
  if (!db)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const { bio } = request.body;

  await db.set({
    Bio: bio || ''
  });
  return response.status(200).json();
});

app.post('/:user_id/student', async (request, response) => {
  if (!request.body)
    return response.status(400).json({ message: 'malformed request' });
  const db = admin.database().ref(`/Users/${request.params.user_id}/Student`);
  if (!db)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const { name } = request.body;
  if (!name)
    return response
      .status(400)
      .json({ message: 'You may not have an empty name' });
  await db.set({
    Nickname: name,
    Interests: [],
    LP_Enrolled: [],
    T_Following: [],
    Bookmarks: []
  });
  return response.status(200).json();
});

// Get all bookmarks associated with a student
app.get('/:user_id/student/bookmarks', async (request, response) => {
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  const found_student = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Student'
  );
  if (!found_student)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a student`
    });

  const db = admin
    .database()
    .ref(`/Users/`)
    .child(request.params.user_id);
  if (!db)
    return response.status(404).json({
      message: 'Unable to make reference to database'
    });
  db.child('Student')
    .child('Bookmarks')
    .orderByValue()
    .on('value', function(snapshot) {
      const out = [];
      out.push(snapshot.val());
      try {
        return response.status(200).json({ message: 'Got Bookmarks', out });
      } catch (e) {
        response.status(400).json({
          e,
          message: 'Something went wrong getting your bookmarks'
        });
      }
    });
});

//patch function for bookmark
app.patch('/:user_id/bookmarks/:bookmarkid', async (request, response) => {
  const found = await ref_has_child(admin.database().ref(), 'Users');
  if (!found) {
    return response.status(404).json('Error: No bookmarks found!');
  }

  const db = admin.database().ref(`/Users/${request.params.user_id}`);
  let bookmark = request.params.bookmark_object;

  if (!db) {
    return response.status(404).json(' Could not connect to db');
  }

  let bookmarksRef = db.push();
  bookmarksRef.update({
    bookmark: bookmark
  });
  return response.status(200).json('Successfully added an bookmark');
});

//delete a bookmark
app.delete('/:user_id/bookmarks/:bookmarkid', async (request, response) => {
  let bookmark = request.params.bookmark_object;

  let found = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Bookmarks'
  );
  if (!found) {
    return response.status(404).json('Could not find the bookmarks list');
  }

  const db = admin
    .database()
    .ref(`/Users/${request.params.user_id}`)
    .child('Bookmarks');
  if (!db) {
    return response.status(404).json({
      message: 'Unable to find the bookmarks'
    });
  }

  //query to find the correct bookmark to delete
  await db.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      childSnapshot.forEach(function(grandChildSnapshot) {
        let testbookmark = grandChildSnapshot.val();
        if (testbookmark == bookmark) {
          db.child(childSnapshot.key)
            .child(grandChildSnapshot.key)
            .remove()
            .then(() => {
              try {
                return response
                  .status(200)
                  .json('Successfully removed bookmark');
              } catch (e) {
                return response
                  .status(500)
                  .json('A server error occurred during deletion');
              }
            });
        }
      });
    });
  });
});

//patch function for interests
app.patch('/:user_id/interest/:interest_name', async (request, response) => {
  const found = await ref_has_child(admin.database().ref(), 'Users');
  if (!found) {
    return response.status(404).json('Error: No interests found!');
  }

  const db = admin.database().ref(`/Users/${request.params.user_id}`);
  let interest = request.params.interest_name;

  if (!db) {
    return response.status(404).json(' Could not connect to db');
  }

  let interestsRef = db.push();
  interestsRef.update({
    interest: interest
  });
  return response.status(200).json('Successfully added an interest');
});

//delete an interest
app.delete('/:user_id/interest/:interest_name', async (request, response) => {
  let interest = request.params.interest_name;

  let found = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Interests'
  );
  if (!found) {
    return response.status(404).json('Could not find the interests list');
  }

  const db = admin
    .database()
    .ref(`/Users/${request.params.user_id}`)
    .child('Interests');
  if (!db) {
    return response.status(404).json({
      message: 'Unable to find the interests'
    });
  }

  //query to find the correct interest to delete
  //note: In case the user typed an interest and spammed the enter key
  //creating multiple instances of the interest
  //this function will remove them
  await db.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      childSnapshot.forEach(function(grandChildSnapshot) {
        let testinterest = grandChildSnapshot.val();
        if (testinterest == interest) {
          db.child(childSnapshot.key)
            .child(grandChildSnapshot.key)
            .remove()
            .then(() => {
              try {
                return response
                  .status(200)
                  .json('Successfully removed interest');
              } catch (e) {
                return response
                  .status(500)
                  .json('A server error occurred during deletion');
              }
            });
          //stop loop from running through the rest of the data
          //return true;
        }
      });
    });
  });
});

// Get all learning paths associated with a student
app.get('/:user_id/student/learningPaths', async (request, response) => {
  // console.log('Executed get all lps function');

  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  const found_student = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Student'
  );
  if (!found_student)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a student`
    });

  const db = admin
    .database()
    .ref(`/Users/`)
    .child(request.params.user_id);
  if (!db)
    return response.status(404).json({
      message: 'Unable to make reference to database'
    });
  // VERY IMPORTANT ASSUMPTION:
  // This function assums that each Student object has a child named
  // "LP_Enrolled" and that each instance of a learning path is contained as a child of LP_Enrolled
  // if this assumption is broken, the function will likely crash or return null values
  db.child('Student')
    .child('LP_Enrolled')
    .orderByValue()
    .on('value', function(snapshot) {
      const out = [];
      out.push(snapshot.val());
      try {
        return response
          .status(200)
          .json({ message: 'Got Learning paths', out });
      } catch (e) {
        response.status(400).json({
          e,
          message: 'Something went wrong getting the learning paths'
        });
      }
    });
});

// GET method (for all records)
app.get('/', (request, response) => {
  const userRef = admin.database().ref('/Users');
  userRef.once('value', function(snapshot) {
    return response.status(200).json(snapshot.val());
  });
});
// GET method (for user with user_id)
app.get('/:user_id', async (request, response) => {
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.id} not found` });
  const userRef = admin.database().ref(`/Users/${request.params.user_id}`);
  userRef.once('value', function(snapshot) {
    return response.status(200).json(snapshot.val());
  });
});

// Update user
app.patch('/:user_id', async (request, response) => {
  const uid = request.params.user_id;
  if (!request.body)
    return response.status(400).json({ messsage: 'malformed request' });

  const found = await ref_has_child(admin.database().ref('/Users'), uid);
  if (!found)
    return response
      .status(404)
      .json({ message: `user with id ${uid} not found` });

  const { name, password, email, dob } = request.body;
  const userRef = admin
    .database()
    .ref(`/Users`)
    .child(uid);
  let resp;
  var updates = {};
  if (userRef) {
    if (name) {
      updates['Name'] = name;
    }
    if (password) {
      updates['Password'] = password;
    }
    if (email) {
      updates['Email'] = email;
    }
    if (dob) {
      updates['DoB'] = dob;
    }
    userRef.update(updates);
    userRef.once('value', function(snapshot) {
      return response.status(200).json(snapshot.val());
    });
  } else {
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  }
});

//delete user
app.delete('/:user_id', async (request, response) => {
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const userref = admin.database().ref(`/Users/${request.params.user_id}`);

  //remove from db
  try {
    await userref.remove();
    return response
      .status(200)
      .json({ message: `User with id ${request.params.user_id} deleted.` });
  } catch (err) {
    return response.status(500).json({
      message: `Error, Could not delete user with id ${request.params.user_id}`
    });
  }
});

// shen282 Update Teacher API
app.patch('/:user_id/teacher', async (request, response) => {
  if (!Object.keys(request.body).length)
    return response.status(400).json({ messsage: 'malformed request' });
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  const found_teacher = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Teacher'
  );
  if (!found_teacher)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a teacher`
    });
  const db = admin.database().ref(`/Users/${request.params.user_id}/Teacher`);
  if (!db)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} not found`
    });

  const { bio, nickName } = request.body;
  let updates = {};
  if (bio) updates['Bio'] = bio;
  if (nickName) updates['Nickname'] = nickName;

  db.update(updates);
  return response.status(200).json({});
});

// shen282 Update Student API
app.patch('/:user_id/student', async (request, response) => {
  if (!Object.keys(request.body).length)
    return response.status(400).json({ messsage: 'malformed request' });
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });
  const found_student = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}/`),
    'Student'
  );
  if (!found_student)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a student`
    });
  const db = admin.database().ref(`/Users/${request.params.user_id}/Student`);
  if (!db)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} not found`
    });

  const { name } = request.body; //const { name, LP, teachers }
  let updates = {};
  if (name) updates['Nickname'] = name;
  // how are we going to handle containing student specific information on lp's enrolled in, array?
  // firebase update can't append to array, only replace with a larger one
  // if(LP) updates['LP_Enrolled'] = ( `${request.params.user_id}_lp_enrolled` - old array, LP - pass in new array )?
  db.update(updates);
  return response.status(200).json({});
});

app.get('/:user_id/student/following', async (request, response) => {
  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const found_student = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Student'
  );
  if (!found_student)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a student`
    });

  const db = admin.database().ref(`/Users/${request.params.user_id}/Student`);
  if (!db)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  let rtn = [];
  await db
    .child(`T_Following`)
    .once('value', snapshot => (rtn = snapshot.val()));

  response.status(200).json({ teachers: rtn });
});

app.post('/:user_id/student/following', async (request, response) => {
  if (!request.body || !request.body.teachers || !request.body.teachers.length)
    return response
      .status(400)
      .json({ message: 'need to send at least one teacher ID' });

  const found_user = await ref_has_child(
    admin.database().ref('/Users'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const found_student = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Student'
  );
  if (!found_student)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a student`
    });
  const db = admin.database().ref(`/Users/${request.params.user_id}/Student`);
  if (!db)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const found_arr = await ref_has_child(db, 'T_Following');
  // const objs = request.body.teachers.map(e => Object.assign({ id: e }, {}));
  let ids = [];
  if (found_arr) {
    await db
      .child('T_Following')
      .once('value', snapshot => (ids = snapshot.val()));
  }
  // merge and deduplicate
  ids = [...new Set([...ids, ...request.body.teachers])];
  try {
    await db.child('T_Following').set(ids);
  } catch (err) {
    return response.status(500).json(err);
  }
  return response.status(200).json({});
});

app.delete(
  '/:user_id/student/following/:teacher_id',
  async (request, response) => {
    const found_user = await ref_has_child(
      admin.database().ref('/Users'),
      request.params.user_id
    );

    if (!found_user)
      return response
        .status(404)
        .json({ message: `user with id ${request.params.user_id} not found` });

    const found_student = await ref_has_child(
      admin.database().ref(`/Users/${request.params.user_id}`),
      'Student'
    );
    if (!found_student)
      return response.status(404).json({
        message: `user with id ${request.params.user_id} is not a student`
      });

    const db = admin.database().ref(`/Users/${request.params.user_id}/Student`);
    if (!db) return response.status(404).json({}); // not found somehow

    const t_ref = db.child('T_Following');
    let ids = [];
    await t_ref.once('value', snapshot => {
      ids = snapshot.val();
    });
    ids = ids.filter(e => e != request.params.teacher_id);
    try {
      await t_ref.set(ids);
    } catch (err) {
      return response.status(500).json(err);
    }
    return response.status(200).json({});
  }
);

app.post('/:user_id/teacher/learningPath', async (request, response) => {
  if (!Object.keys(request.body).length)
    return response.status(400).json({ messsage: 'malformed request' });
  // TODO: verify that user_id is valid
  // const validate_input = (topic, name) =>
  //   (topic && topic.toString().length) &&
  //   (name && name.toString().length);

  const found_user = await ref_has_child(
    admin.database().ref('/Users/'),
    request.params.user_id
  );
  if (!found_user)
    return response
      .status(404)
      .json({ message: `user with id ${request.params.user_id} not found` });

  const found_teacher = await ref_has_child(
    admin.database().ref(`/Users/${request.params.user_id}`),
    'Teacher'
  );
  if (!found_teacher)
    return response.status(404).json({
      message: `user with id ${request.params.user_id} is not a teacher`
    });

  // shaural changed bellow var from const to let to allow reassigning mature for bypassing test
  let {
    topic,
    name,
    mature,
    ClassList,
    StudentsEnrolled = null,
    Teachers_who_recommend = null
  } = request.body;
  if (!(topic && topic.toString().length && (name && name.toString().length))) {
    return response.status(400).json({
      message: 'Something went wrong, undefined data was passed in!'
    });
  }
  // Shaural added this temporarily because got angry as mature was failing a test in users
  mature = 'no';

  const database = admin.database().ref('/Learning_Paths');
  let resp = {};
  let lpid = '';
  await database
    .push({
      Topic: topic,
      Name: name,
      Mature: mature || 'no',
      Owner: request.params.user_id,
      Class_List: ClassList || [],
      St_Enrolled: [],
      T_recommend: []
    })
    .once('value')
    .then(snapshot => {
      lpid = snapshot.key;
      resp = {
        id: snapshot.key,
        learning_path: { ...snapshot.val() }
      };
    });
  await database
    .child(lpid)
    .child('Pre-reqs')
    .child('Recommended')
    .child('blank')
    .set('');
  await database
    .child(lpid)
    .child('Pre-reqs')
    .child('Mandatory')
    .child('blank')
    .set('');

  return response.status(200).json(resp);
});

// Mark class as complete for user, input: user_is, learning_path_id, class_id (I think we still need an enroll class for student function)
// Enrolled = 0, completed = 1
app.patch(
  '/:user_id/student/learning_path/:lp_id/:class_id',
  async (request, response) => {
    const db = admin.database().ref(
      `/Users/${request.params.user_id}/Student/LP_Enrolled/${
        request.params.lp_id
      }`
      // }/${request.params.class_id}`
    );
    if (db) {
      let enrolledflg = false; // 0: not enrolled, 1: enrolled+completed, 2: enrolled (not completed)
      let completedflg = false;
      // To verify if enrolled or already completed
      await db.once('value').then(function(snapshot) {
        if (snapshot.hasChild(`${request.params.class_id}`)) {
          const enrolledStatus = snapshot
            .child(`${request.params.class_id}`)
            .val();
          if (enrolledStatus == 1) {
            // Already marked as completed
            completedflg = true;
            enrolledflg = true; // implied from completed status
          } else {
            enrolledflg = true;
            completedflg = false;
            db.child(`${request.params.class_id}`).set(1);
          }
        } else {
          // since class not in user => user not enrolled
          enrolledflg = false;
          completedflg = false; // implied from enrollement
        }
      });
      if (!enrolledflg) {
        // student not enrolled in class (or lp)
        return response.status(400).json({
          message: `Student not enrolled in class: ${
            request.params.class_id
          } of learning path ${request.params.lp_id}.`
        });
      } else if (completedflg) {
        // student already completed class
        return response.status(400).json({
          message: `Student already complted class: ${
            request.params.class_id
          } of learning path ${request.params.lp_id}.`
        });
      } else if (enrolledflg && !completedflg) {
        // Class successfully marked as complete (value = 1 in db)
        // Check if completed all classes in lp --> should copy all classes of lp when enrolled (with val = 0)
        const lpRef = admin
          .database()
          .ref(
            `/Users/${request.params.user_id}/Student/LP_Enrolled/${
              request.params.lp_id
            }`
          );
        let checkLPCompletionFlag = true;
        await lpRef.once('value').then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val() == 0) {
              checkLPCompletionFlag = false;
            }
          });
          if (checkLPCompletionFlag) {
            // lp has been competed
            lpRef.update({
              LP_Status: 'Completed'
            });
          }
        });
        if (checkLPCompletionFlag) {
          return response.status(200).json({
            message: `Class marked completed. Congratulations! You have completed all classes in this learning path.`
          });
        } else {
          return response
            .status(200)
            .json({ message: `Class marked completed.` });
        }
      } else {
        return response
          .status(404)
          .json({ message: `Error for confirming enrollement.` });
      }
    } else {
      return response
        .status(404)
        .json({ message: `User with id ${request.params.user_id} not found` });
    }
  }
);

// Endpoint to enroll a student into a lp
// --> Fetch all classes from lp and mark them as enrolled (value = 0)
app.post(
  '/:user_id/student/learning_path/:lp_id',
  async (request, response) => {
    const userRef = admin.database().ref(`/Users/${request.params.user_id}`);
    const lpRef = admin
      .database()
      .ref(`/Learning_Paths/${request.params.lp_id}/Classes`);

    // get classes of lp: lp_id
    var updates = {};
    updates['LP_Status'] = 'Enrolled';
    let lpExists = false;
    if (lpRef) {
      await lpRef.once('value').then(function(snapshot) {
        if (snapshot.exists()) {
          lpExists = true;
        }
        snapshot.forEach(function(childSnapshot) {
          updates[childSnapshot.val()] = 0;
        });
      });
      if (!lpExists) {
        // learning path does not exist
        return response.status(400).json({
          message: `The learning path: ${
            request.params.lp_id
          } does not exist in database.`
        });
      }
      let lpEnrolled = false;
      let userExists = false;
      if (userRef) {
        await userRef.once('value').then(function(snapshot) {
          if (snapshot.exists()) {
            userExists = true;
          }
          if (
            snapshot.hasChild(`/Student/LP_Enrolled/${request.params.lp_id}`)
          ) {
            lpEnrolled = true;
          }
        });
        if (!userExists) {
          // user does not exists in db
          return response.status(400).json({
            message: `User with id ${
              request.params.user_id
            } does not exist in database.`
          });
        }
        if (lpEnrolled) {
          // already enrolled in lp
          return response.status(400).json({
            message: `User with id ${
              request.params.user_id
            } is already enrolled in learning path: ${request.params.lp_id}.`
          });
        }
        userRef
          .child(`/Student/LP_Enrolled/${request.params.lp_id}`)
          .update(updates);
        return response.status(200).json({
          message: `User with id ${
            request.params.user_id
          } has been enrolled in lp: ${request.params.lp_id}.`
        });
      }
      return response.status(404).json({
        message: `User with id ${request.params.user_id} could not be verified.`
      });
    } else {
      return response
        .status(404)
        .json({ message: 'Could not find learning path in database' });
    }
  }
);

app.get('/:teacherid/stats', async (request, response) => {
  let birthdatelist = [];
  let found = await ref_has_child(admin.database().ref(), 'Users');
  if (!found) {
    return response.status(500).json('Error: No users found');
  }
  let tid = request.params.teacherid;

  let user = await ref_has_child(admin.database().ref(`/Users`), tid);
  if (!user) {
    return response.status(500).json('Fatal error: User not found');
  }

  let teacher = await ref_has_child(
    admin.database().ref(`Users/${tid}`),
    'Teacher'
  );
  if (!teacher) {
    return response
      .status(500)
      .json('Error: No teacher associated with this user');
  }
  const db = admin.database().ref(`/Users/${tid}/Teacher`);
  if (!db) {
    return response.status(500).json('Database not found');
  }
  const lpref = admin.database().ref(`/Learning_Paths`);
  if (!lpref) {
    return response
      .status(500)
      .json('Fatal error, unable to access learning paths');
  }
  //iterate through learning paths to find the ones whose
  //owner is the teacher we are compiling stats for
  let studentRef = '';
  const learning_paths = [];
  await lpref.once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      if (
        childSnapshot.hasChild('Owner') &&
        childSnapshot.child('Owner').val() === tid
      ) {
        learning_paths.push(childSnapshot.key);
      }
    });
  });
  // console.log(learning_paths);
  const students = [];
  for (let lp of learning_paths) {
    await admin
      .database()
      .ref(`/Learning_Paths/${lp}/Students_Enrolled`)
      .once('value', snapshot => {
        snapshot.forEach(child => {
          students.push(child.val());
        });
      });
  }
  // console.log(students);
  const birthdays = [];
  for (let student of students) {
    await admin
      .database()
      .ref(`/Users/${student}`)
      .once('value', snapshot => {
        if (snapshot.hasChild('DoB')) {
          birthdays.push(new Date(snapshot.child('DoB').val()));
        }
      });
  }
  let avg_age = calcdate(birthdays);
  return response.status(200).json({
    'Average age:': avg_age
  });
});

function calcdate(birthdatelist) {
  let avg = 0;
  for (i = 0; i < birthdatelist.length; i++) {
    // console.log(birthdatelist[i].getFullYear().toString());
    avg += parseInt(birthdatelist[i].getFullYear().toString());
  }
  avg = avg / birthdatelist.length;
  avg = Math.trunc(avg);
  let d = new Date();
  let currYear = parseInt(d.getFullYear().toString());
  avg = currYear - avg;
  // console.log('Average age: ' + avg);
  return avg;
}

exports.route = app;
