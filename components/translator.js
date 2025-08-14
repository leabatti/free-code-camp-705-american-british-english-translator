const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require('./american-to-british-titles.js');
const britishOnly = require('./british-only.js');

// Utility function to reverse the keys and values of a dictionary
const reverseDict = (obj) => {
  return Object.assign(
    {},
    ...Object.entries(obj).map(([key, value]) => ({ [value]: key }))
  );
};

class Translator {
  // Converts American English text to British English
  toBritishEnglish(text) {
    const dict = { ...americanOnly, ...americanToBritishSpelling };
    const titles = americanToBritishTitles;
    const timeRegex = /([1-9]|1[012]):[0-5][0-9]/g; // Matches time format like "12:30"
    const translated = this.translate(
      text,
      dict,
      titles,
      timeRegex,
      'toBritish'
    );

    // If no translation occurred, return original text
    if (!translated) {
      return [text, text];
    }

    return translated;
  }

  // Converts British English text to American English
  toAmericanEnglish(text) {
    const dict = { ...britishOnly, ...reverseDict(americanToBritishSpelling) };
    const titles = reverseDict(americanToBritishTitles);
    const timeRegex = /([1-9]|1[012])[.:][0-5][0-9]/g; // Matches time format like "12.30" or "12:30"
    const translated = this.translate(
      text,
      dict,
      titles,
      timeRegex,
      'toAmerican'
    );

    // If no translation occurred, return original text
    if (!translated) {
      return [text, text];
    }

    return translated;
  }

  // Core translation logic used by both directions
  translate(text, dict, titles, timeRegex, locale) {
    const lowerText = text.toLowerCase();
    const matchesMap = {};

    // Step 1: Handle honorific titles (e.g., "Mr." vs "Mr")
    Object.entries(titles).forEach(([key, value]) => {
      if (locale === 'toBritish') {
        const american = key.charAt(0).toUpperCase() + key.slice(1);
        const british = value.charAt(0).toUpperCase() + value.slice(1);
        matchesMap[american.toLowerCase()] = british;
        matchesMap[american.replace('.', '').toLowerCase()] = british;
      } else {
        const britNoDot = key.charAt(0).toUpperCase() + key.slice(1);
        const amerWithDot = value.charAt(0).toUpperCase() + value.slice(1);
        matchesMap[britNoDot.toLowerCase()] = amerWithDot;
        matchesMap[(britNoDot + '.').toLowerCase()] = amerWithDot;
      }
    });

    // Step 2: Handle multi-word expressions (e.g., "parking lot")
    Object.entries(dict).forEach(([key, value]) => {
      if (key.includes(' ') && lowerText.includes(key)) {
        matchesMap[key] = value;
      }
    });

    // Step 3: Handle single words and compound words
    lowerText.match(/(\w+([-'])(\w+)?['-]?(\w+))|\w+/g)?.forEach((word) => {
      if (dict[word]) {
        matchesMap[word] = dict[word];
      }
    });

    // Step 4: Handle time format conversion (e.g., "12:30" ↔ "12.30")
    const matchedTimes = lowerText.match(timeRegex);
    if (matchedTimes) {
      matchedTimes.forEach((e) => {
        matchesMap[e] =
          locale === 'toBritish' ? e.replace(':', '.') : e.replace('.', ':');
      });
    }

    // Step 5: If no matches found, return null to indicate no translation
    if (Object.keys(matchesMap).length === 0) {
      return null;
    }

    // Step 6: Replace matched terms in the original text
    const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const sortedKeys = Object.keys(matchesMap)
      .sort((a, b) => b.length - a.length) // Longer matches first to avoid partial replacements
      .map(escapeRegex);

    const re = new RegExp(sortedKeys.join('|'), 'gi');

    const translation = text.replace(
      re,
      (matched) => matchesMap[matched.toLowerCase()]
    );

    const translationWithHighlight = text.replace(
      re,
      (matched) =>
        `<span class="highlight">${matchesMap[matched.toLowerCase()]}</span>`
    );

    return [translation, translationWithHighlight];
  }

  // Utility to replace all matches without highlighting
  replaceAll(text, matchesMap) {
    const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(
      Object.keys(matchesMap).map(escapeRegex).join('|'),
      'gi'
    );

    return text.replace(re, (matched) => {
      return `<span class="highlight">${
        matchesMap[matched.toLowerCase()]
      }</span>`;
    });
  }

  // Utility to replace all matches with highlight markup
  replaceAllWithHighlight(text, matchesMap) {
    const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(
      Object.keys(matchesMap).map(escapeRegex).join('|'),
      'gi'
    );

    return text.replace(re, (matched) => {
      return `<span class="highlight">${
        matchesMap[matched.toLowerCase()]
      }</span>`;
    });
  }
}

module.exports = Translator;
