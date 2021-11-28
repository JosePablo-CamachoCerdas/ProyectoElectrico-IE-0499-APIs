const Questionnaires = require('../models/questionnaireModel')
const Users = require('../models/userModel')
const RelationUsersQuestionnaires = require('../models/relationUserQuestionnaireModel')
const Answers = require('../models/answerModel')
const Questions = require('../models/questionModel')
const Options = require('../models/optionModel')

const testController = {
    addQuestionnaires: async (req, res) => {
        try {
            // get variables from body request
            const {name, totalAmount, showedAmount} = req.body
            if(!name) {
                return res.status(400).json({message: 'A questionnaire name must be provided'})
            }

            // check if questionnaire already exists
            const checkQuestionnaire = await Questionnaires.findOne({name})
            if(checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire already exists'})
            }

            // create a new questionnaire and save it
            const newQuestionnaire = new Questionnaires({
                name,
                totalAmount,
                showedAmount
            })
            await newQuestionnaire.save()
            res.json({message: 'New questionnaire added'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    getQuestionnaires: async (req, res) => {
        try {
            // get variables from body request
            const userId = req.user.id

            // check if user has questionnaries assigned
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.find({userId})
            if(checkRelationUserQuestionnaire.length == 0) {
                res.status(400).json({message: 'User does not have questionnaires assigned'})
            }

            // adding ids of questionnaires assigned to users to an array 
            const questionnairesIds = []
            checkRelationUserQuestionnaire.forEach( (obj) => { 
                questionnairesIds.push(obj.questionnaireId)  
            })

            // check questionnaires assigned for user
            const checkUserQuestionnaires = await Questionnaires.find({ '_id': { $in: questionnairesIds } }).select('_id, name')
            const questionnairesList = {
                questionnaires: checkUserQuestionnaires
            }
            res.json(questionnairesList)
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    addQuestionnaireToUser: async (req, res) => {
        try {
            // get variables from body request
            const {userId, questionnaireId} = req.body

            // check if user exists
            const checkUser = await Users.findOne({_id: userId})
            if(!checkUser) {
                return res.status(400).json({message: 'User does not exists'})
            }

            // check if questionnarie exists
            const checkQuestionnaire = await Questionnaires.findOne({_id: questionnaireId})
            if(!checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire does not exist'})
            }

            // check if user already has the questionnaire assigned
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.find({userId})
            checkRelationUserQuestionnaire.forEach( (obj) => { 
                if(obj.questionnaireId == questionnaireId) {
                    return res.status(400).json({message: 'Questionnaire already assigned to user'})
                }
            })

            // create and save new user-questionnaire relation
            const newRelationUsersQuestionaires = new RelationUsersQuestionnaires({
                userId,
                questionnaireId
            })
            await newRelationUsersQuestionaires.save()
            res.json({message: 'Questionnaire added to user'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    getQuestion: async(req, res) => {
        // FIXME: Create and edit logs by creating a DEBUG env variable to debug every API from console
        try {
            // check if questionnaire exists
            const checkQuestionnaire = await Questionnaires.findById(req.body.questionnaireId)
            if(!checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire does not exists'})
            }

            // check the questionnaires assigned to user
            const userId = req.user.id
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.find({userId})
            if(checkRelationUserQuestionnaire.length == 0) {
                res.status(400).json({message: 'User does not have questionnaires assigned'})
            }

            // adding ids of questionnaires assigned to users to an array 
            const questionnairesIds = []
            checkRelationUserQuestionnaire.forEach( (obj) => { 
                questionnairesIds.push(obj.questionnaireId)
            })

            // check if the user have access to the requested questionnaire
            if (!questionnairesIds.includes(req.body.questionnaireId)) {
                return res.json({message: 'User does not have access to this questionnaire'})
            }

            // check the answers of user on the requested questionnaire
            const checkUserQuestionnaireAnswers = await Answers.find({userId: userId, questionnaireId: req.body.questionnaireId})
            const questionUserIdRelation = []

            // if user has answered at least one question, an array of questions ids is saved
            if(checkUserQuestionnaireAnswers.length > 0) {
                checkUserQuestionnaireAnswers.forEach( (obj) => { 
                    questionUserIdRelation.push(obj.questionId)
                })
            }
            console.log(checkUserQuestionnaireAnswers)
            console.log(questionUserIdRelation)
            console.log("-------------------------------------")

            // if number of user answers is less than the showed amount by the questionnaire
            if (checkUserQuestionnaireAnswers.length < checkQuestionnaire.showedAmount) {

                // check the questions related to the requested questionnaire
                checkQuestions = await Questions.find({questionnaireId: req.body.questionnaireId}).select('_id questionStatement')
                if(checkQuestions.length == 0) {
                    return res.status(400).json({message: 'There are no questions available for this questionnaire'})
                }
                console.log(checkQuestions)
                
                // check every question available for requested questionnaire
                checkQuestions.forEach( (obj) => {

                    // if user has not answered to the respective question(taken from array of questions 
                    // ids and questions available) question and respectives answers will be displayed
                    questionUserIdRelation.forEach( async (questionId) => {
                        if (questionId != obj._id) {
                            console.log("Question new to user")
                            console.log(obj._id)

                            // check options for given available question
                            checkOptions = await Options.find({questionId: obj._id}).select('_id, optionStatement')
                            if(checkOptions.length == 0) {
                                return res.status(400).json({message: 'There are no options available for this question'})
                            }
                            console.log("Question and Check options:")
                            console.log(obj)
                            console.log(checkOptions)

                            // save this user-answer relation to answer model with an empty option and postoponed as true
                            const newAnswer = new Answers({
                                userId: req.user.id,
                                optionId: "",
                                questionnaireId: req.body.questionnaireId,
                                questionId: obj._id,
                                isPostponed: true
                            })
                            await newAnswer.save()
                            console.log("New Answer added")
                            console.log(newAnswer)
                            console.log("Saving new answer")

                            // create and send an object as response
                            const questionResponse = {
                                answerId: newAnswer._id,
                                statement: obj,
                                options: checkOptions
                            }
                            return res.json(questionResponse)
                        }
                    })
                })
            } else if (checkUserQuestionnaireAnswers.length >= checkQuestionnaire.showedAmount) {

                // check for user's answers that are postponed
                const checkUserPostponeAnswers = await Answers.find({userId: userId, questionnaireId: req.body.questionnaireId, isPostponed: true})
                
                // if user has at least one postponed question, an array of questions ids is saved
                if(checkUserPostponeAnswers.length > 0) {
                    const questionUserIdPostponedRelation = []
                    const answerUserQuestionRelationId = []
                    checkUserPostponeAnswers.forEach( (obj) => { 
                        questionUserIdPostponedRelation.push(obj.questionId)
                        answerUserQuestionRelationId.push(obj._id)
                    })
                    console.log("Postponed answers")
                    console.log(checkUserPostponeAnswers)
                    
                    console.log("Postponed questions ids:")
                    console.log(questionUserIdPostponedRelation)

                    console.log("Postponed answer question relation ids:")
                    console.log(answerUserQuestionRelationId)

                    const checkPostponedQuestions = await Questions.find({_id: {$in: questionUserIdPostponedRelation}})
                    
                    checkPostponedQuestions.forEach( async (question, index) => {
                        console.log("Postponed questions statement:")
                        console.log(question.questionStatement)

                        // check options for given available question
                        checkOptions = await Options.find({questionId: question._id}).select('_id, optionStatement')
                        console.log("Options statement:")
                        console.log(checkOptions)

                        // create and send an object as response
                        const questionResponse = {
                            answerId: answerUserQuestionRelationId[index],
                            statement: question.questionStatement,
                            options: checkOptions
                        }
                        return res.json(questionResponse)
                    })

                // if there are no postponed questions, response with done message(no more questions available)
                } else if (checkUserPostponeAnswers.length <= 0) {
                    return res.json({message: 'There are no questions left to show to this user related to the requested questionnaire'})
                }
            }
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    updateAnswer: async (req, res) => {
        try {
            const {answerId, optionId} = req.body
            checkOptions = await Options.findById({_id: optionId})
            if(!checkOptions) {
                return res.status(400).json({message: 'Option provided does not exist'})
            }

            const updateAnswer = {
                optionId: optionId,
                isPostponed: false
            }
            checkUserAnswerRelation = await Answers.findOneAndUpdate({_id: answerId, userId: req.user.id}, updateAnswer)
            if(!checkUserAnswerRelation) {
                return res.status(400).json({message: 'Answer does not match with user records'})
            }

            res.json({message: 'Answer updated'})
        } catch (err) {
            return res.status(500).json({message: err.message}) 
        }
    },
    addQuestion: async (req, res) => {
        try {
            const {questionnaireId, questionStatement, options} = req.body
            const checkQuestionnaire = await Questionnaires.findById({ '_id': questionnaireId})

            // check conditions 
            if(!checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire does not exist'})
            }

            if(!questionStatement) {
                return res.status(400).json({message: 'A question statement must be provided'})
            }

            if(options.length < 2) {
                return res.status(400).json({message: 'At least two options must be provided'})
            }

            options.forEach( (obj) => {
                if(!obj.optionStatement) {
                    return res.status(400).json({message: 'All options must be provided'})
                }
            })

            // create a new question and save it
            const newQuestion = new Questions({
                questionStatement,
                questionnaireId
            })
            await newQuestion.save()

            // create options for the new question and save it for each options
            options.forEach( async (obj) => { 
                const newOptions = new Options({
                    optionStatement: obj.optionStatement,
                    questionId: newQuestion._id,
                    isCorrect: obj.isCorrect
                })
                await newOptions.save()
            })
        
            res.json({message: 'Question and options added'})
        } catch (err) {
            return res.status(500).json({message: err.message}) 
        }
    }
}

module.exports = testController