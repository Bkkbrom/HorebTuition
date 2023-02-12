#!/usr/bin/env node

/* a*/
'use strict'

/* MODULE IMPORTS */
const Koa = require('koa')
const views = require('koa-views')
const Router = require('koa-router')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({ multipart: true, uploadDir: '.' })
const session = require('koa-session')
const fs = require('fs-extra')
const mime = require('mime-types')
const handlebars = require('koa-hbs-renderer')

//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const User = require('./modules/user')

const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, { map: { handlebars: 'handlebars' } }))

const defaultPort = 8000
const port = process.env.PORT || defaultPort
const dbName = 'Domestic-Repairs.db'
const saltRounds = 10



/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */



router.get('/', async ctx => {
	try {
		const data = {}

		if (ctx.query.msg) data.msg = ctx.query.msg
		{
			if (ctx.session.authorised !== true) await ctx.render('index', { adminCont: 'none', StudCont: 'none', Logout: "none", Login: "Block" })
			else if (ctx.session.admin === true) await ctx.render('index', { adminCont: 'Block', StudCont: 'none', Logout: "Block", Login: "none" })
			else await ctx.render('index', { adminCont: 'none', StudCont: 'Block', Logout: "Block", Login: "none" })
		}
	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})


router.get('/addStudent', async ctx => {
	if (ctx.session.admin === true) await ctx.render('addStudent')
	else await ctx.render('error', { message: "You do not have admin access" })
})
router.post('/addStudent', async ctx => {
	try {
		const body = ctx.request.body
		const user = await new User(dbName)
		var txt = { "id": body.Unid, "Username": body.Username, "FName": body.FName, "LName": body.LName, "DOB": body.DateOfBirth, "level": body.level, "Email": body.Email, "Password": body.Password };
		await user.addUser(txt)
		ctx.redirect(`addStudent/?msg=new user "${body.Username}" added`)
	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})


router.get('/login', async ctx => {
	const data = {}
	if (ctx.query.msg) data.msg = ctx.query.msg
	if (ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const Username = 'Horeb133.Mulubrhan'
		const Pass = "soliana13"

		if (body.Username === Username && body.Password === Pass) {
			ctx.session.authorised = true
			ctx.session.admin = true
			ctx.session.Username = body.Username
			return await ctx.render('index', { adminCont: 'Block', StudCont: 'none', Logout: "Block", Login: "none" })
		}

		else {
			const user = await new User(dbName)
			const getUser = await user.getLogin(body.Username)
			if (getUser === null) await ctx.render('login', { message: "No user found" })
			else if (getUser.Username === body.Username && getUser.Password === body.Password) {
				ctx.session.authorised = true
				ctx.session.admin = false
				ctx.session.Username = body.Username
				ctx.session.StudentLvl = getUser.level
				ctx.session.Studentid = getUser.id

				return ctx.render('index', { adminCont: 'none', StudCont: 'Block', Logout: "Block", Login: "none" })
			} else return await ctx.render('login', { message: "User details do not match" })
		}

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})


router.get('/addQuestion', async ctx => {
	if (ctx.session.admin === true) await ctx.render('addQuestion')
	else await ctx.render('error', { message: "You do not have admin access" })

})
router.post('/addQuestion', async ctx => {
	try {
		const body = ctx.request.body
		var questionWk = body.questionWk, i
		var QWk = [];
		var nothing = [];
		var level

		if (body.level === "Year1") level = 1
		else if (body.level === "Year2") level = 2
		else if (body.level === "Year3") level = 3
		else if (body.level === "Year4") level = 4
		else if (body.level === "Year5") level = 5
		else if (body.level === "Year6") level = 6


		for (i = 0; i < questionWk.length; i++) {
			if (body.questionWk[i] === "-" || body.questionWk[i] === "W") nothing.push(questionWk[i])
			else QWk.push(questionWk[i])
		}
		var sequence = body.sequence + level + (QWk.join(""))
		if (ctx.session.admin === true) {
			const user = await new User(dbName)
			var questionTxt = { "id": body.level + body.questionWk, "level": body.level, "questionWk": body.questionWk, "Example": body.Example, "questionTitle": body.questionTitle, "sequence": sequence, "Question": body.Question, "correctAns": body.correctAns }
			await user.addQuestions(questionTxt)
			await ctx.render('addQuestion')

		}
		else await ctx.render('error', { message: "You do not have admin access" })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})



router.get('/studenttest', async ctx => {

	try {
		const body = ctx.request.body
		if (ctx.session.admin === true) await ctx.render('error', { message: "You can not take test as an admin" })
		else if (ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')

		else {
			Date.prototype.getWeek = function () {
				var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
				var dayNum = d.getUTCDay() || 7;
				d.setUTCDate(d.getUTCDate() + 4 - dayNum);
				var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
				return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
			};

			var today = new Date();
			var weekNumber = parseInt(today.getWeek());
			if (weekNumber < 10)
				weekNumber = "0" + weekNumber
			else
				weekNumber = weekNumber
			var currentWk = new Date().getFullYear() + "-W" + weekNumber

			const user = await new User(dbName)
			const getScore = await user.getScore(currentWk + ctx.session.Username)
			if (getScore === null) {
				const getQuestion = await user.getQuestions(ctx.session.StudentLvl + currentWk)
				if (getQuestion === null) return await ctx.render('StudentTest',
					{ message: "No Question is set up for week: " + currentWk, Submit: 'none' })
				await ctx.render('StudentTest',

					{ Submit: 'Block', listQuestion: Object.values(getQuestion), })
			}
			else await ctx.render('StudentTest', { message: "You have done this week's questions", Submit: 'none' })

		}
	}
	catch (err) {
		await ctx.render('error', { message: err.message })
	}

})
router.post('/studenttest', async ctx => {
	try {
		const body = ctx.request.body
		var myScore = 0, outof = 0, i;
		var Questionwk;

		Date.prototype.getWeek = function () {
			var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
			var dayNum = d.getUTCDay() || 7;
			d.setUTCDate(d.getUTCDate() + 4 - dayNum);
			var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
			return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
		};

		var today = new Date();
		var weekNumber = today.getWeek();


		if (ctx.session.admin === true) await ctx.render('error', { message: "You do not have admin access" })
		else {

			const user = await new User(dbName)

			for (i = 0; i < body.correctAns.length; i++) {
				const sequence = body.sequence[i] + ctx.session.Studentid

				if (body.StudnetAnsI[i].toUpperCase() === body.correctAns[i].toUpperCase()) {
					myScore++
					outof++
					var addFeedback = { "id": body.questionWk[i] + ctx.session.Username, "questionTitle": body.questionTitle[i], "Example": body.Example[i], "dbRef": sequence, "questionWk": body.questionWk[i], "Username": ctx.session.Username, "sequence": body.sequence[i], "question": body.question[i], "StudnetAns": body.StudnetAnsI[i], "correctAns": body.correctAns[i], "colour": "black" }
					await user.addFeedback(addFeedback)
				}
				else if (body.StudnetAnsI[i] === body.correctAns[i]) {
					myScore++
					outof++
					var addFeedback = { "id": body.questionWk[i] + ctx.session.Username, "questionTitle": body.questionTitle[i], "Example": body.Example[i], "dbRef": sequence, "questionWk": body.questionWk[i], "Username": ctx.session.Username, "sequence": body.sequence[i], "question": body.question[i], "StudnetAns": body.StudnetAnsI[i], "correctAns": body.correctAns[i], "colour": "black" }
					await user.addFeedback(addFeedback)
				} else {
					outof++
					var addFeedback = { "id": body.questionWk[i] + ctx.session.Username, "questionTitle": body.questionTitle[i], "Example": body.Example[i], "dbRef": sequence, "questionWk": body.questionWk[i], "Username": ctx.session.Username, "sequence": body.sequence[i], "question": body.question[i], "StudnetAns": body.StudnetAnsI[i], "correctAns": body.correctAns[i], "colour": "red" }
					await user.addFeedback(addFeedback)
				}
				Questionwk = body.questionWk[i]
			}
			var addScore = { "id": Questionwk + ctx.session.Username, "questionWk": Questionwk, "Username": ctx.session.Username, "Score": myScore, "Outoff": outof }
			await user.addScore(addScore)

			const checkDb = Questionwk + ctx.session.Username
			const Score = await user.getScore(checkDb)
			const Feedback = await user.getFeedback(checkDb)

			return ctx.render('StudentTest', { Submit: 'none', listQuestion1: Object.values(Feedback), myScore: Object.values(Score) })
		}

	}
	catch (err) {
		await ctx.render('error', { message: err.message })
	}

})


router.get('/Status', async ctx => {
	if (ctx.session.admin === true) await ctx.render('error', { message: "Admin does not have access to Student pages" })
	else await ctx.render('Status')
})
router.post('/Status', async ctx => {

	try {
		const body = ctx.request.body
		const Getfeedback = await new User(dbName)


		const checkDb = body.Questionwk + ctx.session.Username
		const Score = await Getfeedback.getScore(checkDb)
		const Feedback = await Getfeedback.getFeedback(checkDb)
		const Score1 = await Getfeedback.getScore2(ctx.session.Username)

		if (Score === null || Feedback === null) return await ctx.render('Status', { message: "You have not done any questions for this week: " + body.Questionwk })

		return ctx.render('Status', { Submit: 'none', listQuestion1: Object.values(Feedback), Studenscr: Object.values(Score), ScoreBar: Object.values(Score1) })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.get('/ViewQuestion', async ctx => {
	if (ctx.session.admin === true) await ctx.render('ViewQuestion')
	else await ctx.render('error', { message: "You do not have admin access" })
})
router.post('/ViewQuestion', async ctx => {

	try {
		if (ctx.session.admin === true && ctx.session.authorised === true) {
			const body = ctx.request.body

			const user = await new User(dbName)
			const getQuestion1 = await user.getQuestions(body.level + body.questionWk)
			if (getQuestion1 === null) return await ctx.render('ViewQuestion', { message: "You have not added any questions for: " + body.level + " " + body.questionWk })
			return ctx.render('ViewQuestion', { viewQuestion: getQuestion1 })
		}
		else await ctx.render('error', { message: "You do not have admin access" })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.post('/editQuestion', async ctx => {
	try {
		const user = await new User(dbName)


		const body = ctx.request.body
		if (ctx.session.admin === true && ctx.session.authorised === true) {


			var DataUpdate;

			var countDatare = body.Qid.length, i
			if (countDatare === 1) {
				var questionTxt = { "id": body.level + body.questionWk, "level": body.level, "questionWk": body.questionWk, "Example": body.Example, "questionTitle": body.questionTitle, "sequence": body.sequence, "Question": body.Question, "correctAns": body.correctAns }
				await user.addQuestions(questionTxt)
			}
			else if (countDatare >= 2) {
				for (i = 0; i < countDatare; i++) {
					var questionTxt = { "id": body.level[i] + body.questionWk[i], "level": body.level[i], "questionWk": body.questionWk[i], "Example": body.Example[i], "questionTitle": body.QuestionTitile[i], "sequence": body.sequence[i], "Question": body.Question[i], "correctAns": body.correctAns[i] }
					await user.addQuestions(questionTxt)
				}
			}
			return ctx.render(`ViewQuestion`, { viewQuestion: DataUpdate })
		}
		else await ctx.render('error', { message: "You do not have admin access" })
	} catch (err) {
		ctx.body = err.message
	}
})


router.get('/viewStudentScr', async ctx => {
	if (ctx.session.admin === true) await ctx.render('viewStudentScr')
	else if (ctx.session.admin !== true) await ctx.render('error', { message: "You do not have admin access" })

})

router.post('/viewStudentScr', async ctx => {

	try {
		const body = ctx.request.body
		const Getfeedback = await new User(dbName)


		const checkDb = body.Questionwk + body.studentUsername
		const Score = await Getfeedback.getScore(checkDb)
		const Feedback = await Getfeedback.getFeedback(checkDb)

		if (Score === null || Feedback === null) return await ctx.render('viewStudentScr', { message: "Student has not done any questions for this week: " + body.Questionwk })

		return ctx.render('viewStudentScr', { Submit: 'none', listQuestion1: Object.values(Feedback), Studenscr: Object.values(Score) })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})


router.get('/viewScore', async ctx => {
	if (ctx.session.admin === true) await ctx.render('viewScore')
	else if (ctx.session.admin !== true) await ctx.render('error', { message: "You do not have admin access" })

})

router.post('/viewScore', async ctx => {

	try {
		const body = ctx.request.body
		const Getfeedback = await new User(dbName)

		const checkDb = body.Questionwk
		const Score = await Getfeedback.getScore1(checkDb)

		if (Score === null) return await ctx.render('viewScore', { message: "Students have not done any questions for this week: " + body.Questionwk })

		return ctx.render('viewScore', { viewScore: Object.values(Score) })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.get('/editStudent', async ctx => {
	if (ctx.session.admin === true) await ctx.render('editStudent')
	else if (ctx.session.admin !== true) await ctx.render('error', { message: "You do not have admin access" })

})

router.post('/editStudent', async ctx => {

	try {
		const body = ctx.request.body
		const user = await new User(dbName)

		if (body.studentUsername === "all") {
			const getUsers = await user.getUsers1(body.level)

			if (getUsers === null) return await ctx.render('editStudent', { message: "There are no student in this level: " + body.level })

			return ctx.render('editStudent', { editStudent: Object.values(getUsers) })
		}
		else {
			const getUsers = await user.getUsers2(body.studentUsername)

			if (getUsers === null) return await ctx.render('editStudent', { message: "There are no student in this level: " + body.level })

			return ctx.render('editStudent', { editStudent: Object.values(getUsers) })

		}



	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.post('/updateStudent', async ctx => {

	try {

		const body = ctx.request.body
		const user = await new User(dbName)

		var txt = { "id": body.id, "Username": body.Username, "FName": body.FName, "LName": body.LName, "DOB": body.DOB, "level": body.level, "Email": body.Email, "Password": body.Password };
		await user.addUser(txt)

		const getUsers = await user.getUsers1(body.level)

		if (getUsers === null) return await ctx.render('editStudent', { message: "There are no student in this level: " + body.level })

		return ctx.render('editStudent', { editStudent: Object.values(getUsers) })

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})



router.get('/logout', async ctx => {
	ctx.session.authorised = null
	ctx.session.StudentLvl = null
	ctx.session.admin = null
	ctx.redirect('/?msg=you are now logged out')
})

app.use(router.routes())
module.exports = app.listen(port, async () => console.log(`listening on port ${port}`))
