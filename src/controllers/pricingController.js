const PricingPlan = require('../models/PricingPlan');

exports.getPricingPage = async (req, res) => {
  try {
    const pricingPlans = await PricingPlan.findAll();
    res.render('pricing', {
      title: 'Pricing - PixelNest',
      pricingPlans: pricingPlans || []
    });
  } catch (error) {
    console.error('Error loading pricing:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load pricing information'
    });
  }
};

