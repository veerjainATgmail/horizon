'use strict';

/*
A nice error type that allows you to associate a file with it and
suggestions.
*/

const chalk = require('chalk');

class NiceError extends Error {
  constructor(message, options) {
    super(message);
    const opts = options || {};
    this.suggestions = opts.suggestions || null;
    this.sourceFile = opts.sourceFile || null;
    this.sourceContents = opts.sourceContents || null;
    this.sourceLine = opts.sourceLine || null;
    this.sourceColumn = opts.sourceColumn || null;
  }
  toString() {
    return this.message;
  }

  niceString(options) {
    const opts = options || {};
    const cSize = opts.contextSize != undefined ? opts.contextSize : 2;
    const results = [ this.message ];
    if (this.suggestions) {
      results.push(
        '', // extra newline before suggestions
        chalk.red(
          this.suggestions.length > 1 ? 'Suggestions:' : 'Suggestion:'));
      results.push.apply(
        results, this.suggestions.map((note) => chalk.red(` * ${note}`)));
    }
    if (this.sourceFile &&
        this.sourceContents &&
        this.sourceLine != null &&
        this.sourceColumn != null) {
      const formatted = NiceError._formatContext(
        this.sourceContents,
        this.sourceLine,
        this.sourceColumn,
        cSize
      );
      if (formatted.length > 0) {
        results.push(`\nIn ${this.sourceFile}, ` +
                     `line ${this.sourceLine}, ` +
                     `column ${this.sourceColumn}:`);
        results.push.apply(results, formatted);
      }
    }
    return results.join('\n');
  }
  static _sourceLine(ln) {
    return `${chalk.blue(`${ln.line}:`)} ${chalk.white(ln.src)}`;
  }

  static _extractContext(sourceContents, line, contextSize) {
    const lines = sourceContents.toString().split('\n');
    const minLine = Math.max(line - contextSize - 1, 0);
    const maxLine = Math.min(line + contextSize, lines.length);
    if (line > lines.length) {
      return [];
    } else {
      return lines.slice(minLine, maxLine).map((src, i) => ({
        line: i + minLine + 1,
        src,
      }));
    }
  }

  static _formatContext(sourceContents, line, col, contextSize) {
    return this._extractContext(sourceContents, line, contextSize)
      .map((srcLine) => {
        let formatted = this._sourceLine(srcLine);
        if (srcLine.line === line) {
          const prefix = `${line}: `;
          formatted +=
            `\n${' '.repeat(prefix.length + col - 1)}${chalk.green('^')}`;
        }
        return formatted;
      });
  }

}

module.exports = NiceError;
