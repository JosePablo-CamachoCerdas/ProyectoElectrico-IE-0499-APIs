const router = require('express').Router()
const testController = require('../controllers/testController')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')

router.post('/add_questionnaires', authAdmin, testController.addQuestionnaires)

router.get('/get_questionnaires', auth ,testController.getQuestionnaires)

router.post('/add_questionnaire_to_user', authAdmin, testController.addQuestionnaireToUser)

router.post('/get_question', auth, testController.getQuestion)

router.post('/update_answer', auth, testController.updateAnswer)

router.post('/add_question', authAdmin, testController.addQuestion)

module.exports = router