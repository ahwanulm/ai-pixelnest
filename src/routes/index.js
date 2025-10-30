const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Home page
router.get('/', indexController.getHomePage);

// About page
router.get('/about', indexController.getAboutPage);

// Legal pages
router.get('/privacy-policy', indexController.getPrivacyPolicy);
router.get('/terms-of-service', indexController.getTermsOfService);
router.get('/cookie-policy', indexController.getCookiePolicy);
router.get('/gdpr', indexController.getGDPR);

// Resource pages
router.get('/pricing-page', indexController.getPricingPage);
router.get('/documentation', indexController.getDocumentation);
router.get('/case-studies', indexController.getCaseStudies);
router.get('/faq', indexController.getFAQ);

// Company pages
router.get('/about-us', indexController.getAboutUs);
router.get('/our-process', indexController.getOurProcess);
router.get('/contact-page', indexController.getContactPage);

// Service pages
router.get('/all-services', indexController.getAllServices);
router.get('/workflow-automation', indexController.getWorkflowAutomation);
router.get('/custom-ai-solutions', indexController.getCustomAISolutions);
router.get('/ai-assistant', indexController.getAIAssistant);

module.exports = router;

