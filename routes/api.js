'use strict';

const Translator = require('../components/translator.js');

module.exports = function (app) {
  const translator = new Translator();

  app.route('/api/translate').post((req, res) => {
    const { text, locale } = req.body;

    // Validation: Check if required fields are present
    if (!locale || text === undefined) {
      return res.json({ error: 'Required field(s) missing' });
    }

    // Validation: Check if text is empty
    if (text === '') {
      return res.json({ error: 'No text to translate' });
    }

    let translation = [];

    // Perform translation based on the locale
    if (locale === 'american-to-british') {
      translation = translator.toBritishEnglish(text);
    } else if (locale === 'british-to-american') {
      translation = translator.toAmericanEnglish(text);
    } else {
      // Invalid locale value
      res.json({ error: 'Invalid value for locale field' });
      return;
    }

    const [plain, highlighted] = translation;

    // If no translation occurred
    if (!plain || plain === text) {
      return res.json({ text, translation: 'Everything looks good to me!' });
    }

    // If translation occurred
    return res.json({ text, translation: highlighted });
  });
};
