const admin = require('./utils').firebaseAdmin;
const app = require('express')();
app.use(require('cors')({ origin: true }));

// Send notification to a User
// Body: sender_name, text
app.post('/:receiver_id', async (request, response) => {
  const db = admin
    .database()
    .ref(`/Notifications/${request.params.receiver_id}`);
  let receiver = request.params.receiver_id;
  const { subject, text, sender_name } = request.body;
  if (subject.length > 0 && text.length > 0) {
    db.push({
      subject: subject,
      text: text,
      sender_name: sender_name || ''
    });
    return response.status(200).json({
      message: `Notification successfully sent.`
    });
  } else {
    //sender or text not provided
    return response.status(400).json({
      message: `Body arguments are either empty or invalid.`
    });
  }
});

// GET method (for all notitifications for user: user_id)
app.get('/:user_id', (request, response) => {
  const ref = admin.database().ref(`/Notifications/${request.params.user_id}`);
  ref.once('value', function(snapshot) {
    if (snapshot.hasChildren()) {
      return response.status(200).json(snapshot.val());
    } else {
      return response.status(400).json({
        message: `User with id: ${
          request.params.user_id
        } does not have any notifications.`
      });
    }
  });
});
// GET notification info from notification id.
app.get('/notification/:notification_id', (request, response) => {
  const ref = admin.database().ref(`/Notifications`);
  ref.once('value', function(snapshot) {
    if (snapshot.hasChildren()) {
      snapshot.forEach(function(childSnap) {
        childSnap.forEach(function(notificationSnap) {
          if (
            notificationSnap.key.indexOf(request.params.notification_id) != -1
          ) {
            // found
            return response.status(200).json(notificationSnap.val());
          }
        });
      });
    } else {
      return response.status(400).json({
        message: `There are no notifications.`
      });
    }
  });
});

//delete notification
app.delete('/:user_id/:notification_id', async (request, response) => {
  const notRef = admin
    .database()
    .ref(`/Notifications/${request.params.user_id}`);
  let notId = request.params.notification_id;
  await notRef.once('value', function(snapshot) {
    if (!snapshot.hasChild(notId)) {
      // not does not exist
      return response.status(400).json({
        message: `User with id: ${
          request.params.user_id
        } does not notification with id: ${request.params.notification_id}.`
      });
    }
  });
  //remove from db
  try {
    await notRef.child(notId).remove();
    return response.status(200).json({
      message: `Notification with id ${request.params.notification_id} deleted.`
    });
  } catch (err) {
    return response.status(500).json({
      message: `Error, Could not delete notification with id ${
        request.params.notification_id
      }`
    });
  }
});

exports.route = app;
