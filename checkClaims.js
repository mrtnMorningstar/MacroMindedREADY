const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "71EgfWqyQOPQOvtE1MrJNV9wLxQ2";

admin.auth().getUser(uid)
  .then(userRecord => {
    console.log("Custom Claims:", userRecord.customClaims);
    console.log("Email:", userRecord.email);
    console.log("UID:", userRecord.uid);
  })
  .catch(error => {
    console.error("Error fetching user data:", error);
  })
  .finally(() => {
    process.exit(0);
  });

