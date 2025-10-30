const Service = require('../models/Service');

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.render('services', {
      title: 'Our Services - PixelNest',
      services: services || []
    });
  } catch (error) {
    console.error('Error loading services:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load services'
    });
  }
};

exports.getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findBySlug(req.params.slug);
    
    if (!service) {
      return res.status(404).render('404', {
        title: 'Service Not Found',
        message: 'The service you are looking for does not exist.'
      });
    }

    res.render('service-detail', {
      title: `${service.title} - PixelNest`,
      service
    });
  } catch (error) {
    console.error('Error loading service:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load service details'
    });
  }
};

