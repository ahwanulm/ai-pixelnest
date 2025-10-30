const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');

exports.getContactPage = (req, res) => {
  res.render('contact', {
    title: 'Contact Us - PixelNest',
    errors: [],
    formData: {}
  });
};

exports.submitContactForm = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('contact', {
      title: 'Contact Us - PixelNest',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const contactData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || null,
      company: req.body.company || null,
      message: req.body.message
    };

    await Contact.create(contactData);

    res.render('contact-success', {
      title: 'Thank You - PixelNest',
      name: contactData.name
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.render('contact', {
      title: 'Contact Us - PixelNest',
      errors: [{ msg: 'Failed to submit form. Please try again.' }],
      formData: req.body
    });
  }
};

