/*
 * Copyright (c) 2016 TopCoder, Inc. All rights reserved.
 */

/**
 * Represents service for email notifications
 */
'use strict';

const config = require('config');
const ejs = require('ejs');
const fs = require('mz/fs');
const path = require('path');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const Joi = require('joi');

// Exports
module.exports = {
  sendMail
};


/**
 * Get nodemailer transporter for sending emails.
 * @returns {Object} an smtp transport object to send emails.
 * @private
 */
function _getTransporter() {
  return nodemailer.createTransport(smtpTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USERNAME,
      pass: config.SMTP_PASSWORD
    }
  }));
}

/**
 * Render template from jade templates.
 * @param {String} templateName The jade template filename you want to render.
 * @param {Object} context The object that you want to interpolate to the template.
 * @returns {String} the html content
 * @private
 */
function* _renderTemplate(templateName, context) {
  const filePath = path.join(__dirname, '../../email-templates/' + templateName);
  const file = yield fs.readFile(filePath, 'utf8');
  const compiledTemplate = ejs.compile(file, { filename: filePath });
  return compiledTemplate(context);
}

/**
 * Send mail (internal)
 * @param {String} from The sender of the email
 * @param {String} to The receiver of the email. It should be a valid email
 * @param {String} subject The subject of the email
 * @param {String} html The content of the email in html format
 * @private
 */
function* _sendMail(from, to, subject, html) {
  const mailOptions = { from, to, subject, html };
  const transporter = _getTransporter();
  yield transporter.sendMail.bind(transporter, mailOptions);
}

/**
 * Send mail
 * @param to the receiver of the email
 * @param type the email type
 * @param values the properties to add to templates
 */
function* sendMail(to, type, values) {
  if (process.env.DATA_GENERATOR) {
    return;
  }
  const subject = yield _renderTemplate(`${type}/subject.ejs`, values);
  const body = yield _renderTemplate(`${type}/body.ejs`, values);
  yield _sendMail(config.EMAIL_SENDER_ADDRESS, to, subject, body);
}
sendMail.schema = {
  to: Joi.string().email().required(),
  type: Joi.string().allow(['verification']).required(),
  values: Joi.object().required()
};
