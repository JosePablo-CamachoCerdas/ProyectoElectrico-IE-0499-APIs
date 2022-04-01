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

            // check that totalAmount is higher than showedAmount
            if(showedAmount>totalAmount){
                return res.status(400).json({message: 'Total amount should be higher than showed amount'})
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
            const questionnairesIds = []

            // adding ids of questionnaires assigned to users to an array
            checkRelationUserQuestionnaire.forEach( (obj) => {
                questionnairesIds.push(obj.questionnaireId)
            })


            // check questionnaires assigned for user
            const checkUserQuestionnaires = await Questionnaires.find({ '_id': { $in: questionnairesIds } }).select('_id, name')
            const questionnairesList = {
                questionnaires: checkUserQuestionnaires
            }
            if (questionnairesList.length === 0){
                res.status(400).json({message: 'User does not have questionnaires assigned'})
            }
            res.json(questionnairesList)
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    getQuestionnairesAllInfo: async (req, res) => {
        try {
            const users = await Questionnaires.find()
            res.json(users)
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
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.findOne({userId:userId, questionnaireId: questionnaireId})
            if (checkRelationUserQuestionnaire){
                return res.status(400).json({message: 'Questionnaire already assigned to user'})
            }

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
            const {userId, questionnaireId} = req.body
            // check if questionnaire exists
            const checkQuestionnaire = await Questionnaires.findById(req.body.questionnaireId)
            if(!checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire does not exists'})
            }

            // check the questionnaires assigned to user
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
                return res.status(403).json({message: 'User does not have access to this questionnaire'})
            }

            // check the answers of user on the requested questionnaire

            const checkUserQuestionnaireAnswers = await Answers.find({userId: userId, questionnaireId: questionnaireId})
            const questionUserIdRelation = []

            // if user has answered at least one question, an array of questions ids is saved
            if(checkUserQuestionnaireAnswers.length > 0) {
                checkUserQuestionnaireAnswers.forEach( (obj) => {
                    questionUserIdRelation.push(obj.questionId)
                })
            }
            console.log(checkUserQuestionnaireAnswers.length)
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
                console.log("CheckQuestions")

                // check every question available for requested questionnaire
                checkQuestions.forEach( (questionnaireQuestion) => {
                    console.log("questionnaireQuestion: " + questionnaireQuestion)
                    // if user has not answered to the respective question(taken from array of questions
                    // ids and questions available) question and respectives answers will be displayed
                    questionUserIdRelation.forEach( (userQuestionId) => {
                        console.log("userQuestionId: " + userQuestionId)
                        // user has not seen question
                        if (userQuestionId != questionnaireQuestion._id) {
                            console.log("Question new to user")
                            console.log(questionnaireQuestion._id)

                            // TODO: seems unnecesary since questions cant have less than two options
                            // check options for given available question
                            // checkOptions = await Options.find({questionId: questionnaireQuestion._id}).select('_id, optionStatement')
                            // if(checkOptions.length == 0) {
                            //     return res.status(400).json({message: 'There are no options available for this question'})
                            // }
                            console.log("Question and Check options:")
                            console.log(questionnaireQuestion)
                            console.log(checkOptions)

                            // save this user-answer relation to answer model with an empty option and postoponed as true
                            const newAnswer = new Answers({
                                userId: req.user.id,
                                optionId: "",
                                questionnaireId: req.body.questionnaireId,
                                questionId: questionnaireQuestion._id,
                                isPostponed: true
                            })
                            await newAnswer.save()
                            console.log("New Answer added")
                            console.log(newAnswer)
                            console.log("Saving new answer")

                            // create and send an object as response
                            const questionResponse = {
                                answerId: newAnswer._id,
                                statement: questionnaireQuestion,
                                options: checkOptions
                            }
                            return res.json(questionResponse)
                        } else {
                          console.log("User has already seen question")
                        }
                    })
                    console.log("Reached end of console log")
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
    },
    updateQuestion: async (req, res) => {
        try {
            const {questionnaireId, questionId, questionStatement, options} = req.body
            const checkQuestion = await Questions.findById({_id: questionId})

            // check conditions
            if(!checkQuestion) {
                return res.status(400).json({message: 'Question does not exist'})
            }

            if(options.length < 2) {
                return res.status(400).json({message: 'At least two options must be provided'})
            }

            options.forEach( (obj) => {
                if(!obj.optionStatement) {
                    return res.status(400).json({message: 'All option statements must be provided'})
                }
            })


            // update the statement of the question
            if (!questionStatement) {
                res.json({message: 'Question statement was not modified'})
            }else {
                const updateQuestion = new Questions({
                    questionStatement,
                    questionnaireId
                })
                updateQuestionContent = await Answers.findOneAndUpdate({_id: questionId}, updateQuestion)
            }


            // create options for the new question and save it for each options
            const checkNotUpdatedOptions = await Answers.find({questionId: questionId, questionnaireId: questionnaireId, isPostponed: false})
            const optionIds = []
            checkUserNotPostponedAnswers.forEach( (obj) => {
                optionIds.push(obj.optionId)
            })

            options.forEach( async (obj) => {
                const newOptions = new Options({
                    optionStatement: obj.optionStatement,
                    questionId: newQuestion._id,
                    isCorrect: obj.isCorrect
                })
                await newOptions.save()
            })

            res.json({message: 'Question and options updated'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    removeQuestionnaires: async (req, res) => {
        try {
            // get variables from body request
            const {questionnaireId} = req.body
            if(!questionnaireId) {
                return res.status(400).json({message: 'A questionnaire ID must be provided'})
            }

            // check if questionnaire already exists
            const checkQuestionnaire = await Questionnaires.findOne({_id: questionnaireId})
            if(!checkQuestionnaire) {
                return res.status(400).json({message: 'Questionnaire does not exist'})
            }
            //remove a questionnaire and all o its associations
            await Questionnaires.deleteOne({_id: questionnaireId});
            res.json({message: 'Questionnaire removed'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    removeQuestionnaireFromUser: async (req, res) => {
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
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.findOne({userId:userId, questionnaireId: questionnaireId})
            if (!checkRelationUserQuestionnaire){
                return res.status(400).json({message: 'Questionnaire not related to user'})
            }

            //remove relation between user and questionnaire
            await RelationUsersQuestionnaires.deleteOne({userId:userId, questionnaireId: questionnaireId});
            res.status(200).json({message: 'Questionnaire removed from user'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    removeQuestion: async (req, res) => {
        try {
            // get variables from body request
            const {questionId} = req.body
            if(!questionId) {
                return res.status(400).json({message: 'A question ID must be provided'})
            }

            // check if question already exists
            const checkQuestion = await Questions.findOne({_id: questionId})
            if(!checkQuestion) {
                return res.status(400).json({message: 'Question does not exist'})
            }
            //remove a question and all o its associations
            await Questions.deleteOne({_id: questionId});
            res.json({message: 'Question removed'})
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    getAllQuestions: async (req, res) => {
        try {
            const question = await Questions.find()
            res.json(question)
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
    getStats: async (req, res) => {
        var incorrectAnswers=0, correctAnswers=0
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

            // check if user has the questionnaire assigned
            const checkRelationUserQuestionnaire = await RelationUsersQuestionnaires.findOne({userId:userId, questionnaireId: questionnaireId})
            if (!checkRelationUserQuestionnaire){
                return res.status(400).json({message: 'Questionnaire not related to user'})
            }

            //totalAnswers
            const checkUserAnswers = await Answers.find({userId: userId, questionnaireId: questionnaireId})
            totalAnswers = checkUserAnswers.length

            // total amount o postponed answers
            const checkUserPostponedAnswers = await Answers.find({userId: userId, questionnaireId: questionnaireId, isPostponed: true})
            postponedAnswers = checkUserPostponedAnswers.length

            const checkUserNotPostponedAnswers = await Answers.find({userId: userId, questionnaireId: questionnaireId, isPostponed: false})
            const optionIds = []
            checkUserNotPostponedAnswers.forEach( (obj) => {
                optionIds.push(obj.optionId)
            })

            // check questionnaires assigned for user
            const optionIsCorrectArray = await Options.find({ '_id': { $in: optionIds } }).select('isCorrect')
            optionIsCorrectArray.forEach( (optionIsCorrect) => {
                if (optionIsCorrect['isCorrect']==true){
                    correctAnswers++
                }else {
                    incorrectAnswers++
                }
            })
            // creates a json object to return
            var data = {
              totalQuestionsAssigned: totalAnswers,
              postponedAnswers: postponedAnswers,
              correctAnswers: correctAnswers,
              incorrectAnswers: incorrectAnswers
            };
            res.status(200).json(data)
        } catch (err) {
            return res.status(500).json({message: err.message})
        }
    },
}

module.exports = testController
