const router = require('express').Router()
const testController = require('../controllers/testController')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')

router.post('/add_questionnaires', authAdmin, testController.addQuestionnaires)

router.get('/get_questionnaires', auth ,testController.getQuestionnaires)

router.get('/get_all_questionnaires', auth ,testController.getQuestionnairesAllInfo)

router.post('/add_questionnaire_to_user', authAdmin, testController.addQuestionnaireToUser)

router.post('/get_question', auth, testController.getQuestion)

router.post('/update_answer', auth, testController.updateAnswer)

router.post('/add_question', authAdmin, testController.addQuestion)

router.post('/update_question', authAdmin, testController.updateQuestion)

router.post('/remove_questionnaires', authAdmin, testController.removeQuestionnaires)

router.post('/remove_questionnaire_from_user', authAdmin, testController.removeQuestionnaireFromUser)

router.post('/remove_question', authAdmin, testController.removeQuestion)

router.get('/get_all_questions', auth, testController.getAllQuestions)

router.get('/get_stats', auth, testController.getStats)

module.exports = router
