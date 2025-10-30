const Service = require('../models/Service');
const Testimonial = require('../models/Testimonial');
const PricingPlan = require('../models/PricingPlan');

exports.getHomePage = async (req, res) => {
  try {
    const services = await Service.findAll();
    const testimonials = await Testimonial.findFeatured();
    const pricingPlans = await PricingPlan.findAll();

    res.render('index', {
      title: 'PixelNest - AI Automation Solutions',
      services: services || [],
      testimonials: testimonials || [],
      pricingPlans: pricingPlans || []
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load page content'
    });
  }
};

exports.getAboutPage = (req, res) => {
  res.render('about', {
    title: 'About Us - PixelNest'
  });
};

// Legal pages
exports.getPrivacyPolicy = (req, res) => {
  res.render('privacy-policy', {
    title: 'Privacy Policy - PixelNest'
  });
};

exports.getTermsOfService = (req, res) => {
  res.render('terms-of-service', {
    title: 'Terms of Service - PixelNest'
  });
};

exports.getCookiePolicy = (req, res) => {
  res.render('cookie-policy', {
    title: 'Cookie Policy - PixelNest'
  });
};

exports.getGDPR = (req, res) => {
  res.render('gdpr', {
    title: 'GDPR Compliance - PixelNest'
  });
};

// Resource pages
exports.getPricingPage = (req, res) => {
  res.render('pricing-page', {
    title: 'Harga - PixelNest',
    currentPath: req.path,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null
  });
};

exports.getDocumentation = (req, res) => {
  res.render('documentation', {
    title: 'Documentation - PixelNest'
  });
};

exports.getCaseStudies = (req, res) => {
  res.render('case-studies', {
    title: 'Case Studies - PixelNest'
  });
};

exports.getFAQ = (req, res) => {
  res.render('faq', {
    title: 'FAQ - PixelNest'
  });
};

// Company pages
exports.getAboutUs = (req, res) => {
  res.render('about-us', {
    title: 'About Us - PixelNest'
  });
};

exports.getOurProcess = (req, res) => {
  res.render('our-process', {
    title: 'Our Process - PixelNest'
  });
};

exports.getContactPage = (req, res) => {
  res.render('contact-page', {
    title: 'Contact Us - PixelNest'
  });
};

// Service pages
exports.getAllServices = (req, res) => {
  res.render('all-services', {
    title: 'All Services - PixelNest'
  });
};

exports.getWorkflowAutomation = (req, res) => {
  res.render('workflow-automation', {
    title: 'Workflow Automation - PixelNest'
  });
};

exports.getCustomAISolutions = (req, res) => {
  res.render('custom-ai-solutions', {
    title: 'Custom AI Solutions - PixelNest'
  });
};

exports.getAIAssistant = (req, res) => {
  res.render('ai-assistant', {
    title: 'AI Assistant - PixelNest'
  });
};

