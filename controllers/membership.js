const path = require('path');
const joi = require('../validations/joiSchemas.js');
const createError = require('http-errors');
const sendMessage = require('../utils/middleware/sendMemberEmail.js');
const validateReCaptcha = require('../utils/middleware/reCaptchaValidate.js');
const Application = require('../models/applications.js');
const Member = require('../models/members.js');

module.exports.renderMembershipPage = async (req, res, next) => {
  const errorTest = createError(404, 'This is a test error');
  // return next(errorTest);
  // console.log(createError(404, 'This is a test error'))
  // throw createError(404, 'This is a test error');

  //TODO Error Handle This
  const members = await Member.find({});
  // if (!members) throw createError(500, '')

  console.log('BELOW IS THE MEMBERS-------------------------------------'.red);
  console.log(members);
  res.render('pages/membership', { members });
};

module.exports.getMembershipBrochure = (req, res, next) => {
  //? These resolve the root directory of the project and then joins that to the location of the pdf
  const rootDir = path.resolve(__dirname, '../');
  const filePath = path.join(
    rootDir,
    '/public/assets/pdf/membership-brochure.pdf'
  );

  return res.sendFile(filePath);
};

module.exports.getLevelsBrochure = (req, res, next) => {
  //? These resolve the root directory of the project and then joins that to the location of the pdf
  const rootDir = path.resolve(__dirname, '../');
  const filePath = path.join(
    rootDir,
    '/public/assets/pdf/membership-levels.pdf'
  );

  return res.sendFile(filePath);
};

//* Membership Application Submission Functionality
module.exports.handleApplicationForm = async (req, res, next) => {
  // Honeypot Catch Field
  if (req.body.honey) {
    return res.redirect('/pages/error');
  }

  // Validate reCAPTCHA response
  const captchaValidateBoolean = await validateReCaptcha(req);

  // If reCAPTCHA validation fails, display an error message and redirect to the membership application page
  if (!captchaValidateBoolean) {
    req.flash(
      'error',
      'The captcha check failed to validate. Please retry the membership application, or contact us directly.'
    );
    return res.redirect('/membership');
  }

  const application = req.body.application;

  // Create a new Membership document based on the application data
  const newApplicationDoc = new Application(application);

  //* Make Document Error Handler
  // If there is an issue creating the new document, return an error using the next middleware function
  if (!newApplicationDoc) {
    return next(
      createError(
        500,
        'There was an issue processing your application. Please try again later.'
      )
    );
  }

  const submittedApplication = await newApplicationDoc.save();

  // Display a success message and redirect to the membership page
  req.flash(
    'success',
    `Thank you, ${application.submittedBy}, your application has been submitted! You will hear from us soon.`
  );

  //? EMAIL SENDER
  // Send an email using the application data
  sendMessage(application);

  res.redirect('/membership');
};
