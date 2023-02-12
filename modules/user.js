'use strict'
const admin = require('firebase-admin');

var serviceAccount = require('./admin.json');



admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://horeb133-8533d.firebaseio.com",
	authDomain: "horeb133-8533d.firebaseapp.com",
});

var db = admin.database();
var userRef = db.ref("users");
const questionRef = db.ref('questions')
const Feedback = db.ref('feedback')
const Score = db.ref('score')

module.exports = class User {

	async addUser(obj) {
		var oneUser = userRef.child(obj.Username);
		oneUser.update(obj, (err) => {
			if (err) {
				throw err
			}
			else {
				return true
			}
		})
	}

	async addQuestions(obj) {
		var oneUser = questionRef.child(obj.sequence);
		oneUser.update(obj, (err) => {
			if (err) {
				throw err
			}
			else {
				return true
			}
		})
	}

	async addScore(obj) {
		var oneUser = Score.child(obj.questionWk + obj.Username);
		oneUser.update(obj, (err) => {
			if (err) {
				throw err
			}
			else {
				return true
			}
		})
	}

	async addFeedback(obj) {
		var oneUser = Feedback.child(obj.dbRef);
		oneUser.update(obj, (err) => {
			if (err) {
				throw err
			}
			else {
				return true
			}
		})
	}

	async getLogin(Username) {
		return userRef.database.ref('/users/' + Username).once('value').then(function (snapshot) {
			const data = snapshot.val()
			return data
		});
	}

	async getScore(checkDb) {
		return Feedback.database.ref('/score/').orderByChild("id").equalTo(checkDb).once('value').then(function (snapshot) {
			const data = snapshot.val()
			return data
		});
	}

	async getScore1(checkDb) {
		return Feedback.database.ref('/score/').orderByChild("questionWk").equalTo(checkDb).once('value').then(function (snapshot) {
			const data = snapshot.val()
			return data
		});
	}

	async getScore2(Username) {
		return Feedback.database.ref('/score/').orderByChild("Username").equalTo(Username).once('value').then(function (snapshot) {
			const data = snapshot.val()
			return data
		});
	}

	async getFeedback(getfeed) {
		return Feedback.database.ref('/feedback/').orderByChild("id").equalTo(getfeed).once('value').then(function (snapshot) {
			const data = snapshot.val()
			return data
		});
	}


	async getQuestions(selectQ) {
		return questionRef.database.ref('/questions/').orderByChild('id').equalTo(selectQ).once('value').then(function (snapshot) {

			const data = snapshot.val();
			return data
		});
	}

	async getUsers1(level) {
		return userRef.database.ref('/users/').orderByChild('level').equalTo(level).once('value').then(function (snapshot) {
			const data = snapshot.val();
			return data
		});
	}

	async getUsers2(username) {
		return userRef.database.ref('/users/').orderByChild('Username').equalTo(username).once('value').then(function (snapshot) {
			const data = snapshot.val();
			return data
		});
	}


	async getUsers(resi) {
		userRef.once('value', function (snap) {
			resi.status(300).json({ "users": snap.val() });
		})
	}
}