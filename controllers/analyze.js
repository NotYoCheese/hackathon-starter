"use strict";

var Readable = require('stream').Readable;
var Scraper = require('../models/scraper')
var filesize = require('filesize');
var url = require('url');

/**
 * GET /analyze
 * Analyze page.
 */

exports.getAnalyze = function(req, res) {
    res.render('analyze', {
        title : 'Analyze',
        urlAnalyzed: 'http://direct.coinsociety.com'
    });
};

var formatUrl = function(userInput) {
  var parsedUrl = url.parse(userInput);
  if (!parsedUrl.protocol) {
      parsedUrl.protocol = 'http:';
      parsedUrl.slashes = true;
  }
  return url.format(parsedUrl);
}
exports.postAnalyze = function(req, res) {
  var scraper = Scraper.create();
  var scrapeList,
        errors;
  req.assert('site', 'Please enter a valid URL').notEmpty();
  errors = req.validationErrors();
  
  if (errors) {
      console.log('errors: ');
      console.dir(errors);
      req.flash('errors', errors);
      return res.redirect('/analyze');
  }
  
  var urlToScrape = formatUrl(req.body.site);

  scraper.analyzeSite(urlToScrape, function(err, data) {
    if (err) {
      var errorMessage = { msg: 'Error connecting to the analyzer: ' 
        + err.toString() };
      req.flash('errors', errorMessage);
      return res.redirect('/analyze');      
    }
    //console.log('data: ');
    //console.log(data);
    var analysisData = JSON.parse(data);
    if (analysisData.error != undefined) {
      var errorMessage = { msg: 'Analyzer returned error: ' 
        + analysisData.error.errors[0].message };
      req.flash('errors', errorMessage);
      return res.redirect('/analyze');      

    }

    if (analysisData !== undefined) {
      var humanReadablePageSize = filesize(
      parseInt(analysisData.pageStats.htmlResponseBytes) +
      parseInt(analysisData.pageStats.cssResponseBytes) +
      parseInt(analysisData.pageStats.imageResponseBytes) +
      parseInt(analysisData.pageStats.javascriptResponseBytes) +
      parseInt(analysisData.pageStats.otherResponseBytes));

      return res.render('analyze_results', {urlAnalyzed: urlToScrape,
        humanReadablePageSize: humanReadablePageSize,
        analysisData: analysisData});
    } else {
      return res.redir('/analyze');
    }
  });
};